import React from 'react';

const ChatInput = ({ userQueryInput, handleUserInputChange, handleKeyPress, handleSendMessage, processingUserQuery, disableInput, selectedModel, handleModelChoose, isCentered }) => {
    return (
        <div className="chat-input-container">
            <div className="chat-input-flex-row">
                <div className="chat-input-wrapper">
                    {!isCentered && <i className="fas fa-plus landing-plus-icon"></i>}
                    <textarea
                        id="textarea"
                        rows="1"
                        value={userQueryInput}
                        onChange={handleUserInputChange}
                        onKeyDown={handleKeyPress}
                        placeholder={isCentered ? "Enter your query..." : "Ask anything..."}
                        disabled={disableInput}
                    />
                    {!isCentered && (
                        <div className="chat-input-right-side">
                            <i className="fas fa-microphone landing-mic-icon"></i>
                            <button
                                className="send-button"
                                onClick={() => handleSendMessage()}
                                disabled={processingUserQuery || !userQueryInput.trim()}
                            >
                                <i className="fas fa-arrow-up"></i>
                            </button>
                        </div>
                    )}
                </div>
                <div className="model-selector-outside">
                    <select value={selectedModel} onChange={handleModelChoose}>
                        <option value="4o">GPT-4o</option>
                        <option value="4o-mini">GPT-4o Mini</option>
                        <option value="o1">o1-preview</option>
                        <option value="o1-mini">o1-mini</option>
                        <option value="o3-mini">o3-mini</option>
                        <option value="llama-3.1-8b-groq">llama-3.1-8b-groq</option>
                        <option value="llama-3.1-8b-fireworks">llama-3.1-8b-fireworks</option>
                        <option value="llama-3.3-70b">llama-3.3-70b</option>
                        <option value="llama-3.1-405b">llama-3.1-405b</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
