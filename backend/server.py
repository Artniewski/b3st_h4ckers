from flask import Flask, request, jsonify, send_file
from gtts import gTTS
import os
import whisper
import requests
import pyttsx3
import tempfile
from pydub import AudioSegment
import json


app = Flask(__name__)

# Path to save processed files
RESPONSE_FOLDER = 'responses'
if not os.path.exists(RESPONSE_FOLDER):
    os.makedirs(RESPONSE_FOLDER)

# Initialize Whisper model for speech recognition
whisper_model = whisper.load_model("base")  # You can use 'tiny', 'base', 'small', 'medium', or 'large'

# Llama API URL
LLAMA_API_URL = "http://localhost:11434/api/generate"

@app.route('/process_audio', methods=['POST'])
def process_audio():
    data = request.get_json()
    if 'file_path' not in data:
        return jsonify({"error": "No file_path provided in the request"}), 400

    file_path = data['file_path']

    # Validate if the provided path exists
    if not os.path.isfile(file_path):
        return jsonify({"error": f"File does not exist at the given path: {file_path}"}), 400

    # Convert MP3 to WAV for processing
    wav_path = convert_mp3_to_wav(file_path)

    # Convert audio to text (STT) using Whisper
    transcript = convert_speech_to_text_whisper(wav_path)

    if not transcript:
        return jsonify({"error": "Could not transcribe the audio"}), 500

    # Get AI response from Llama API
    ai_response = generate_ai_response_llama(transcript)

    # Convert AI response to MP3 (TTS)
    response_mp3_path = convert_text_to_speech(ai_response)

    # Check if the MP3 was saved successfully
    if response_mp3_path:
        # return send_file(response_mp3_path, as_attachment=True)
        return jsonify({"body": 
                        {
                         "transcript": transcript,
                            "ai_response": ai_response,
                            "response_mp3_path": response_mp3_path  
                        }
                        }), 200
    else:
        return jsonify({"error": "Failed to save AI response as MP3"}), 500

def convert_mp3_to_wav(mp3_path):
    """
    Converts MP3 to WAV for processing with Whisper.
    """
    wav_path = mp3_path.replace('.mp3', '.wav')
    audio = AudioSegment.from_mp3(mp3_path)
    audio.export(wav_path, format="wav")
    return wav_path


def convert_speech_to_text_whisper(wav_path):
    """
    Converts speech to text using OpenAI's Whisper model.
    """
    result = whisper_model.transcribe(wav_path, language='en')
    transcript = result['text']
    print(f"Transcribed Text: {transcript}")
    return transcript


def generate_ai_response_llama(transcript):
    """
    Sends the transcribed text to the Llama API and returns only the generated response.
    """
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"  # Expect JSON response
    }
    data = {
        "model": "llama3.2",  # Change this to the specific model you're using
        "prompt": transcript,
        "stream": False  # Get response in a single object
    }

    try:
        response = requests.post("http://localhost:11434/api/generate", headers=headers, json=data)

        # Decode the byte response and parse as JSON
        response_json = json.loads(response.content.decode('utf-8'))

        # Extract the 'response' field from the JSON object
        ai_response = response_json.get("response", "Llama API did not return a valid response.")
        print(f"Llama AI Response: {ai_response}")
        
        return ai_response  # Return only the text for TTS

    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Llama API: {e}")
        return "Error: Unable to connect to the AI model."

    except ValueError as ve:
        print(f"Error parsing response as JSON: {ve}")
        return "Error: The API did not return valid JSON."


def convert_text_to_speech(text):
    """
    Converts text to speech using gTTS and saves it as an MP3 file.
    """
    # Ensure the RESPONSE_FOLDER exists before saving the MP3 file
    if not os.path.exists(RESPONSE_FOLDER):
        os.makedirs(RESPONSE_FOLDER)

    # Path to save the MP3 file
    mp3_path = os.path.join(RESPONSE_FOLDER, 'response.mp3')

    try:
        # Use gTTS to convert text to speech and save as MP3
        tts = gTTS(text, lang='en', tld='co.uk')
        tts.save(mp3_path)

        # Check if the MP3 file was created successfully
        if os.path.isfile(mp3_path):
            print(f"MP3 file saved successfully at {mp3_path}")
            return mp3_path
        else:
            print(f"Failed to save MP3 file at {mp3_path}")
            return None

    except Exception as e:
        print(f"Error while saving MP3 file: {e}")
        return None

if __name__ == '__main__':
    app.run(debug=True)
