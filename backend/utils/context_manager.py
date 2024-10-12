# utils/context_manager.py

class InterviewContextManager:
    def __init__(self):
        self.questions = []
        self.responses = []
        self.interviewer_instructions = "Perform a mock interview with user.\n"

    
    def set_interviewer_instructions(self, instructions):
        """
        Set the initial instructions for the interviewer.
        """
        self.interviewer_instructions = "Perform a interview, here's decription for user: " + instructions + "\n" + "Ask first question. Respond in really short sentences."

    def add_question(self, question):
        """
        Add a question and response to the conversation history.
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
        context = self.interviewer_instructions + "\n\n"
        for question, response in zip(self.questions, self.responses):
            context += f"Q: {question}\nA: {response}\n"
        
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
        self.interviewer_instructions = ""
