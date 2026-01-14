import ReactMarkdown from 'react-markdown';

const MessageList = ({ messages, processingUserQuery, processDone, statusMessage, satisfyFromPDFResponse, handleSatisfyOption, asktoSearchGoogleScholar, handleAskforGSOption, showRephraseOptions, handleRephraseOption, showRephraseInputBoxGS, rephrasedQuery, setRephrasedQuery, handleRephrasedQuerySubmitGS, showPdfList, gsDownloadedPDFs, isDownloading, downloadingfromSidebarScholar, queryToShowToUser, userQuery, selectedDownloadedPdfs, handleCheckboxChange, downloadMorePDFs, ingestPDFs, ingestPDFsandRetrieve, scholarQuery, base_url, answerFromPDF }) => {
    return (
        <div className="chat-window">
            {messages.map((message, index) => (
                <div key={index} className={`chat-message-wrapper ${message.sender}`}>
                    <div className="message-avatar">
                        {message.sender === 'user' ? '🙎‍♂️' : '🧠'}
                    </div>
                    <div className="message-content-group">
                        <div className={`chat-message ${message.sender}`}>
                            {typeof message.text === 'string' ? (
                                <ReactMarkdown
                                    components={{
                                        a: ({ node, ...props }) => <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>
                                    }}>
                                    {message.text}
                                </ReactMarkdown>
                            ) : message.text?.answer ? (
                                /["']?No-Response[.,]?\s*["']?/i.test(message.text.answer) ? (
                                    <div className="no-relevant-answer">No relevant answer found.</div>
                                ) : (
                                    <div className="bot-answer-container">
                                        <ReactMarkdown
                                            components={{
                                                a: ({ node, ...props }) => <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>,
                                            }}
                                        >
                                            {message.text.answer}
                                        </ReactMarkdown>
                                        {message.text.source && !/["']?No-Response[.,]?\s*["']?/i.test(message.text.answer) && answerFromPDF === '' && message.text.source !== "No source details available." && (
                                            <div className="sources-container">
                                                <p className="sources-label">Sources</p>
                                                <ul className="sources-list">
                                                    {message.text.source.split(' | ').map((line, i) => (
                                                        <li key={i}>
                                                            <a
                                                                href={line}
                                                                target='_blank'
                                                                rel="noopener noreferrer"
                                                                className="source-link"
                                                            >
                                                                {line}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {message.text.source && !/["']?No-Response[.,]?\s*["']?/i.test(message.text.answer) && answerFromPDF !== '' && message.text.source !== "No source details available." && (
                                            <div className="sources-container">
                                                <p className="sources-label">Sources</p>
                                                <ol className="sources-list ordered">
                                                    {message.text.source.split(' | ').map((line, i) => (
                                                        <li key={i}>
                                                            <a
                                                                href={`${base_url}/pdfs/${encodeURIComponent(line.split('\\').pop())}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="source-link"
                                                            >
                                                                {line.split('\\').pop()}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}
                                    </div>
                                )
                            ) : null}
                        </div>
                        <div className="message-metadata">
                            {message.sender === 'bot' && <span className="message-model">{message.model}</span>}
                            <span className="message-time">{message.timestamp}</span>
                        </div>
                    </div>
                </div>
            ))}

            {(processingUserQuery || processDone) && (
                <div className="chat-message-wrapper bot">
                    <div className="message-avatar">🧠</div>
                    <div className="message-content-group">
                        <div className="chat-message bot loading-message">
                            <div className="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <div className="status-text" dangerouslySetInnerHTML={{ __html: statusMessage }} />
                        </div>
                    </div>
                </div>
            )}

            {satisfyFromPDFResponse && (
                <div className="options-container satisfied-options-container">
                    <p className="options-message scholar-options-message">Are you satisfied with the given answer?</p>
                    <div className="options-container-buttons">
                        <button onClick={() => handleSatisfyOption('yes')} className="option-button yes-button">Yes</button>
                        <button onClick={() => handleSatisfyOption('no')} className="option-button no-button">No</button>
                    </div>
                </div>
            )}

            {asktoSearchGoogleScholar && (
                <div className="options-container ask-gs-container">
                    <p className="options-message scholar-options-message">Would you like to search Google Scholar for more information?</p>
                    <div className="options-container-buttons">
                        <button onClick={() => handleAskforGSOption('yes')} className="option-button yes-button">Yes</button>
                        <button onClick={() => handleAskforGSOption('no')} className="option-button no-button">No</button>
                    </div>
                </div>
            )}

            {showRephraseOptions && (
                <div className="options-container rephrase-options-container">
                    <p className="options-message rephrase-options-message">
                        Would you like to rephrase your query for Google Scholar?
                    </p>
                    <div className="options-container-buttons">
                        <button onClick={() => handleRephraseOption('yes')} className="option-button yes-button">Yes</button>
                        <button onClick={() => handleRephraseOption('no')} className="option-button no-button">No</button>
                    </div>
                </div>
            )}

            {showRephraseInputBoxGS && (
                <div className="rephrase-query-input-container">
                    <p>Enter your Rephrased Query:</p>
                    <input
                        type="text"
                        value={rephrasedQuery}
                        onChange={(e) => setRephrasedQuery(e.target.value)}
                        placeholder="Enter your new query here"
                        className="rephrase-query-input-box"
                    />
                    <button onClick={handleRephrasedQuerySubmitGS} className="rephrase-query-submit-button">Submit</button>
                </div>
            )}

            {!processingUserQuery && !isDownloading && showPdfList && gsDownloadedPDFs.length > 0 && (
                <div className="pdf-selection">
                    <h6 className="pdf-selection-title">
                        Select which PDF to Embed for Query: "{downloadingfromSidebarScholar ? queryToShowToUser : (rephrasedQuery || userQuery)}":
                    </h6>
                    <ol style={{ paddingLeft: '20px', fontSize: '16px', lineHeight: '2' }}>
                        {gsDownloadedPDFs.map((pdf, index) => (
                            <li key={index}>
                                <input
                                    type="checkbox"
                                    id={`pdf-${index}`}
                                    checked={selectedDownloadedPdfs.includes(pdf)}
                                    onChange={() => handleCheckboxChange(pdf)}
                                    className="pdf-checkbox"
                                />
                                <label htmlFor={`pdf-${index}`}>
                                    <a href={`${base_url}/downloaded-pdfs/${encodeURIComponent(pdf)}`} target="_blank" rel="noopener noreferrer">
                                        {pdf}
                                    </a>
                                </label>
                            </li>
                        ))}
                    </ol>
                    {selectedDownloadedPdfs.length > 0 ? (
                        <button onClick={() => downloadingfromSidebarScholar ? ingestPDFs(selectedDownloadedPdfs) : ingestPDFsandRetrieve(selectedDownloadedPdfs)} className="submit-button">
                            Embed {selectedDownloadedPdfs.length} PDF{selectedDownloadedPdfs.length > 1 ? 's' : ''} ✅
                        </button>
                    ) : (
                        <button onClick={() => downloadMorePDFs()} className="submit-button">
                            Download More PDFs 📥
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageList;
