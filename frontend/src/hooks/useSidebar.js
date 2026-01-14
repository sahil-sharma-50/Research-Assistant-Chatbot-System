import { useState, useRef, useEffect } from 'react';
import {
    fetchAllDownloadPDFsList as fetchPDFsAPI,
    deletePdfFile,
    getArticlesFromWiki,
    addAnswerToWiki,
    uploadPdfFile
} from '../api/chatbotApi';

export const useSidebar = ({ onUpload, answer_from_pdf, llm_model }) => {
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
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const fetchPDFs = async () => {
        try {
            const data = await fetchPDFsAPI();
            setPdfs(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const hasFetched = useRef(false);
    useEffect(() => {
        if (!hasFetched.current) {
            fetchPDFs();
            hasFetched.current = true;
        }
    }, []);

    const toggleSidebar = () => {
        if (!isSidebarOpen) fetchPDFs();
        setSidebarOpen(!isSidebarOpen);
    };

    const onDrop = (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
            setUploadMessage('');
        }
    };

    const validateFileName = (fileName) => {
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

        uploadPdfFile(formData)
            .then((response) => {
                if (response.data && response.data.message) {
                    setUploadMessage(response.data.message);
                } else {
                    setUploadMessage('PDF uploaded successfully, but no confirmation message received.');
                }
                if (onUpload) onUpload(response.data);
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

    const filteredPdfs = pdfs.filter((pdf) =>
        pdf.name
            .normalize("NFC")
            .toLocaleLowerCase()
            .includes(searchQuery.normalize("NFC").toLocaleLowerCase())
    );

    const handleFetchArticles = async () => {
        setLoading(true);
        try {
            const response = await getArticlesFromWiki(answer_from_pdf, llm_model);
            setRelevantArticles(response.data);
        } catch (error) {
            console.error("Error fetching articles:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmArticle = async () => {
        setLoading(true);
        try {
            const response = await addAnswerToWiki(selectedArticle, answer_from_pdf, llm_model);
            setSuccessMessage(response.data.message || "Successfully added to Wiki!");
            setShowSuccessDialog(true);
        } catch (error) {
            console.error("Error confirming article:", error);
            setSuccessMessage("Error adding to Wiki");
            setShowSuccessDialog(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setShowSuccessDialog(false);
        setRelevantArticles([]);
    };

    const deletePDF = async (pdf_name) => {
        try {
            const response = await deletePdfFile(pdf_name);
            if (response.data === "Success") {
                fetchPDFs();
                setPdfDeleteSuccess("PDF deleted successfully");
                setPdfDeleteError("");
            } else if (response.data.error) {
                setPdfDeleteError(response.data.error);
                setPdfDeleteSuccess("");
            }
        } catch (error) {
            console.error("Error deleting PDF:", error);
        }
    };

    return {
        selectedFile, setSelectedFile,
        isLoading, setIsLoading,
        uploadMessage, setUploadMessage,
        isSidebarOpen, setSidebarOpen,
        pdfs, setPdfs,
        searchQuery, setSearchQuery,
        error, setError,
        pdfDeleteError, setPdfDeleteError,
        pdfDeleteSuccess, setPdfDeleteSuccess,
        relevantArticles, setRelevantArticles,
        selectedArticle, setSelectedArticle,
        loading, setLoading,
        successMessage, setSuccessMessage,
        showSuccessDialog, setShowSuccessDialog,
        toggleSidebar,
        onDrop,
        uploadFile,
        filteredPdfs,
        handleFetchArticles,
        handleConfirmArticle,
        handleCloseDialog,
        deletePDF,
    };
};
