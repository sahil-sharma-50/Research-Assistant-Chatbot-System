import React from 'react';
import ReactMarkdown from 'react-markdown';

const OptionalBotButtons = ({ options, handleOptionClick }) => {
    if (!options || options.length === 0) return null;

    return (
        <div className="options-container-kg">
            {options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => handleOptionClick(index)}
                    className="option-button-kg"
                >
                    <ReactMarkdown
                        components={{
                            a: ({ node, ...props }) => <a href={props.href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{props.children}</a>
                        }}>
                        {option}
                    </ReactMarkdown>
                </button>
            ))}
        </div>
    );
};

export default OptionalBotButtons;
