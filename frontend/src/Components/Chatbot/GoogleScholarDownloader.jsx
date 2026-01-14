import React from 'react';

const GoogleScholarDownloader = ({ scholarQuery, setScholarQuery, isDownloading, processingUserQuery, handleSidebarGSdownloadClick, numPdfs, selectedSource, handleSourceChange, asktoSearchGoogleScholar, embeddingPDFs, autoDownloadToggle, setAutoDownloadToggle, handleNumPDFsRangeChange, downloadMessage }) => {
    return (
        <div className="additional-articles-downloader">
            <div className="google-scholar">
                <img
                    src="https://scholar.google.com/intl/en/scholar/images/2x/scholar_logo_64dp.png"
                    alt="Google Scholar"
                    className="google-scholar-image"
                />
                <p className="sidebar-subtitle">Google Scholar PDF Downloader</p>
                <input
                    type="text"
                    className="scholar-query"
                    placeholder="Enter article name or keyword..."
                    value={scholarQuery}
                    onChange={(e) => {
                        const query = e.target.value;
                        setScholarQuery(query);
                        if (!query.trim()) {
                            setAutoDownloadToggle(false);
                        } else {
                            setAutoDownloadToggle(true);
                        }
                    }}
                    disabled={isDownloading || processingUserQuery}
                />
                <div className="download-container">
                    <button
                        className="download-btn"
                        onClick={handleSidebarGSdownloadClick}
                        disabled={!scholarQuery.trim() || isDownloading || embeddingPDFs}
                    >
                        {isDownloading
                            ? `Downloading ${numPdfs} PDF${numPdfs > 1 ? 's' : ''}...`
                            : !scholarQuery.trim()
                                ? 'Download'
                                : `Download ${numPdfs} PDF${numPdfs > 1 ? 's' : ''} from ${selectedSource}`}
                    </button>
                    {isDownloading && scholarQuery.trim() !== '' && <span className="spinner"></span>}
                    <select
                        value={selectedSource}
                        onChange={handleSourceChange}
                        disabled={isDownloading || processingUserQuery || asktoSearchGoogleScholar || !autoDownloadToggle}
                        className="source-select"
                    >
                        <option value="All">All</option>
                        <option value="IEEE">IEEE</option>
                        <option value="Springer">Springer</option>
                        <option value="Arxiv">Arxiv</option>
                    </select>
                </div>
                {downloadMessage && (
                    <p className={downloadMessage.includes('Error') ? 'error-message' : 'success-message'}>
                        {downloadMessage}
                    </p>)}
            </div>

            <div className={`auto-download-toggle-box ${autoDownloadToggle ? 'expanded' : ''}`}>
                <div className="auto-download-toggle">
                    <span className="auto-download-label">Auto-Download PDFs</span>
                    <label className="auto-download-switch">
                        <input type="checkbox"
                            checked={autoDownloadToggle}
                            onChange={() => setAutoDownloadToggle(!autoDownloadToggle)}
                            disabled={isDownloading || processingUserQuery || !autoDownloadToggle && !scholarQuery.trim()}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                {autoDownloadToggle && (
                    <div className="range-slider-container">
                        <label htmlFor="pdfRange" className="range-slider-label">
                            Select Number of PDFs: {numPdfs}
                        </label>
                        <input
                            id="pdfRange"
                            type="range"
                            min="1"
                            max="10"
                            value={numPdfs}
                            onChange={handleNumPDFsRangeChange}
                            disabled={processingUserQuery}
                            className="range-slider"
                        />
                    </div>)}
            </div>
        </div>
    );
};

export default GoogleScholarDownloader;
