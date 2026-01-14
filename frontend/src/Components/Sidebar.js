import axios from 'axios';
import React, { useRef, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import './Sidebar.css';


const Sidebar = ({ onUpload, answer_from_pdf, setAutoDownload, llm_model}) => {
  const base_url = process.env.REACT_APP_API_URL
  const pdf_upload_url = process.env.REACT_APP_PDF_UPLOAD_URL
  // Upload PDF states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const messageTimeoutRef = useRef(null);
  // Sidebar states
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [pdfDeleteError, setPdfDeleteError] = useState("");
  const [pdfDeleteSuccess, setPdfDeleteSuccess] = useState("");
  // Add to Wiki states
  const [relevantArticles, setRelevantArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  
  // Function to fetch PDFs from the server
  const fetchPDFs = async () => {
    try {
      const response = await fetch(`${base_url}/pdfs`);
      console.log('Tried to update PDF list from Sidebar.js.')
      if (!response.ok) throw new Error("Failed to fetch PDF list");
      const data = await response.json();
      setPdfs(data);
    } catch (err) {
      setError(err.message);
    }
  };


  // Fetch PDFs on initial render
  const hasFetched = useRef(false);
  useEffect(() => {
    if (!hasFetched.current) {
      fetchPDFs();
      hasFetched.current = true;
    }
  }, []);


  // Toggle Sidebar Visibility
  const toggleSidebar = () => {
    if (!isSidebarOpen) fetchPDFs();
    setSidebarOpen(!isSidebarOpen);
  };


  // Function to handle file drop
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadMessage('');
    }
  };


  // Function to validate file name
  const validateFileName = (fileName) => {
    // Format: Author__Year__Title.pdf or Author__Year__Title__DOI.pdf
    const regex = /^([^\/\\:*?"<>|]+)__\d{4}__([^\/\\:*?"<>|]+)(__.+)?\.pdf$/u;
    const today = new Date();
    const currentYear = today.getFullYear();
    if (!regex.test(fileName)) {
      return {
        status: false,
        message: 'Invalid format. Please use: Author__Year__Title.pdf or Author__Year__Title__DOI.pdf',
      };
    }
    const parts = fileName.split("__");
    const year = parseInt(parts[1], 10);
    if (isNaN(year) || year > currentYear) {
      return {
        status: false,
        message: `Invalid year. Year should be a number and no later than ${currentYear}.`,
      };
    }
    return {
      status: true,
      message: 'Validation successful.',
    };
  };


  // Function to upload file
  const uploadFile = () => {
    if (!selectedFile) return;
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    const PDFfileName = selectedFile.name;
    const validationResult = validateFileName(PDFfileName);
    if (!validationResult.status) {
      setUploadMessage(`Error: ${validationResult.message}`);
      messageTimeoutRef.current = setTimeout(() => {
        setUploadMessage('');
        messageTimeoutRef.current = null;
      }, 10000);
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    setIsLoading(true);
    setUploadMessage('');
    axios.post(`${pdf_upload_url}/upload-pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((response) => {
      if (response.data && response.data.message) {
        setUploadMessage(response.data.message);
      } else {
        setUploadMessage('PDF uploaded successfully, but no confirmation message received.');
      }
      onUpload(response.data);
      setSelectedFile(null);
      fetchPDFs();
    })
    .catch((error) => {
      console.error('Error uploading file:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setUploadMessage(`Error: ${error.response.data.message}`);
      } else {
        setUploadMessage('Error: PDF Upload. Please try again.');
      }
      setSelectedFile(null);
    })
    .finally(() => {
      setIsLoading(false);
      messageTimeoutRef.current = setTimeout(() => {
        setUploadMessage('');
        messageTimeoutRef.current = null;
      }, 10000);

    });
  };

  // Dropzone configuration
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  // Filter PDFs based on search query
  const filteredPdfs = pdfs.filter((pdf) =>
    pdf.name
    .normalize("NFC")
    .toLocaleLowerCase()
    .includes(searchQuery.normalize("NFC").toLocaleLowerCase())
  );


  // Function to fetch relevant articles
  const handleFetchArticles = async () => {
    setLoading(true);

    try {
      const response = await axios.post(`${base_url}/get_articles_from_wiki`, { 
        question: answer_from_pdf, 
        llm_model: llm_model
      });
      setRelevantArticles(response.data);
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
    finally{
      setLoading(false); 
    }
  };


  // Function to confirm article selection
  const handleConfirmArticle = async () => {
    setLoading(true); 
    try {
      
      const response = await axios.post(`${base_url}/add_answer_to_wiki`, {
        page_title: selectedArticle,
        question: answer_from_pdf,
        llm_model: llm_model
      });
      //setResponseMessage(response.data.message);
      setSuccessMessage(response.data.message || "Successfully added to Wiki!");
      setShowSuccessDialog(true);
    } catch (error) {
      setSuccessMessage("Error adding to Wiki with error:", error);
      setShowSuccessDialog(true);
      
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    setRelevantArticles([]);
  };


  // Function to delete PDF
  const deletePDF=async (pdf_name)=>{
    try{
      const response=   await axios.delete(`${base_url}/deletepdf/${pdf_name}`)
      console.log(response)
      if(response.data=="Success"){
        fetchPDFs();
        setPdfDeleteSuccess("PDF deleted successfully");
        setPdfDeleteError("");
      }
      if(response.data.error){
        setPdfDeleteError(response.data.error);
        setPdfDeleteSuccess("");
      }
    } catch (error) {
      console.error("Error confirming article:", error);
    }
  };


  return (
    <div className='sidebar'>

      {/* File Dropzone */}
      <section className="upload-section">
        <h6 class="upload-instructions">
          Upload PDF
          <div class="format-description">
            Format: <span class="format">Author__Year__Title.pdf</span> <span className="tooltip-container">
                    <span className="tooltip-icon">?</span>
                    <span className="tooltip-text" style={{
                      textAlign: "left",
                      padding: "10px",
                      borderRadius: "5px"
                    }}>
                    Please follow this filename format to upload PDFs:
                    <ol style={{ paddingLeft: "15px", marginBottom: "5px" }}>
                      <li>Author: Name of the author</li>
                      <li>Year: Year of publication</li>
                      <li>Title: Title of the PDF</li>
                      <li>DOI (Optional): DOI of the PDF</li>
                    </ol>
                    Seprate each field with ("__") double underscore
                    </span>
                    </span>
          </div>
        </h6>
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
            <button 
              className="upload-btn" 
              onClick={uploadFile} 
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? "Uploading..." : "Upload PDF"}
            </button>
            {isLoading && (
              <div className="loader-inline">
                <div className="loader"></div>
              </div>
            )}
          </div>
          <button className="view-btn" onClick={toggleSidebar} >
            View All PDFs
          </button>
        </div>
        
        {uploadMessage && (
          <p className={uploadMessage.startsWith('Error') ? 'error-message' : 'success-message'}>
            {uploadMessage}
          </p>
        )}
      </section>

      {/* Sidebar */}
      <div className={`side-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header2">
          <h2>PDF List</h2>
          <button className="close-btn" onClick={toggleSidebar}>
            ✖
          </button>
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
                <a
                  href={`${base_url}/pdfs/${encodeURIComponent(
                    pdf.name
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {pdf.name}
                </a>
                <button className='close-btn-small' onClick={() => deletePDF(encodeURIComponent(pdf.name))}>
                  ✖
                </button>
                <span>
                  Size: {pdf.size} KB | Date: {pdf.date}
                </span>
                
              </div>
            ))
          )}
        </div>
      </div>

      
      
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
