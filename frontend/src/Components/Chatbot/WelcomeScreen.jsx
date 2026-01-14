import React from 'react';
import ChatInput from './ChatInput';

const WelcomeScreen = ({ chatbot, theme }) => {
    return (
        <div className="welcome-screen">
            <div className="welcome-content">
                <h1 className="welcome-greeting">
                    Hey, Sahil. Ready to dive in?
                </h1>

                <div className="centered-input-wrapper">
                    <ChatInput
                        userQueryInput={chatbot.userQueryInput}
                        handleUserInputChange={chatbot.handleUserInputChange}
                        handleKeyPress={chatbot.handleKeyPress}
                        handleSendMessage={chatbot.handleSendMessage}
                        processingUserQuery={chatbot.processingUserQuery}
                        disableInput={chatbot.disableInput}
                        selectedModel={chatbot.selectedModel}
                        handleModelChoose={chatbot.handleModelChoose}
                        isCentered={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
