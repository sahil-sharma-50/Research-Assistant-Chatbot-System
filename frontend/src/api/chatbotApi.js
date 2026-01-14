import axios from 'axios';

const base_url = process.env.REACT_APP_API_URL;

const apiClient = axios.create({
    baseURL: base_url,
    timeout: 300000,
});

export const postRequest = async (endpoint, data, params = {}) => {
    try {
        return await apiClient.post(`/${endpoint}`, data, { params });
    } catch (error) {
        console.error(`Error in ${endpoint}:`, error);
        throw error;
    }
};

export const fetchAllDownloadPDFsList = async () => {
    try {
        const response = await fetch(`${base_url}/pdfs`);
        if (!response.ok) throw new Error("Failed to fetch PDF list");
        return await response.json();
    } catch (err) {
        console.error('Error fetching PDFs:', err);
        throw err;
    }
};

export const resetConversation = async (sessionId) => {
    return await apiClient.post('/reset_conversation', null, {
        params: { session_id: sessionId },
    });
};

export const clearPdfFolder = async () => {
    return await apiClient.post('/clear-pdf-folder');
};

export const downloadPdf = async (queryPayload) => {
    return await postRequest('download_pdf', queryPayload);
};

export const listDownloadedPdfs = async () => {
    return await apiClient.get('/list-downloaded-pdfs');
};

export const deleteUnselectedPdfs = async (selectedDownloadedPdfs) => {
    return await apiClient.post('/delete_unselected_pdfs', selectedDownloadedPdfs);
};

export const uploadScholarPdf = async (queryPayload) => {
    return await postRequest('upload_scholar_pdf', queryPayload);
};

export const queryPdf = async (queryPayload, params) => {
    return await postRequest('query_pdf', queryPayload, params);
};

export const deletePdfFile = async (pdf_name) => {
    return await apiClient.delete(`/deletepdf/${pdf_name}`);
};

export const getArticlesFromWiki = async (answer_from_pdf, llm_model) => {
    return await apiClient.post('/get_articles_from_wiki', {
        question: answer_from_pdf,
        llm_model: llm_model
    });
};

export const addAnswerToWiki = async (selectedArticle, answer_from_pdf, llm_model) => {
    return await apiClient.post('/add_answer_to_wiki', {
        page_title: selectedArticle,
        question: answer_from_pdf,
        llm_model: llm_model
    });
};

export const uploadPdfFile = async (formData) => {
    return await axios.post(`${process.env.REACT_APP_PDF_UPLOAD_URL}/upload-pdf`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
