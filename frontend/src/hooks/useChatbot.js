import { useState, useRef, useEffect } from 'react';
import { getSessionId, clearSession } from '../utils/session';
import {
    postRequest,
    fetchAllDownloadPDFsList as fetchPDFsAPI,
    resetConversation,
    clearPdfFolder,
    downloadPdf,
    listDownloadedPdfs,
    deleteUnselectedPdfs,
    uploadScholarPdf,
    queryPdf,
} from '../api/chatbotApi';

export const useChatbot = () => {
    // User Query Input
    const [userQueryInput, setUserQueryInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [processingUserQuery, setProcessingUserQuery] = useState(false);
    const [selectedModel, setSelectedModel] = useState("4o-mini");
    const [statusMessage, setStatusMessage] = useState('');

    // Chatbot Selection Options
    const [options, setOptions] = useState([]);
    const [disableInput, setDisableInput] = useState(false);
    const [usePdfOnly, setUsePdfOnly] = useState(true);
    const [answerFromPDF, setAnswerFromPDF] = useState('');
    const [satisfyFromPDFResponse, setSatisfyFromPDFResponse] = useState(false);

    // Download PDFs from Google Scholar
    const [asktoSearchGoogleScholar, setAsktoSearchGoogleScholar] = useState(false);
    const [scholarQuery, setScholarQuery] = useState('');
    const [autoDownloadToggle, setAutoDownloadToggle] = useState(false);
    const [numPdfs, setNumPdfs] = useState(1);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadingUserQueryGS, setDownloadingUserQueryGS] = useState(false);
    const [userQuery, setUserQuery] = useState('');
    const [downloadingfromSidebarScholar, setDownloadingfromSidebarScholar] = useState(false);
    const [downloadMessage, setDownloadMessage] = useState('');
    const messageTimeoutRef = useRef(null); // Ref to store the timeout ID
    const [embeddingPDFs, setEmbeddingPDFs] = useState(false);
    const [processDone, setProcessDone] = useState(false);
    const [selectedSource, setSelectedSource] = useState("All");
    const [queryToShowToUser, setQueryToShowToUser] = useState('');

    // Rephrase PDF Query Options for Google Scholar
    const [showRephraseOptions, setShowRephraseOptions] = useState(false);
    const [showRephraseInputBoxGS, setShowRephraseInputBoxGS] = useState(false);
    const [rephrasedQuery, setRephrasedQuery] = useState('');

    // Weight Recency Filter Options for PDF chatbot
    const [weightRecencyToggle, setWeightRecencyToggle] = useState(false);
    const [alphaValue, setAlphaValue] = useState(0.5);
    const [yearSelectedOption, setYearSelectedOption] = useState("none");
    const [singleYear, setSingleYear] = useState(null);
    const [yearRange, setYearRange] = useState({ startYear: null, endYear: null });
    const [pastYears, setPastYears] = useState(null);

    const [session_id, setSessionId] = useState('');

    // PDF List
    const [allDownloadedPDFsList, setAllDownloadedPDFsList] = useState([]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [showResetModal, setShowResetModal] = useState(false);

    // Sidebar toggle logic
    const toggleSidebar = () => setIsSidebarVisible(prev => !prev);
    const [gsDownloadedPDFs, setGSDownloadedPDFs] = useState([]);
    const [showPdfList, setShowPdfList] = useState(false);
    const [selectedDownloadedPdfs, setSelectedDownloadedPdfs] = useState([]);
    const [updatePDFList, setUpdatePDFList] = useState(false);

    const base_url = process.env.REACT_APP_API_URL;

    const resetSessionFinalState = () => {
        setSelectedSource("All");
        setAutoDownloadToggle(false);
        setNumPdfs(1);
        setScholarQuery('');
        setDownloadingUserQueryGS(false);
        setAsktoSearchGoogleScholar(false);
        setProcessingUserQuery(false);
        setAsktoSearchGoogleScholar(false);
        setShowRephraseInputBoxGS(false);
        setProcessDone(false);
        setShowPdfList(false);
        setSatisfyFromPDFResponse(false);
        clearScreen();
    };

    const handleResetClick = () => {
        setShowResetModal(true);
    };

    const cancelReset = () => {
        setShowResetModal(false);
    };

    const resetSession = async () => {
        setShowResetModal(false);
        let sessionId = sessionStorage.getItem('session_id');
        if (sessionId) {
            try {
                await resetConversation(sessionId);
                clearSession();
                resetSessionFinalState();
            } catch (error) {
                console.error('Error resetting conversation:', error.message);
            }
        } else {
            console.log("Nothing to reset!");
        }
    };

    const clearScreen = async () => {
        setUserQueryInput('');
        setMessages([]);
        setOptions([]);
        setDisableInput(false);
    };

    const fetchAllDownloadPDFsList = async () => {
        try {
            const data = await fetchPDFsAPI();
            setAllDownloadedPDFsList(data);
        } catch (err) {
            console.error('Error fetching PDFs:', err);
        }
    };

    useEffect(() => {
        if (updatePDFList) {
            fetchAllDownloadPDFsList();
            setUpdatePDFList(false);
        }
    }, [updatePDFList]);

    const SidebarGSdownloadClickInitialState = () => {
        getSessionId(setSessionId);
        setSelectedDownloadedPdfs([]);
        setDownloadingfromSidebarScholar(true);
        setIsDownloading(true);
        setDownloadMessage('');
        setWeightRecencyToggle(false);
        setShowRephraseInputBoxGS(false);
        setShowRephraseOptions(false);
        setAsktoSearchGoogleScholar(false);
        setProcessingUserQuery(true);
        setDownloadingUserQueryGS(true);
        setShowPdfList(false);
        setEmbeddingPDFs(false);
        setProcessDone(false);
        setQueryToShowToUser(scholarQuery);
        setSatisfyFromPDFResponse(false);
        setStatusMessage(`Downloading ${numPdfs} PDF${numPdfs > 1 ? 's' : ''} from Site: <strong>"${selectedSource}"</strong>. Query: <strong>"${scholarQuery}"</strong>
          <br /> Please wait <span></span><span></span><span></span>`);
    };

    const SidebarGSdownloadClickFinalState = () => {
        setIsDownloading(false);
        fetchGSpdfList();
        setScholarQuery('');
        setDownloadingfromSidebarScholar(true);
        setProcessingUserQuery(false);
        setShowPdfList(true);
        setStatusMessage(`Retrieving Answer <span></span><span></span><span></span>`);
        messageTimeoutRef.current = setTimeout(() => {
            setDownloadMessage('');
            messageTimeoutRef.current = null;
        }, 5000);
    };

    const handleSourceChange = (event) => {
        setSelectedSource(event.target.value);
    };

    const handleSidebarGSdownloadClick = async () => {
        if (!scholarQuery.trim()) return;
        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        await clearPdfFolder();
        SidebarGSdownloadClickInitialState();
        try {
            let sidebar_query = scholarQuery;
            const queryPayload = { query: sidebar_query, num_pdf: numPdfs, source: selectedSource };
            await downloadPdf(queryPayload);
            setDownloadMessage(`${numPdfs} PDF${numPdfs > 1 ? 's' : ''} downloaded successfully!`);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            setDownloadMessage(`Error downloading PDF${numPdfs > 1 ? 's' : ''}. Please try again.`);
            setMessages((prev) => [...prev, { text: 'Error fetching PDFs.', sender: 'bot' }]);
        } finally {
            SidebarGSdownloadClickFinalState();
        }
    };

    const handleSatisfyOption = async (option) => {
        if (option === 'yes') {
            setSatisfyFromPDFResponse(false);
        } else {
            setSatisfyFromPDFResponse(false);
            setAsktoSearchGoogleScholar(true);
        }
    };

    const handleAskforGSOption = async (option) => {
        if (option === 'yes') {
            setAsktoSearchGoogleScholar(false);
            setAutoDownloadToggle(true);
            setShowRephraseOptions(true);
            setDownloadingUserQueryGS(true);
        } else {
            setShowRephraseOptions(false);
            setProcessingUserQuery(false);
            setAsktoSearchGoogleScholar(false);
            setShowPdfList(false);
        }
    };

    const handleRephraseOption = async (option) => {
        if (option === 'yes') {
            setEmbeddingPDFs(false);
            setShowRephraseOptions(false);
            setShowRephraseInputBoxGS(true);
        } else {
            setEmbeddingPDFs(false);
            setShowRephraseInputBoxGS(false);
            setShowRephraseOptions(false);
            setProcessingUserQuery(true);
            setDownloadingUserQueryGS(true);
            setQueryToShowToUser(userQuery);
            setStatusMessage(`Downloading ${numPdfs} PDF${numPdfs > 1 ? 's' : ''} from Site: <strong>"${selectedSource}"</strong>. Query: <strong>"${userQuery}"</strong>
        <br /> Please wait <span></span><span></span><span></span>`);

            try {
                const query = downloadingfromSidebarScholar ? queryToShowToUser : (rephrasedQuery || userQuery);
                const queryPayload = { query: query, num_pdf: numPdfs, source: selectedSource };
                await downloadPdf(queryPayload);
            } catch (error) {
                console.error('Error querying scholar PDFs:', error);
                setMessages((prev) => [...prev, { text: 'Error fetching PDFs.', sender: 'bot' }]);
            } finally {
                fetchGSpdfList();
                setProcessingUserQuery(false);
                setDownloadingUserQueryGS(true);
                setShowPdfList(true);
                setStatusMessage(`Retrieving Answer <span></span><span></span><span></span>`);
            }
        }
    };

    const handleRephrasedQuerySubmitGSInitialState = () => {
        setShowRephraseInputBoxGS(false);
        setAsktoSearchGoogleScholar(false);
        setShowRephraseOptions(false);
        setProcessingUserQuery(true);
        setDownloadingUserQueryGS(true);
        setQueryToShowToUser(rephrasedQuery);
        setStatusMessage(`Downloading ${numPdfs} PDF${numPdfs > 1 ? 's' : ''} from Site: <strong>"${selectedSource}"</strong>. Query: <strong>"${rephrasedQuery}"</strong>
      <br /> Please wait <span></span><span></span><span></span>`);
    };

    const handleRephrasedQuerySubmitGSFinalState = () => {
        setProcessingUserQuery(false);
        fetchGSpdfList();
        setDownloadingUserQueryGS(true);
        setShowPdfList(true);
        setStatusMessage(`Retrieving Answer <span></span><span></span><span></span>`);
    };

    const handleRephrasedQuerySubmitGS = async () => {
        if (rephrasedQuery.trim()) {
            await clearPdfFolder();
            handleRephrasedQuerySubmitGSInitialState();
            try {
                const query = downloadingfromSidebarScholar ? queryToShowToUser : (rephrasedQuery || userQuery);
                const queryPayload = { query: query, num_pdf: numPdfs, source: selectedSource };
                await downloadPdf(queryPayload);
            } catch (error) {
                console.error('Error querying scholar PDFs:', error);
                setMessages((prev) => [...prev, { text: 'Error fetching PDFs.', sender: 'bot' }]);
            } finally {
                handleRephrasedQuerySubmitGSFinalState();
            }
        }
    };

    const fetchGSpdfList = async () => {
        try {
            const response = await listDownloadedPdfs();
            setGSDownloadedPDFs(response.data.pdfs);
        } catch (error) {
            console.error('Error fetching PDFs:', error);
        }
    };

    const handleCheckboxChange = (pdf) => {
        setSelectedDownloadedPdfs((prevSelected) =>
            prevSelected.includes(pdf)
                ? prevSelected.filter((item) => item !== pdf)
                : [...prevSelected, pdf]
        );
    };

    useEffect(() => {
        if (gsDownloadedPDFs.length === 0) {
            setDownloadingUserQueryGS(false);
            setAutoDownloadToggle(false);
        }
    }, [gsDownloadedPDFs]);

    const downloadMorePDFsInitialState = () => {
        setIsDownloading(true);
        setDownloadingfromSidebarScholar(true);
        setDownloadMessage('');
        setSelectedDownloadedPdfs([]);
        setShowRephraseInputBoxGS(false);
        setShowRephraseOptions(false);
        setProcessingUserQuery(true);
        setDownloadingUserQueryGS(true);
        setShowPdfList(false);
    };

    const downloadMorePDFsFinalState = () => {
        fetchGSpdfList();
        setProcessingUserQuery(false);
        setIsDownloading(false);
        setDownloadingUserQueryGS(true);
        setShowPdfList(true);
        setStatusMessage(`Retrieving Answer <span></span><span></span><span></span>`);
    };

    const downloadMorePDFs = async () => {
        downloadMorePDFsInitialState();
        try {
            const query = downloadingfromSidebarScholar ? queryToShowToUser : (rephrasedQuery || userQuery);
            setStatusMessage(`
        Downloading ${numPdfs} More PDF${numPdfs > 1 ? 's' : ''} from Site: <strong>"${selectedSource}"</strong>. Query: <strong>"${query}"</strong>.
        <br /> 
        Please wait <span></span><span></span><span></span>
      `);
            const queryPayload = { query: query, num_pdf: numPdfs, source: selectedSource };
            await downloadPdf(queryPayload);
        } catch (error) {
            console.error('Error querying scholar PDFs:', error);
            setMessages((prev) => [...prev, { text: 'Error fetching PDFs.', sender: 'bot' }]);
        } finally {
            downloadMorePDFsFinalState();
        }
    };

    const ingestPDFsInitialState = () => {
        setProcessingUserQuery(true);
        setDownloadingUserQueryGS(true);
        setStatusMessage(`Embeddings ${selectedDownloadedPdfs.length} PDF${selectedDownloadedPdfs.length > 1 ? 's' : ''}. Please wait <span></span><span></span><span></span>`);
        setEmbeddingPDFs(true);
    };

    const ingestPDFsFinalState = () => {
        setScholarQuery('');
        setIsDownloading(false);
        setProcessingUserQuery(false);
        setDownloadingUserQueryGS(false);
        setUpdatePDFList(true);
        setShowPdfList(false);
        setDownloadingfromSidebarScholar(false);
        setProcessDone(true);
        setStatusMessage(`PDF${selectedDownloadedPdfs.length > 1 ? 's' : ''} Ingested Successfully ✅✅`);
        setDownloadMessage(`PDF${selectedDownloadedPdfs.length > 1 ? 's' : ''} Ingested Successfully ✅✅`);
        setAutoDownloadToggle(false);
        setEmbeddingPDFs(false);
        messageTimeoutRef.current = setTimeout(() => {
            setDownloadMessage('');
            messageTimeoutRef.current = null;
        }, 5000);
    };

    const ingestPDFs = async (selectedDownloadedPdfs) => {
        ingestPDFsInitialState();
        try {
            await deleteUnselectedPdfs(selectedDownloadedPdfs);
            const queryPayload = { query: rephrasedQuery, num_pdf: numPdfs, source: selectedSource };
            await uploadScholarPdf(queryPayload);
        } catch (error) {
            console.error('Error querying scholar PDFs:', error);
        } finally {
            ingestPDFsFinalState();
        }
    };

    const ingestPDFsandRetrieveInitialState = () => {
        setProcessingUserQuery(true);
        setDownloadingUserQueryGS(true);
        setStatusMessage(`Ingesting ${selectedDownloadedPdfs.length} PDF${selectedDownloadedPdfs.length > 1 ? 's' : ''} in PDF Database. Please wait <span></span><span></span><span></span>`);
        setEmbeddingPDFs(true);
    };

    const ingestPDFsandRetrieveFinalState = () => {
        setProcessingUserQuery(false);
        setDownloadingUserQueryGS(false);
        setUpdatePDFList(true);
        setEmbeddingPDFs(false);
        setShowPdfList(false);
        setStatusMessage(`PDF${selectedDownloadedPdfs.length > 1 ? 's' : ''} Ingested Successfully ✅✅<br />
      Retrieving Answer <span></span><span></span><span></span>`);
        setAutoDownloadToggle(false);
    };

    const ingestPDFsandRetrieve = async (selectedDownloadedPdfs) => {
        ingestPDFsandRetrieveInitialState();
        try {
            await deleteUnselectedPdfs(selectedDownloadedPdfs);
            const queryPayload = { query: rephrasedQuery, num_pdf: numPdfs, source: selectedSource };
            await uploadScholarPdf(queryPayload);
            setStatusMessage(`Ingested Successfully ✅✅<br />Retrieving Answer <span></span><span></span><span></span>`);
            const response = await queryPdf({ query: userQuery, chat_history: [] }, { session_id, llm_model: selectedModel });
            setAnswerFromPDF(`${response.data.answer} Sources: ${response.data.source}`);
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const botResponse = {
                text: { answer: response.data.answer, source: response.data.source },
                sender: 'bot',
                timestamp,
                model: selectedModel
            };
            setMessages((prev) => [...prev, botResponse]);
        } catch (error) {
            console.error('Error querying scholar PDFs:', error);
            setMessages((prev) => [...prev, { text: 'Error fetching PDFs.', sender: 'bot' }]);
        } finally {
            ingestPDFsandRetrieveFinalState();
        }
    };

    const handleSendMessageInitialState = () => {
        setSelectedDownloadedPdfs([]);
        setUserQueryInput('');
        setScholarQuery('');
        setRephrasedQuery('');
        setProcessingUserQuery(true);
        setShowRephraseOptions(false);
        setAsktoSearchGoogleScholar(false);
        setShowPdfList(false);
        setDownloadingUserQueryGS(false);
        setDownloadingfromSidebarScholar(false);
        setAutoDownloadToggle(false);
        setEmbeddingPDFs(false);
        setProcessDone(false);
        setSatisfyFromPDFResponse(false);
        setStatusMessage(`Retrieving Answer <span></span><span></span><span></span>`);
        setAnswerFromPDF('');
    };

    const handleSendMessage = async (message = userQueryInput, usePDF = false) => {
        if (processingUserQuery) return;
        if (!weightRecencyToggle) setWeightRecencyToggle(false);

        await clearPdfFolder();
        if (!message.trim()) return;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userMessage = { text: message, sender: 'user', timestamp };
        setMessages((prev) => [...prev, userMessage]);
        handleSendMessageInitialState();

        try {
            let response;
            const sid = getSessionId(setSessionId);
            const filters = {};
            setUserQuery(message);

            if (usePdfOnly || usePDF) {
                if (weightRecencyToggle) {
                    filters.alpha = parseInt(alphaValue, 10);
                    if (yearSelectedOption === "option1" && singleYear) {
                        filters.year = singleYear.getFullYear();
                    } else if (yearSelectedOption === "option2" && yearRange.startYear && yearRange.endYear) {
                        filters.yearRange = {
                            startYear: yearRange.startYear,
                            endYear: yearRange.endYear,
                        };
                    } else if (yearSelectedOption === "option3" && pastYears) {
                        filters.pastYears = parseInt(pastYears, 10);
                    }
                }
                const queryPayload = { query: message, chat_history: [], filters };
                response = await queryPdf(queryPayload, { session_id: sid, llm_model: selectedModel });

                if (/["']?No-Response[.,]?\s*["']?/i.test(response.data.answer)) {
                    const pdfResponseMessage = `No relevant answer found in the PDF database.`;
                    const botResponse = {
                        text: { answer: pdfResponseMessage },
                        sender: 'bot',
                    };
                    setMessages((prev) => [...prev, botResponse]);
                    setProcessingUserQuery(false);
                    setAsktoSearchGoogleScholar(true);
                    return;
                }
                setAnswerFromPDF(`${response.data.answer} Sources: ${response.data.source}`);
                setSatisfyFromPDFResponse(true);
            } else {
                response = { "data": { "answer": "Please select a chatbot!" } };
            }

            response.data.answer = response.data.answer.replaceAll('(http://localhost', '(http://192.168.209.140');

            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const botQuestion = {
                text: { answer: response.data.answer, source: response.data.source },
                sender: 'bot',
                timestamp,
                model: selectedModel
            };
            setMessages((prev) => [...prev, botQuestion]);

        } catch (error) {
            console.error('Error communicating with chatbot:', error);
            setMessages((prev) => [...prev, { text: 'Error communicating with chatbot.', sender: 'bot' }]);
        } finally {
            setProcessingUserQuery(false);
        }
    };

    const handleOptionClick = (index) => {
        setOptions([]);
        setDisableInput(false);
        handleSendMessage(options[index]);
    };

    const toggleAutoDownload = () => {
        setAutoDownloadToggle((prev) => !prev);
    };

    const toggleWeightRecency = () => {
        setWeightRecencyToggle(!weightRecencyToggle);
    };

    const handleAlphaRangeChange = (e) => {
        setAlphaValue(e.target.value);
    };

    const handleOptionChange = (e) => {
        setYearSelectedOption(e.target.value);
        setSingleYear(null);
        setYearRange({ startYear: null, endYear: null });
        setPastYears(null);
    };

    const handleNumPDFsRangeChange = (e) => {
        setNumPdfs(e.target.value);
    };

    const handleUserInputChange = (e) => {
        const textarea = e.target;
        const newValue = textarea.value;
        setUserQueryInput(newValue);
        textarea.style.height = 'auto';
        const newHeight = textarea.scrollHeight;
        const maxHeight = 120;
        textarea.style.height = `${newHeight > maxHeight ? maxHeight : newHeight}px`;
        textarea.style.overflowY = newHeight > maxHeight ? 'scroll' : 'hidden';
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                e.preventDefault();
                setUserQueryInput((prev) => prev + '\n');
            } else {
                e.preventDefault();
                handleSendMessage();
            }
        }
    };

    const handleTogglePdfOnly = () => {
        if (usePdfOnly) setWeightRecencyToggle(false);
        setUsePdfOnly((prev) => {
            const newValue = !prev;
            if (!newValue) {
                setAutoDownloadToggle(false);
            }
            return newValue;
        });
    };

    const handleModelChoose = (event) => {
        setSelectedModel(event.target.value);
    };

    return {
        userQueryInput, setUserQueryInput,
        messages, setMessages,
        processingUserQuery, setProcessingUserQuery,
        selectedModel, setSelectedModel,
        statusMessage, setStatusMessage,
        options, setOptions,
        disableInput, setDisableInput,
        usePdfOnly, setUsePdfOnly,
        answerFromPDF, setAnswerFromPDF,
        satisfyFromPDFResponse, setSatisfyFromPDFResponse,
        asktoSearchGoogleScholar, setAsktoSearchGoogleScholar,
        scholarQuery, setScholarQuery,
        autoDownloadToggle, setAutoDownloadToggle,
        numPdfs, setNumPdfs,
        isDownloading, setIsDownloading,
        downloadingUserQueryGS, setDownloadingUserQueryGS,
        userQuery, setUserQuery,
        downloadingfromSidebarScholar, setDownloadingfromSidebarScholar,
        downloadMessage, setDownloadMessage,
        embeddingPDFs, setEmbeddingPDFs,
        processDone, setProcessDone,
        selectedSource, setSelectedSource,
        queryToShowToUser, setQueryToShowToUser,
        showRephraseOptions, setShowRephraseOptions,
        showRephraseInputBoxGS, setShowRephraseInputBoxGS,
        rephrasedQuery, setRephrasedQuery,
        weightRecencyToggle, setWeightRecencyToggle,
        alphaValue, setAlphaValue,
        yearSelectedOption, setYearSelectedOption,
        singleYear, setSingleYear,
        yearRange, setYearRange,
        pastYears, setPastYears,
        session_id, setSessionId,
        allDownloadedPDFsList, setAllDownloadedPDFsList,
        gsDownloadedPDFs, setGSDownloadedPDFs,
        showPdfList, setShowPdfList,
        selectedDownloadedPdfs, setSelectedDownloadedPdfs,
        updatePDFList, setUpdatePDFList,
        base_url,
        resetSession,
        clearScreen,
        handleSourceChange,
        handleSidebarGSdownloadClick,
        handleSatisfyOption,
        handleAskforGSOption,
        handleRephraseOption,
        handleRephrasedQuerySubmitGS,
        handleCheckboxChange,
        downloadMorePDFs,
        ingestPDFs,
        ingestPDFsandRetrieve,
        handleSendMessage,
        handleOptionClick,
        toggleAutoDownload,
        toggleWeightRecency,
        handleAlphaRangeChange,
        handleOptionChange,
        handleNumPDFsRangeChange,
        handleUserInputChange,
        handleKeyPress,
        handleTogglePdfOnly,
        handleModelChoose,
        isSidebarVisible,
        toggleSidebar,
        showResetModal,
        handleResetClick,
        cancelReset,
        resetSession,
    };
};
