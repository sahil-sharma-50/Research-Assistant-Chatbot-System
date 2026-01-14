class ConversationManager:
    """Manages conversation history between the User and the Chatbot."""
    
    def __init__(self):
        """Initializes an empty list of dict to store conversation history."""
        self.history = []

    def add_to_history(self, user_query: str, response: str):
        """Adds a user query and corresponding AI response to the conversation history."""
        self.history.append({"user": user_query, "ai": response})

    def get_history(self):
        """ Returns the conversation history. """
        return self.history

    def clear_history(self):
        """ Clears the conversation history. """
        self.history = []
