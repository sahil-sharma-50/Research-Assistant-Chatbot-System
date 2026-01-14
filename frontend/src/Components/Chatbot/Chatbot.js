import React from 'react';
import { useChatbot } from '../../hooks/useChatbot';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import GoogleScholarDownloader from './GoogleScholarDownloader';
import WeightRecencySettings from './WeightRecencySettings';
import OptionalBotButtons from './OptionalBotButtons';
import Sidebar from '../Sidebar/Sidebar';
import WelcomeScreen from './WelcomeScreen';
import './Chatbot.css';

function Chatbot({ theme, chatbot }) {
    const isEmpty = chatbot.messages.length === 0;

    return (
        <div className={`chat-container theme-${theme} ${isEmpty ? 'is-empty' : ''}`}>
            {chatbot.showResetModal && (
                <div className="reset-modal-overlay">
                    <div className="reset-modal">
                        <h3>Are you sure?</h3>
                        <p>This will delete the entire conversation history.</p>
                        <div className="reset-modal-buttons">
                            <button className="modal-btn-cancel" onClick={chatbot.cancelReset}>No</button>
                            <button className="modal-btn-confirm" onClick={chatbot.resetSession}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`sidebar-container ${!chatbot.isSidebarVisible ? 'collapsed' : ''}`}>
                <div className="sidebar-section">
                    <div className="rail-icon" title="Upload PDF"><i className="fas fa-file-pdf"></i></div>
                    <div className="section-content">
                        <Sidebar
                            onUpload={() => { }}
                            answer_from_pdf={chatbot.answerFromPDF}
                            usePdfOnly={chatbot.usePdfOnly}
                            setAutoDownloadToggle={chatbot.setAutoDownloadToggle}
                            autoDownloadToggle={chatbot.autoDownloadToggle}
                            llm_model={chatbot.selectedModel}
                        />
                    </div>
                </div>

                <div className="sidebar-section">
                    <div className="rail-icon" title="Google Scholar"><i className="fas fa-graduation-cap"></i></div>
                    <div className="section-content">
                        <GoogleScholarDownloader
                            scholarQuery={chatbot.scholarQuery}
                            setScholarQuery={chatbot.setScholarQuery}
                            isDownloading={chatbot.isDownloading}
                            processingUserQuery={chatbot.processingUserQuery}
                            handleSidebarGSdownloadClick={chatbot.handleSidebarGSdownloadClick}
                            numPdfs={chatbot.numPdfs}
                            selectedSource={chatbot.selectedSource}
                            handleSourceChange={chatbot.handleSourceChange}
                            asktoSearchGoogleScholar={chatbot.asktoSearchGoogleScholar}
                            embeddingPDFs={chatbot.embeddingPDFs}
                            autoDownloadToggle={chatbot.autoDownloadToggle}
                            setAutoDownloadToggle={chatbot.setAutoDownloadToggle}
                            handleNumPDFsRangeChange={chatbot.handleNumPDFsRangeChange}
                            downloadMessage={chatbot.downloadMessage}
                        />
                    </div>
                </div>

                {chatbot.isSidebarVisible && (
                    <div className="sidebar-section">
                        <div className="section-content">
                            <WeightRecencySettings
                                weightRecencyToggle={chatbot.weightRecencyToggle}
                                toggleWeightRecency={chatbot.toggleWeightRecency}
                                usePdfOnly={chatbot.usePdfOnly}
                                processingUserQuery={chatbot.processingUserQuery}
                                alphaValue={chatbot.alphaValue}
                                handleAlphaRangeChange={chatbot.handleAlphaRangeChange}
                                yearSelectedOption={chatbot.yearSelectedOption}
                                handleOptionChange={chatbot.handleOptionChange}
                                singleYear={chatbot.singleYear}
                                setSingleYear={chatbot.setSingleYear}
                                yearRange={chatbot.yearRange}
                                setYearRange={chatbot.setYearRange}
                                pastYears={chatbot.pastYears}
                                setPastYears={chatbot.setPastYears}
                            />
                        </div>
                    </div>
                )}

                <div className="sidebar-section no-border">
                    <div
                        className="rail-icon reset-icon"
                        title="Delete Conversation"
                        onClick={chatbot.handleResetClick}
                    >
                        <i className="fas fa-redo"></i>
                    </div>
                    <div className="section-content">
                        <div className="reset-button-container">
                            <button
                                onClick={chatbot.handleResetClick}
                                className="reset-button"
                                disabled={chatbot.processingUserQuery}>
                                Reset Conversation
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button
                className={`sidebar-toggle-floating ${!chatbot.isSidebarVisible ? 'collapsed' : ''}`}
                onClick={chatbot.toggleSidebar}
                title={chatbot.isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
            >
                <i className={`fas fa-chevron-${chatbot.isSidebarVisible ? 'left' : 'right'}`}></i>
            </button>

            <div className="chatbot">
                {isEmpty ? (
                    <WelcomeScreen chatbot={chatbot} theme={theme} />
                ) : (
                    <div className="chat-active-view">
                        <MessageList
                            messages={chatbot.messages}
                            processingUserQuery={chatbot.processingUserQuery}
                            processDone={chatbot.processDone}
                            statusMessage={chatbot.statusMessage}
                            satisfyFromPDFResponse={chatbot.satisfyFromPDFResponse}
                            handleSatisfyOption={chatbot.handleSatisfyOption}
                            asktoSearchGoogleScholar={chatbot.asktoSearchGoogleScholar}
                            handleAskforGSOption={chatbot.handleAskforGSOption}
                            showRephraseOptions={chatbot.showRephraseOptions}
                            handleRephraseOption={chatbot.handleRephraseOption}
                            showRephraseInputBoxGS={chatbot.showRephraseInputBoxGS}
                            rephrasedQuery={chatbot.rephrasedQuery}
                            setRephrasedQuery={chatbot.setRephrasedQuery}
                            handleRephrasedQuerySubmitGS={chatbot.handleRephrasedQuerySubmitGS}
                            showPdfList={chatbot.showPdfList}
                            gsDownloadedPDFs={chatbot.gsDownloadedPDFs}
                            isDownloading={chatbot.isDownloading}
                            downloadingfromSidebarScholar={chatbot.downloadingfromSidebarScholar}
                            queryToShowToUser={chatbot.queryToShowToUser}
                            userQuery={chatbot.userQuery}
                            selectedDownloadedPdfs={chatbot.selectedDownloadedPdfs}
                            handleCheckboxChange={chatbot.handleCheckboxChange}
                            downloadMorePDFs={chatbot.downloadMorePDFs}
                            ingestPDFs={chatbot.ingestPDFs}
                            ingestPDFsandRetrieve={chatbot.ingestPDFsandRetrieve}
                            scholarQuery={chatbot.scholarQuery}
                            base_url={chatbot.base_url}
                            answerFromPDF={chatbot.answerFromPDF}
                        />

                        <div className="selected-pdfs-container">
                            {chatbot.processDone && chatbot.selectedDownloadedPdfs.length > 0 && (
                                <div className="selected-pdfs">
                                    <h6 style={{ fontSize: '17px', marginBottom: '0px', marginTop: '15px' }}>Selected PDFs:</h6>
                                    <ul style={{ paddingLeft: '20px', fontSize: '18px', lineHeight: '2' }}>
                                        {chatbot.selectedDownloadedPdfs.map((pdf, index) => (
                                            <li key={index}>
                                                <a href={`${chatbot.base_url}/pdfs/${encodeURIComponent(pdf)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                                    {pdf}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <OptionalBotButtons
                            options={chatbot.options}
                            handleOptionClick={chatbot.handleOptionClick}
                        />

                        <ChatInput
                            userQueryInput={chatbot.userQueryInput}
                            handleUserInputChange={chatbot.handleUserInputChange}
                            handleKeyPress={chatbot.handleKeyPress}
                            handleSendMessage={chatbot.handleSendMessage}
                            processingUserQuery={chatbot.processingUserQuery}
                            disableInput={chatbot.disableInput}
                            selectedModel={chatbot.selectedModel}
                            handleModelChoose={chatbot.handleModelChoose}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Chatbot;
