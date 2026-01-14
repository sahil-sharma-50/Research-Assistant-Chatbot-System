import React from 'react';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({ selectedFile, onDrop, uploadFile, isLoading, uploadMessage }) => {
    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
        <section className="upload-section">
            <div className="upload-title-container">
                <i className="fas fa-file-upload"></i>
                <div className="upload-title-text">
                    <span className="upload-main-title">Upload PDF</span>
                    <div className="format-description">
                        Format: <span className="format">Author__Year__Title.pdf</span>
                    </div>
                </div>
            </div>
            <div className="dropzone-container" {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                <p className="dropzone-text">
                    {selectedFile ? (
                        <span className="file-name">{selectedFile.name}</span>
                    ) : (
                        <>
                            <i className="fas fa-cloud-upload-alt"></i>
                            Drag & drop a file here, or <span className="browse-link">browse</span>
                        </>
                    )}
                </p>
            </div>

            <div className="button-container">
                <div className="upload-btn-container">
                    <button className="upload-btn" onClick={uploadFile} disabled={!selectedFile || isLoading}>
                        {isLoading ? "Uploading..." : "Upload PDF"}
                    </button>
                    {isLoading && <div className="loader-inline"><div className="loader"></div></div>}
                </div>
            </div>

            {uploadMessage && (
                <p className={uploadMessage.startsWith('Error') ? 'error-message' : 'success-message'}>
                    {uploadMessage}
                </p>
            )}
        </section>
    );
};

export default FileUpload;
