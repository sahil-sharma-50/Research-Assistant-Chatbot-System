import React from 'react';
import { useSidebar } from '../../hooks/useSidebar';
import FileUpload from './FileUpload';
import PDFList from './PDFList';
import './Sidebar.css';

const Sidebar = ({ onUpload, answer_from_pdf, setAutoDownload, llm_model }) => {
    const {
        selectedFile,
        isLoading,
        uploadMessage,
        isSidebarOpen,
        searchQuery,
        setSearchQuery,
        error,
        pdfDeleteError,
        setPdfDeleteError,
        pdfDeleteSuccess,
        setPdfDeleteSuccess,
        toggleSidebar,
        onDrop,
        uploadFile,
        filteredPdfs,
        deletePDF,
    } = useSidebar({ onUpload, answer_from_pdf, llm_model });

    const base_url = process.env.REACT_APP_API_URL;

    return (
        <div className='sidebar'>
            <FileUpload
                selectedFile={selectedFile}
                onDrop={onDrop}
                uploadFile={uploadFile}
                isLoading={isLoading}
                uploadMessage={uploadMessage}
            />

            <div className="button-container">
                <button className="view-btn" onClick={toggleSidebar}>
                    View All PDFs
                </button>
            </div>

            <PDFList
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                error={error}
                filteredPdfs={filteredPdfs}
                deletePDF={deletePDF}
                base_url={base_url}
            />

            {pdfDeleteError && (
                <div className="error-dialog">
                    <p>{pdfDeleteError}</p>
                    <button onClick={() => setPdfDeleteError("")}>Close</button>
                </div>
            )}

            {pdfDeleteSuccess && (
                <div className="success-dialog">
                    <p>{pdfDeleteSuccess}</p>
                    <button onClick={() => setPdfDeleteSuccess("")}>Close</button>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
