import React from 'react';

const PDFList = ({ isSidebarOpen, toggleSidebar, searchQuery, setSearchQuery, error, filteredPdfs, deletePDF, base_url }) => {
    return (
        <div className={`side-sidebar ${isSidebarOpen ? "open" : ""}`}>
            <div className="sidebar-header2">
                <h2><i className="fas fa-file-pdf"></i> PDF List</h2>
                <button className="close-btn-small" onClick={toggleSidebar}>✖</button>
            </div>
            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search PDFs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="pdf-list">
                {error ? (
                    <p>Error loading PDFs: {error}</p>
                ) : filteredPdfs.length === 0 ? (
                    <p>No PDFs found.</p>
                ) : (
                    filteredPdfs.map((pdf, index) => (
                        <div className="pdf-item" key={index}>
                            <div className="pdf-item-number">{index + 1}</div>
                            <div className="pdf-item-content">
                                <a href={`${base_url}/pdfs/${encodeURIComponent(pdf.name)}`} target="_blank" rel="noopener noreferrer">
                                    {pdf.name}
                                </a>
                                <span>Size: {pdf.size} KB | Date: {pdf.date}</span>
                            </div>
                            <button className='pdf-item-delete' onClick={() => deletePDF(encodeURIComponent(pdf.name))}>✖</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PDFList;
