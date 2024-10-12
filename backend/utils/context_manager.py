class InterviewContextManager:
    def __init__(self):
        self.questions = []
        self.responses = []
        self.interviewer_instructions = "Perform a mock interview with the user.\n"

    def set_interviewer_instructions(self, instructions):
        """
        Set the initial instructions for the interviewer.
        """
        self.interviewer_instructions = (
            "You are conducting a technical interview. Here's the user's description: " 
            + instructions 
            + "\nYour job is to assess if the user has the skills they claim. "
            + "Ask technical questions, one at a time, in clear and concise sentences. "
            + "Keep your responses short and focused.\n\n"
        )

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
        context = self.interviewer_instructions + "\n"
        context += "(The following context is provided to help you avoid repetition. Please continue with the next question.)\n"
        
        # Limit context to the last 3-5 turns to avoid overloading the model.
        max_history = 10
        recent_questions = self.questions[-max_history:]
        recent_responses = self.responses[-max_history:]

        for question, response in zip(recent_questions, recent_responses):
            context += f"Q: <q>{question}</q>\nA: <a>{response}</a>\n"
        context += "Q:"  # Prepares the model to ask the next question
        return context

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
        self.interviewer_instructions = "Perform a mock interview with the user.\n"
