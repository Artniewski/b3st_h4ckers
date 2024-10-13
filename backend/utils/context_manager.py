import requests
import os
import uuid
import json

class InterviewContextManager:
    def __init__(self):
        self.questions = []
        self.responses = []
        self.user = {}
        self.mp3_paths = []  # Store MP3 file paths for responses
        self.interviewer_instructions = "Perform a mock interview with the user.\n"
        self.snapshot_folder = 'interview_snapshots'
        if not os.path.exists(self.snapshot_folder):
            os.makedirs(self.snapshot_folder)

    def add_mp3_path(self, path):
        """
        Add the path to the MP3 file for a response.
        """
        self.mp3_paths.append(path)

    def save_interview_snapshot(self, ai_summary):
        """
        Save the entire interview (questions, responses, AI summary, and MP3 paths) to a file and return the snapshot ID.
        """
        snapshot_data = {
            "title": self.user.get("name", "User")+ "'s " + self.user.get("skills", "Interview"),
            "questions": self.questions,
            "responses": self.responses,
            "mp3_paths": self.mp3_paths,  # Save MP3 paths
            "ai_summary": ai_summary
        }

        # Generate a unique ID for the snapshot
        snapshot_id = str(uuid.uuid4())
        snapshot_file = os.path.join(self.snapshot_folder, f"{snapshot_id}.json")

        # Save to file
        with open(snapshot_file, 'w') as file:
            json.dump(snapshot_data, file)

        return snapshot_id

    def list_all_snapshots(self):
        """
        List all snapshots in the snapshots folder.
        """
        snapshots = []
        for filename in os.listdir(self.snapshot_folder):
            if filename.endswith('.json'):
                snapshot_id = filename.split(".")[0]
                snapshot_file = os.path.join(self.snapshot_folder, filename)

                # Load the snapshot metadata
                with open(snapshot_file, 'r') as file:
                    snapshot_data = json.load(file)
                    snapshots.append({
                        "snapshot_id": snapshot_id,
                        "title": snapshot_data.get("title", "Interview"),
                        "questions": snapshot_data.get("questions", []),
                        "responses": snapshot_data.get("responses", []),
                        "mp3_paths": snapshot_data.get("mp3_paths", []),  # Include MP3 paths in the response
                        "ai_summary": snapshot_data.get("ai_summary", "No summary available")
                    })

        return snapshots
    
    def get_snapshot(self, snapshot_id):
        """
        Get a specific snapshot by ID.
        """
        snapshot_file = os.path.join(self.snapshot_folder, f"{snapshot_id}.json")

        if os.path.exists(snapshot_file):
            with open(snapshot_file, 'r') as file:
                snapshot_data = json.load(file)
                return {
                    "snapshot_id": snapshot_id,
                    "title": snapshot_data.get("title", "Interview"),
                    "questions": snapshot_data.get("questions", []),
                    "responses": snapshot_data.get("responses", []),
                    "mp3_paths": snapshot_data.get("mp3_paths", []),  # Include MP3 paths in the response
                    "ai_summary": snapshot_data.get("ai_summary", "No summary available")
                }
        else:
            return None

    def set_interviewer_instructions(self, instructions, data):
        """
        Set the initial instructions for the interviewer.
        """
        self.user = data
        self.interviewer_instructions = "You are conducting a technical interview. Here's the user's description: " + instructions + "\nYour job is to assess if the user has the skills they claim. "+ "Ask technical questions, one at a time, in clear and concise sentences. "+ "Keep your responses short and focused.\n\n"
        
    def add_question(self, question):
        """
        Add a question to the conversation history.
        """
        self.questions.append(question)

    def add_response(self, response):
        """
        Add a response to the conversation history.
        """
        self.responses.append(response)

    def build_conversation_context(self):
        """
        Build a context string to feed to the AI, including all questions and responses.
        """
        messages = []
        # messages.append({"role": "system", "content": self.interviewer_instructions.replace("'", "\\'").replace('"', '\\"')})
        # context = self.interviewer_instructions + "\n"
        # context = "(The following context is provided to help you avoid repetition. Please continue with the next question.)\n"
        messages.append({"role": "system", "content": "Perform a mock interview with the user about skills from their description, ask short technical questions, one at a time, and respond in concise sentences. User has only voice interface, don't ask to write code."})
        messages.append({"role": "user", "content": f"Here are details about me: {self.interviewer_instructions}."})
        # Limit context to the last 3-5 turns to avoid overloading the model.
        # max_history = 10
        # recent_questions = self.questions[-max_history:]
        # recent_responses = self.responses[-max_history:]

        for question, response in zip(self.questions, self.responses):
            messages.append({"role": "assistant", "content": question.replace("'", "\'").replace('"', '\"')})
            messages.append({"role": "user", "content": response.replace("'", "\'").replace('"', '\"')})
        # for question, response in zip(recent_questions, recent_responses):
        #     context += f"Q: <q>{question}</q>\nA: <a>{response}</a>\n"
        # context += "Q:"  # Prepares the model to ask the next question
        # messages.append({
        #     "role": "system",
        #     "content": "You are conducting a technical interview. Ask technical questions, one at a time, and respond in concise sentences."})

        return messages

    def has_asked_question(self, question):
        """
        Check if the question has already been asked.
        """
        return question in self.questions

    def clear_context(self):
        """
        Clears the current conversation context and instructions.
        """
        self.questions.clear()
        self.responses.clear()
        self.mp3_paths.clear()
        self.user = {}
        self.interviewer_instructions = "Perform a mock interview with the user.\n"

    def end_interview_and_get_summary(self):
        """
        Ends the interview, sends the conversation context to the AI, and gets a summary with a percentage score.
        """
        messages = self.build_conversation_context()

        # Prepare the AI request for generating a summary and score
        data = {
            "model": "llama3.2",
            "prompt": f"'{messages}'\n\nSummarize the interview. What aspects were covered, and how did the user perform? Provide a percentage score of the user's performance. Did the user pass the interview? Write summary for each skill from users skills and return a final score. Be very strict in your evaluation.",
            "stream": False
        }

        try:
            # Send the request to the AI /generate endpoint
            response = requests.post("http://localhost:11434/api/generate", json=data, headers={"Content-Type": "application/json"})
            
            # Parse the response
            if response.status_code == 200:
                response_json = response.json()
                ai_response = response_json.get("response", "Llama API did not return a valid response.")
                print(f"Interview Summary: {ai_response}")
                return ai_response
            else:
                print(f"Error from AI: {response.status_code}")
                return "Error: Could not get a valid response from AI."

        except requests.exceptions.RequestException as e:
            print(f"Error connecting to AI: {e}")
            return "Error: Unable to connect to the AI model."
        