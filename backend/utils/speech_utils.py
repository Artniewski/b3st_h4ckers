import whisper
import requests
import json
import os
import uuid
from gtts import gTTS

RESPONSE_FOLDER = 'responses'

# Initialize Whisper model
whisper_model = whisper.load_model("base")  # You can use 'tiny', 'base', 'small', 'medium', or 'large'

LLAMA_API_URL = "http://localhost:11434/api/generate"


def convert_speech_to_text_whisper(wav_path):
    """
    Converts speech to text using Whisper model.
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
        "Accept": "application/json"
    }
    data = {
        "model": "llama3.2",
        "prompt": transcript,
        "stream": False
    }

    try:
        response = requests.post(LLAMA_API_URL, headers=headers, json=data)

        # Decode the byte response and parse as JSON
        response_json = json.loads(response.content.decode('utf-8'))

        # Extract the 'response' field from the JSON object
        ai_response = response_json.get("response", "Llama API did not return a valid response.")
        print(f"Llama AI Response: {ai_response}")
        return ai_response

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
    mp3_path = os.path.join(RESPONSE_FOLDER, f"{uuid.uuid4()}.mp3")

    try:
        # Use gTTS to convert text to speech and save as MP3
        tts = gTTS(text, lang='en', tld='co.uk')
        tts.save(mp3_path)

        if os.path.isfile(mp3_path):
            print(f"MP3 file saved successfully at {mp3_path}")
            return mp3_path
        else:
            print(f"Failed to save MP3 file at {mp3_path}")
            return None

    except Exception as e:
        print(f"Error while saving MP3 file: {e}")
        return None
