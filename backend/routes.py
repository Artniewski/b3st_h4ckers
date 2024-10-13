from flask import request, jsonify, send_file
from utils.speech_utils import convert_speech_to_text_whisper, generate_ai_response_llama, convert_text_to_speech
from utils.context_manager import InterviewContextManager
import tempfile
import os

RESPONSE_FOLDER = 'responses'

# Create an instance of the InterviewContextManager
context_manager = InterviewContextManager()

def init_routes(app):
    
    @app.route('/interviews', methods=['GET'])
    def list_snapshots():
        """
        Endpoint to list all available interview snapshots with MP3 paths.
        """
        snapshots = context_manager.list_all_snapshots()
        return jsonify(snapshots)
    

    @app.route('/interviews/<snapshot_id>', methods=['GET'])
    def get_snapshot(snapshot_id):
        """
        Endpoint to get a specific interview snapshot by ID.
        """
        snapshot = context_manager.get_snapshot(snapshot_id)
        if snapshot:
            return jsonify(snapshot)
        else:
            return jsonify({"error": "Snapshot not found"}), 404


    @app.route('/end_interview', methods=['POST'])
    def end_interview():
        # Call the method to end the interview and get the AI-generated summary
        summary = context_manager.end_interview_and_get_summary()
        context_manager.save_interview_snapshot(summary)
        # Return the summary in the response
        return jsonify({"summary": summary})


    @app.route('/mp3/responses/<filename>', methods=['GET'])
    def download_file(filename):
        file_path = f"responses/{filename}"  # Path to your MP3 files

        return send_file(file_path, as_attachment=True)


    # Route to set interviewer instructions
    @app.route('/details', methods=['POST'])
    def set_instructions():
        context_manager.clear_context()
        data = request.get_json()
        instructions = str(data)
        context_manager.set_interviewer_instructions(instructions, data)
                # Build context for the AI response
        conversation_context = context_manager.build_conversation_context()

        # Get AI response from Llama API, including the context
        ai_response = generate_ai_response_llama(conversation_context)

        # Add question and response to the context manager
        context_manager.add_question(ai_response)

        # Convert AI response to MP3 (TTS)
        response_mp3_path = convert_text_to_speech(ai_response)

        # Check if the MP3 was saved successfully
        if response_mp3_path:
            context_manager.add_mp3_path(response_mp3_path)
            return jsonify({
                "body": {
                    "ai_response": ai_response,
                    "audio": response_mp3_path  
                }
            }), 200
        else:
            return jsonify({"error": "Failed to save AI response as MP3"}), 500
    

    # Route to clear the conversation context
    @app.route('/clear_state', methods=['POST'])
    def clear_state():
        context_manager.clear_context()
        return jsonify({"message": "Conversation context cleared."}), 200


    @app.route('/process_audio', methods=['POST'])
    def process_audio():
        if 'file' not in request.files:
            return jsonify({"error": "No file provided in the request"}), 400

        # Get the uploaded file from the request (which is a .wav file)
        file = request.files['file']

        # Save the uploaded file temporarily as a WAV file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav_file:
            file.save(temp_wav_file.name)
            temp_wav_path = temp_wav_file.name

        # Convert audio to text (STT) using Whisper
        transcript = convert_speech_to_text_whisper(temp_wav_path)

        if not transcript:
            return jsonify({"error": "Could not transcribe the audio"}), 500

        context_manager.add_response(transcript)

        # Build context for the AI response
        conversation_context = context_manager.build_conversation_context()

        # Get AI response from Llama API, including the context
        ai_response = generate_ai_response_llama(conversation_context)

        # Add question and response to the context manager
        context_manager.add_question(ai_response)

        # Convert AI response to MP3 (TTS)
        response_mp3_path = convert_text_to_speech(ai_response)

        print(context_manager.build_conversation_context())
        # Check if the MP3 was saved successfully
        if response_mp3_path:
            context_manager.add_mp3_path(response_mp3_path)
            return jsonify({
                "body": {
                    "transcript": transcript,
                    "ai_response": ai_response,
                    "audio": response_mp3_path  
                }
            }), 200
        else:
            return jsonify({"error": "Failed to save AI response as MP3"}), 500
