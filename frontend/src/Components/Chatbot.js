// Desc: Chatbot component for the frontend
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

import './Chatbot.css';
import Sidebar from './Sidebar';

function Chatbot() {
  const base_url = process.env.REACT_APP_API_URL
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
  const [gsDownloadedPDFs, setGSDownloadedPDFs] = useState([]);
  const [showPdfList, setShowPdfList] = useState(false);
  const [selectedDownloadedPdfs, setSelectedDownloadedPdfs] = useState([]);
  const [updatePDFList, setUpdatePDFList] = useState(false);

  let query = '';

  // Function to generate a unique session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('session_id'); // Check if session ID exists in sessionStorage
    if (!sessionId) {
      sessionId = uuidv4(); // Generate a new session ID if not found
      sessionStorage.setItem('session_id', sessionId); // Save it to sessionStorage
      setSessionId(sessionId);
    }
    return sessionId;
  };

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
    clearScreen()
  };
  // Function to reset the current session
  const resetSession = async () => {
    let sessionId = sessionStorage.getItem('session_id')
    if (sessionId) {
      try {
        const response = await axios.post(`${base_url}/reset_conversation`, null, {
          params: { session_id: sessionId }, // Pass the session_id as a query parameter
        });
        console.log(response.status);
        sessionStorage.removeItem('session_id')
        resetSessionFinalState();
      } catch (error) {
        console.error('Error resetting conversation:', error.message);
      }
    } else {
      console.log("Nothing to reset!")
    }
  };

  // Function to clear the screen
  const clearScreen = async () => {
    setUserQueryInput('')
    setMessages([])
    setOptions([])
    setDisableInput(false)
  };

  // Function to handle post requests
  const postRequest = async (endpoint, data, params = {}) => {
    try {
      return await axios.post(`${base_url}/${endpoint}`, data, {
        params,
        timeout: 300000,
      });
    } catch (error) {
      console.error(`Error in ${endpoint}:`, error);
      throw error;
    }
  };

  // Function to fetch all downloaded PDFs from the server
  const fetchAllDownloadPDFsList = async () => {
    try {
      const response = await fetch(`${base_url}/pdfs`);
      if (!response.ok) throw new Error("Failed to fetch PDF list");
      const data = await response.json();
      setAllDownloadedPDFsList(data);
    } catch (err) {
      console.error('Error fetching PDFs:');
    }
  };

  // Fetch PDFs when the new PDFs are added
  useEffect(() => {
    if (updatePDFList) {
      fetchAllDownloadPDFsList();
      setUpdatePDFList(false);
    }
  }, [updatePDFList]);

  // Initial State and Final State for Sidebar GS Download Click
  const SidebarGSdownloadClickInitialState = () => {
    const session_id = getSessionId()
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


  // Function to handle downloading PDFs from Google Scholar using the sidebar
  const handleSidebarGSdownloadClick = async () => {
    if (!scholarQuery.trim()) return;
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current); // Clear any existing timeout
    await axios.post(`${base_url}/clear-pdf-folder`);
    SidebarGSdownloadClickInitialState();
    try {
      let sidebar_query = scholarQuery;
      const queryPayload = { query: sidebar_query, num_pdf: numPdfs, source: selectedSource };
      await postRequest('download_pdf', queryPayload);
      
      setDownloadMessage(`${numPdfs} PDF${numPdfs > 1 ? 's' : ''} downloaded successfully!`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setDownloadMessage(`Error downloading PDF${numPdfs > 1 ? 's' : ''}. Please try again.`);
      setMessages((prev) => [...prev, { text: 'Error fetching PDFs.', sender: 'bot' }]);
    } finally {
      SidebarGSdownloadClickFinalState();
    }
  };

  // Function to handle Options for Satisfy from PDF Response
  const handleSatisfyOption = async (option) => {
    if (option === 'yes') {
      setSatisfyFromPDFResponse(false);
    } else {
      setSatisfyFromPDFResponse(false);
      setAsktoSearchGoogleScholar(true);
    }
  };

  // Function to handle Options for Google Scholar Download
  const handleAskforGSOption = async (option) => {
    if (option === 'yes') {
      setAsktoSearchGoogleScholar(false);
      setAutoDownloadToggle(true);
      setShowRephraseOptions(true);
      setDownloadingUserQueryGS(true);
    }
    else {
      setShowRephraseOptions(false);
      setProcessingUserQuery(false);
      setAsktoSearchGoogleScholar(false);
      setShowPdfList(false);
    }
  };


  // Function to handle options for rephrasing the query in PDF chatbot for Google Scholar
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
        query = downloadingfromSidebarScholar ? queryToShowToUser : (rephrasedQuery || userQuery);
        const queryPayload = { query: query, num_pdf: numPdfs, source: selectedSource };
        await postRequest('download_pdf', queryPayload);
      
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


  // handleRephrasedQuerySubmitGS Initial and Final State
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


  // Function to Submit Rephrased query in PDF chatbot for Google Scholar
  const handleRephrasedQuerySubmitGS = async () => {
    if (rephrasedQuery.trim()) {
      await axios.post(`${base_url}/clear-pdf-folder`);
      handleRephrasedQuerySubmitGSInitialState();
      try {
        query = downloadingfromSidebarScholar ? queryToShowToUser : (rephrasedQuery || userQuery);
        const queryPayload = { query: query, num_pdf: numPdfs, source: selectedSource };
        await postRequest('download_pdf', queryPayload);
      } catch (error) {
        console.error('Error querying scholar PDFs:', error);
        setMessages((prev) => [...prev, { text: 'Error fetching PDFs.', sender: 'bot' }]);
      } finally {     
        handleRephrasedQuerySubmitGSFinalState();
      }}
  };


  // Function to fetch Downloaded PDFs using Google Scholar
  const fetchGSpdfList = async () => {
    try {
        const response = await axios.get(`${base_url}/list-downloaded-pdfs`);
        console.log('Fetched PDFs:', response.data.pdfs);
        setGSDownloadedPDFs(response.data.pdfs);
    } catch (error) {
        console.error('Error fetching PDFs:', error);
    }
  };


  // Function for selecting PDFs from the list
  const handleCheckboxChange = (pdf) => {
    setSelectedDownloadedPdfs((prevSelected) =>
      prevSelected.includes(pdf)
        ? prevSelected.filter((item) => item !== pdf)
          : [...prevSelected, pdf]
    );
  };

  // Set downloadingUserQueryGS to false when no PDF found
  useEffect(() => {
    if (gsDownloadedPDFs.length === 0) {
      setDownloadingUserQueryGS(false);
      setAutoDownloadToggle(false);
    }
  }, [gsDownloadedPDFs]);
  
  
  // Initial and Final State for downloading more PDFs
  const downloadMorePDFsInitialState = (user_query) => {
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

  // Function to handle downloading more PDFs
  const downloadMorePDFs = async (user_query) => {
    downloadMorePDFsInitialState(user_query);
    try {
      query = downloadingfromSidebarScholar ? queryToShowToUser : (rephrasedQuery || userQuery);
      setStatusMessage(`
        Downloading ${numPdfs} More PDF${numPdfs > 1 ? 's' : ''} from Site: <strong>"${selectedSource}"</strong>. Query: <strong>"${query}"</strong>.
        <br /> 
        Please wait <span></span><span></span><span></span>
      `);
      const queryPayload = { query: query, num_pdf: numPdfs, source: selectedSource };
      const response = await postRequest('download_pdf', queryPayload);
    } catch (error) {
      console.error('Error querying scholar PDFs:', error);
      setMessages((prev) => [...prev, { text: 'Error fetching PDFs.', sender: 'bot' }]);
    } finally {
      downloadMorePDFsFinalState();
    }
  };


  // ingestPDFs Initial and Final State
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
      messageTimeoutRef.current = null; // Clear the ref after timeout is executed
    }, 5000);
  };

  const ingestPDFs = async (selectedDownloadedPdfs) => {
    console.log("I am inside ingestPDFs")
    ingestPDFsInitialState();
    try {
      await axios.post(`${base_url}/delete_unselected_pdfs`, selectedDownloadedPdfs);
      const queryPayload = { query: rephrasedQuery, num_pdf: numPdfs, source: selectedSource };
      await postRequest('upload_scholar_pdf', queryPayload);


    } catch (error) {
      console.error('Error querying scholar PDFs:', error);
    } finally {
      ingestPDFsFinalState();
    }};


  // ingestPDFsandRetrieve Initial and Final State
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
    console.log("I am inside ingestPDFsandRetrieve")
    ingestPDFsandRetrieveInitialState();
    try {
      await axios.post(`${base_url}/delete_unselected_pdfs`, selectedDownloadedPdfs);
      
      const queryPayload = { query: rephrasedQuery, num_pdf: numPdfs, source: selectedSource };
      await postRequest('upload_scholar_pdf', queryPayload);

      setStatusMessage(`Ingested Successfully ✅✅<br />Retrieving Answer <span></span><span></span><span></span>`);
      
      const response = await postRequest('query_pdf', { query: userQuery, chat_history: [] }, { session_id, llm_model: selectedModel })
      setAnswerFromPDF(`${response.data.answer} Sources: ${response.data.source}`);
      const botResponse = {
          text: { answer: response.data.answer, source: response.data.source },
          sender: 'bot',
        };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Error querying scholar PDFs:', error);
      setMessages((prev) => [...prev, { text: 'Error fetching PDFs.', sender: 'bot' }]);
    } finally {
      ingestPDFsandRetrieveFinalState();
    }};

  
  // handleSendMessage Initial and Final State
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

  // Main Function to handle the User Query
  const handleSendMessage = async (message = userQueryInput, usePDF = false) => {
    if (processingUserQuery) return;
    if (!weightRecencyToggle) setWeightRecencyToggle(false);
    
    await axios.post(`${base_url}/clear-pdf-folder`);
    if (!message.trim()) return;

    const userMessage = { text: message, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    handleSendMessageInitialState();
    console.log('User Query:', message);
    try {
      let response;
      const session_id = getSessionId()
      const filters = {};
      
      setUserQuery(message)
      
      if (usePdfOnly || usePDF) {
        console.log('PDF Only')
        // Use PDF Only
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
        console.log('PDF Query:', queryPayload);
        console.log('Sending Request to the query_pdf')
        response = await postRequest('query_pdf', queryPayload, { session_id, llm_model: selectedModel })
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
        console.log("No bot selected!")
        response = {"data": {"answer": "Please select a chatbot!"}}
      }

      response.data.answer = response.data.answer.replaceAll('(http://localhost', '(http://192.168.209.140')

      const botQuestion = {
            text: {answer: response.data.answer, source: response.data.source},
            sender: 'bot'
          }
      setMessages((prev) => [...prev, botQuestion]);

    } catch (error) {
      console.error('Error communicating with chatbot:', error);
      setMessages((prev) => [...prev, { text: 'Error communicating with chatbot.', sender: 'bot' }]);
    } finally {
      setProcessingUserQuery(false);
    }
  };

  const handleOptionClick = (index) => {
    console.log('User selected option: ', index);
    setOptions([])
    setDisableInput(false)
    handleSendMessage(options[index]);
  }

  // PDF Chatbot Sidebar Functions
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
  // PDF Chatbot Sidebar Functions End

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



  // Main Frontend of the Chatbot
  return (
    <div className="chat-container">
      <div className="sidebar-container">
        <Sidebar onUpload={(data) => console.log('Uploaded file data:', data)} 
        answer_from_pdf={answerFromPDF} usePdfOnly={usePdfOnly} 
        setAutoDownloadToggle={setAutoDownloadToggle} autoDownloadToggle={autoDownloadToggle} 
        llm_model={selectedModel}/>

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
                // setAutoDownloadToggle(query.trim() !== '');
                if (!query.trim() && !(showPdfList && gsDownloadedPDFs.length > 0)) {
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
              {/* Spinner Outside Button */}
              {isDownloading && scholarQuery.trim() !== '' && <span className="spinner"></span>}

              {/* Dropdown Menu */}
              <select
                value={selectedSource}
                onChange={handleSourceChange}
                disabled={isDownloading || processingUserQuery || asktoSearchGoogleScholar || !autoDownloadToggle}
                style={{
                  padding: "8px",
                  fontSize: "14px",
                  borderRadius: "4px",
                  outline: "none",
                  border: "1px solid #007bff",
                  cursor: 
                  isDownloading || processingUserQuery 
                  || asktoSearchGoogleScholar || !autoDownloadToggle 
                  ? "not-allowed" : "pointer",
                  border: isDownloading || processingUserQuery 
                  || asktoSearchGoogleScholar || !autoDownloadToggle 
                  ? "1px solid #ccc" : "1px solid #007bff",
                }}
              >
                <option value="All">All</option>
                <option value="IEEE">IEEE</option>
                <option value="Springer">Springer</option>
                <option value="Arxiv">Arxiv</option>
              </select>
            </div>
            {/* Success or Error Message */}
            {downloadMessage && (
              <p className={downloadMessage.includes('Error') ? 'error-message' : 'success-message'}>
                {downloadMessage}
              </p> )}
          </div>

          {/* {usePdfOnly && ( */}
          <div className={`auto-download-toggle-box ${autoDownloadToggle ? 'expanded' : ''}`}>
            <div className="auto-download-toggle">
              <span className="auto-download-label">PDF Chatbot Articles Download</span>
              <label className="auto-download-switch">
                <input type="checkbox" 
                  checked={autoDownloadToggle} 
                  // onChange={toggleAutoDownload}
                  onChange={() => {
                    // Prevent user from toggling it off when the condition is met
                    if (!isDownloading 
                      && !(showPdfList && gsDownloadedPDFs.length > 0) 
                      && !scholarQuery.trim()
                      && !downloadingUserQueryGS) {
                      toggleAutoDownload();
                    }
                  }}
                  style={{
                    cursor: 
                      isDownloading || (showPdfList && gsDownloadedPDFs.length > 0)
                        ? "not-allowed" 
                        : "pointer",
                    color: 
                      isDownloading || (showPdfList && gsDownloadedPDFs.length > 0)
                        ? "#ccc" 
                        : "inherit",
                  }}
                  disabled={
                      isDownloading || processingUserQuery 
                      || (showPdfList && gsDownloadedPDFs.length > 0) 
                      || !autoDownloadToggle
                      || scholarQuery.trim()
                      || downloadingUserQueryGS
                    }
                />
                <span className="slider round"></span>
              </label>
            </div>
            {/* Range Slider for Number of PDFs */}
            {autoDownloadToggle && (
              <div className="range-slider-container">
                <label htmlFor="pdfRange" className="range-slider-label">
                  Select Number of PDFs to Download: {numPdfs}
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
                  style={{
                    background: processingUserQuery ? 
                      `linear-gradient(to right, #aaa ${
                      ((numPdfs - 1) / 9) * 100
                      }%, #ddd ${((numPdfs - 1) / 9) * 100}%)` : `linear-gradient(to right, #007bff ${
                      ((numPdfs - 1) / 9) * 100
                      }%, #ddd ${((numPdfs - 1) / 9) * 100}%)`,
                    cursor: processingUserQuery ? 'not-allowed' : 'pointer',
                  }}
                />
              </div> )}
          </div>
        </div>

        {/* Weight Recency Code */}
        <div className={`weight-recency-toggle-box ${weightRecencyToggle ? 'expanded' : ''}`}>
          <div className="weight-recency-toggle">
            <span className="weight-recency-label">PDF Chatbot Weight Recency</span>
            <label className={`weight-recency-switch ${!usePdfOnly ? 'disabled' : ''}`} >
              <input type="checkbox" 
                checked={weightRecencyToggle} 
                onChange={toggleWeightRecency}
                disabled={!usePdfOnly || processingUserQuery}
              />
              <span className="slider round"></span>
            </label>
          </div>
            
          {weightRecencyToggle && (
          <div className="recency-options">
            <div className="recenc-range-slider-container">
              <label htmlFor="alphaRange" className="recency-range-slider-label">
                Enter value of Alpha 
                <span className="tooltip-container">
                  <span className="tooltip-icon">?</span>
                  <span className="tooltip-text">
                    Alpha balances similarity and recency for the PDF chatbot responses. 
                    Higher values prioritize similarity, while lower values prioritize recency. 
                    This is achieved by calculating the time weight from the Year metadata stored in the PDF chunks. 
                    By default, Alpha is set to 'None'.
                  </span>
                </span>: {alphaValue}
              </label>
              <input
                id="alphaRange"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={alphaValue}
                onChange={handleAlphaRangeChange}
                disabled={processingUserQuery}
                className="recency-range-slider"
                style={{
                  background: processingUserQuery
                  ? `linear-gradient(to right, #aaa ${alphaValue * 100}%, #ccc ${alphaValue * 100}%)`
                  : `linear-gradient(to right, #007bff ${alphaValue * 100}%, #ddd ${alphaValue * 100}%)`,
                  cursor: processingUserQuery ? 'not-allowed' : 'pointer',
                }}
              />
            </div>

            <div className="dropdown-container">
              <label htmlFor="recencyOption">Year Selection:</label>
              <select
                id="recencyOption"
                value={yearSelectedOption}
                onChange={handleOptionChange}
                disabled={processingUserQuery}
              >
                <option value="none">None</option>
                <option value="option1">Select Specific Year</option>
                <option value="option2">Select Year Range</option>
                <option value="option3">Select Past Few Years</option>
              </select>
            </div>
          
            {yearSelectedOption === "option1" && (
              <div className="input-container">
                <label htmlFor="singleYear">Year:</label>
                <DatePicker
                  id="singleYear"
                  selected={singleYear}
                  onChange={(date) => setSingleYear(date)}
                  disabled={processingUserQuery}
                  showYearPicker
                  dateFormat="yyyy"
                  yearItemNumber={9}
                  minDate={new Date(1950, 0, 1)}
                  maxDate={new Date()}
                  placeholderText="Select Year"
                  className="year-picker-input"
                />
              </div>
            )}

            {yearSelectedOption === "option2" && (
              <div className="input-container">
                <label htmlFor="startYear">Start:</label>
                <DatePicker
                  id="startYear"
                  selected={yearRange.startYear ? new Date(yearRange.startYear, 0, 1) : null}
                  onChange={(date) =>{
                    const startYear = date.getFullYear();
                    if (!yearRange.endYear || startYear <= yearRange.endYear) {
                      setYearRange((prevRange) => ({ ...prevRange, startYear }));
                    } else {
                      alert("Start year must be less than or equal to the end year.");
                    }
                  }}
                  showYearPicker
                  dateFormat="yyyy"
                  yearItemNumber={9}
                  minDate={new Date(1950, 0, 1)}
                  maxDate={new Date()}
                  disabled={processingUserQuery}
                  placeholderText="Start Year"
                  className="custom-datepicker-input"
                />
                <label htmlFor="endYear">End:</label>
                <DatePicker
                  id="endYear"
                  selected={yearRange.endYear ? new Date(yearRange.endYear, 0, 1) : null}
                  onChange={(date) => {
                    const endYear = date.getFullYear();
                    if (!yearRange.startYear || endYear >= yearRange.startYear) {
                      setYearRange((prevRange) => ({ ...prevRange, endYear }));
                    } else {
                      alert("End year must be greater than or equal to the start year.");
                    }
                  }}
                  showYearPicker
                  dateFormat="yyyy"
                  yearItemNumber={9}
                  minDate={new Date(1950, 0, 1)}
                  maxDate={new Date()}
                  disabled={processingUserQuery}
                  placeholderText="End Year"
                  className="custom-datepicker-input"
                />
              </div>
            )}

            {yearSelectedOption === "option3" && (
              <div className="input-container">
                <label htmlFor="pastYears">Past 'X' Years:</label>
                <input
                  id="pastYears"
                  type="number"
                  value={pastYears}
                  disabled={processingUserQuery}
                  onChange={(e) => setPastYears(e.target.value)}
                  placeholder="Number of Years"
                  className="year-picker-input"
                />
              </div>
            )}
          </div>
        )}
        </div>
    
        <div className="reset-button-container">
          <button 
            onClick={resetSession} 
            className="reset-button" 
            disabled={processingUserQuery}>
              Reset Conversation
          </button>
        </div>
      </div>
      
      <div className="chatbot">
        <div className="chat-window">
          {messages.map((message, index) => (
            <div key={index} className={`chat-message ${message.sender}`}>
              {typeof message.text === 'string' ? (
                <ReactMarkdown 
                  components={{
                    a: ({node, ...props}) => <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>
                  }}
                  style={{ color: 'black' }}>
                  {message.text}
                </ReactMarkdown>
              ) : message.text?.answer ? (
                /["']?No-Response[.,]?\s*["']?/i.test(message.text.answer) ? (
                  <div style={{ color: 'black', paddingBottom: '10px' }}>No relevant answer found.</div>
                ) : (
                <div style={{ color: 'black' }}>
                  <ReactMarkdown
                    components={{
                      a: ({node, ...props}) => <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>,
                      p: ({ node, ...props }) => <p style={{ color: 'black' }} {...props} />,
                      ul: ({ node, ...props }) => <ul style={{ color: 'black' }} {...props} />,
                      ol: ({ node, ...props }) => <ol style={{ color: 'black' }} {...props} />,
                      li: ({ node, ...props }) => <li style={{ color: 'black' }} {...props} />,
                    }}    
                  >
                    {message.text.answer}
                  </ReactMarkdown>
                  {message.text.source && !/["']?No-Response[.,]?\s*["']?/i.test(message.text.answer) && answerFromPDF==='' && message.text.source !== "No source details available." && (
                    <div>
                      <strong>Sources:</strong>
                      <ul>
                        {message.text.source.split(' | ').map((line, i) => (
                          <li key={i}> 
                          <a 
                            href = {line}
                            target='_blank'
                            rel="noopener noreferrer"
                          >
                            {line}
                          </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {message.text.source && !/["']?No-Response[.,]?\s*["']?/i.test(message.text.answer) && answerFromPDF!=='' && message.text.source !== "No source details available." && (
                    <div>
                      <strong>Sources:</strong>
                      <ol>
                        {message.text.source.split(' | ').map((line, i) => (
                          <li key={i}>
                          <a
                            href={`${base_url}/pdfs/${encodeURIComponent(line.split('\\').pop())}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
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
          ))}


          {(processingUserQuery || processDone) && (
            <div className="chat-message-retriever">
              <div className="loading-dots">
              <div dangerouslySetInnerHTML={{ __html: statusMessage }} />
              </div>
            </div>
          )}

          {satisfyFromPDFResponse && (
            <div className="options-container satisfied-options-container">
            <p className="options-message scholar-options-message">Are you satisfied with the given answer?</p>
            <div className="options-container-buttons">
            <button onClick={() => handleSatisfyOption('yes')} className="option-button yes-button">
              Yes
            </button>
            <button onClick={() => handleSatisfyOption('no')} className="option-button no-button">
              No
            </button>
            </div>
            </div>
          )}

          {asktoSearchGoogleScholar && (
            <div className="options-container ask-gs-container">
            <p className="options-message scholar-options-message">Would you like to search Google Scholar for more information?</p>
            <div className="options-container-buttons">
            <button onClick={() => handleAskforGSOption('yes')} className="option-button yes-button">
              Yes
            </button>
            <button onClick={() => handleAskforGSOption('no')} className="option-button no-button">
              No
            </button>
            </div>
            </div>
          )}

          {showRephraseOptions && (
            <div className="options-container rephrase-options-container">
            <p className="options-message rephrase-options-message">
            Total number of PDFs to be Downloaded: <strong>{numPdfs}</strong> <br />
            Selected source: <strong>{selectedSource}</strong><br /> <br />
            Would you like to rephrase your query for Google Scholar?
            </p>
            <div className="options-container-buttons">
            <button onClick={() => handleRephraseOption('yes')} className="option-button yes-button">
              Yes
            </button>
            <button onClick={() => handleRephraseOption('no')} className="option-button no-button">
              No
            </button>
            </div>
            </div>
          )}


          {showRephraseInputBoxGS && (
            <div className="rephrase-query-input-container">
              <p>Enter your Rephrased Query:</p>
              <input
                type="text"
                value={rephrasedQuery}
                onChange={(e) => { setRephrasedQuery(e.target.value); }}
                placeholder="Enter your new query here"
                className="rephrase-query-input-box"
              />
              <button onClick={handleRephrasedQuerySubmitGS} className="rephrase-query-submit-button">
                Submit
              </button>
              </div>
          )}

        
        {/* PDF List Display */}
        
        {!processingUserQuery && !isDownloading && showPdfList && gsDownloadedPDFs.length > 0 &&(
        <div className="pdf-selection">
          {/* <h6 style={{ fontSize: '17px', marginBottom: '10px' }}>Select which PDF to Embed for Query: "{scholarQuery}":</h6> */}
          <h6 style={{ fontSize: '17px', marginBottom: '10px' }}>
            Select which PDF to Embed for Query: "{downloadingfromSidebarScholar ? queryToShowToUser : (rephrasedQuery || userQuery)}":
          </h6>
          <ol style={{
            paddingLeft: '20px',
            fontSize: '16px',
            lineHeight: '2',
            }} >
            {gsDownloadedPDFs.map((pdf, index) => (
              <li key={index} >
                <input
                  type="checkbox"
                  id={`pdf-${index}`}
                  checked={selectedDownloadedPdfs.includes(pdf)}
                  onChange={() => handleCheckboxChange(pdf)}
                        style={{ 
                          transform: 'scale(1.6)',
                          marginRight: '10px',
                          marginLeft: '10px',
                          verticalAlign: 'middle', 
                        }}
                />
                <label htmlFor={`pdf-${index}`}>
                  <a
                    href={`${base_url}/downloaded-pdfs/${encodeURIComponent(pdf)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none'}}
                  >
                    {pdf}
                  </a>
                </label>
              </li>
            ))}
          </ol>
          {selectedDownloadedPdfs.length > 0 && (
            <div>
              <button onClick={() => { downloadingfromSidebarScholar ? ingestPDFs(selectedDownloadedPdfs) : ingestPDFsandRetrieve(selectedDownloadedPdfs); }} 
              className="submit-button"
                style={{
                padding: '8px 16px',
                backgroundColor: 'rgb(106, 138, 34)',
                color: '#FFFFFF',
                fontSize: '14px',
                border: '1px solid rgb(106, 138, 34)',
                borderRadius: '4px',
                cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = 'rgb(151, 193, 57)')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'rgb(106, 138, 34)')}
              >
                {selectedDownloadedPdfs.length === 1 ? `Embed ${selectedDownloadedPdfs.length} PDF ✅` : `Embed ${selectedDownloadedPdfs.length} PDFs ✅`}
              </button>
            </div>
          )}
          {selectedDownloadedPdfs.length === 0 && (
          <button onClick={() => { downloadMorePDFs(downloadingfromSidebarScholar ? scholarQuery : rephrasedQuery)}}
            style={{
              padding: '8px 16px',
              backgroundColor: '#002f6c',
              color: '#FFFFFF',
              fontSize: '14px',
              border: '1px solid #002f6c',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#0056b3')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#002f6c')}
          >
            {/* Get More PDFs 📥 */}
            Download {numPdfs} More PDF{numPdfs > 1 ? 's' : ''} from Source: "{selectedSource}" 📥
          </button>
          )}
        </div>
        )}

        {/* List of Embedded PDFs */}
        {processDone && selectedDownloadedPdfs.length > 0 && (
          <div className="selected-pdfs">
            <h6 style={{ fontSize: '17px', marginBottom: '0px', marginTop: '15px' }}>Selected PDFs:</h6>
            <ul style={{
                paddingLeft: '20px',
                fontSize: '18px',
                lineHeight: '2',
                }}
              >
            {selectedDownloadedPdfs.map((pdf, index) => (
            <li key={index}>
              <a
              href={`${base_url}/pdfs/${encodeURIComponent(pdf)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none'}}
              >
                {pdf}
              </a>
            </li>
            ))}
            </ul>
          </div>
        )}

        {/* Message when no PDF found in Google Scholar */}
        {!processingUserQuery && !isDownloading && showPdfList && gsDownloadedPDFs.length === 0 && (
          <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px' }}>
          <p style={{ margin: '0', fontSize: '16px' }}>No more PDFs found on Google Scholar!! Please try rephrasing your query.</p>
        </div>
        )}

        {options && (
              <div className="options-container-kg">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(index)}
                  className="option-button-kg"
                >
                  <ReactMarkdown
                  components={{
                      a: ({node, ...props}) => <a href={props.href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{props.children}</a>
                  }}>
                    {option}
                  </ReactMarkdown>
                </button>
              ))}
            </div>
        )}

        </div>

        <div className="chat-input">
          <textarea
            id="textarea"
            rows="1"
            value={userQueryInput}
            onChange={handleUserInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            disabled={disableInput}
          />
          <div style={{display: "flex", width: "120px",flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
            <button class='chat-send-button' style={{width: "100%", marginBottom: "7px", marginLeft: "0px"}} onClick={() => handleSendMessage()} disabled={processingUserQuery}>
              Send
            </button>
            
            <select style={{width: "100%", marginBottom: "7px"}} value={selectedModel} onChange={handleModelChoose}>
              <option value="4o">4o</option>
              <option value="4o-mini">4o-mini</option>
              <option value="o1">o1-preview</option>
              <option value="o1-mini">o1-mini</option>
              <option value="o3-mini">o3-mini</option>
              <option value="llama-3.1-8b-groq">llama-3.1-8b-groq</option>
              <option value="llama-3.1-8b-fireworks">llama-3.1-8b-fireworks</option>
              <option value="llama-3.3-70b">llama-3.3-70b</option>
              <option value="llama-3.1-405b">llama-3.1-405b</option>
            </select>
            
          </div>
        </div>

        
      </div>
    </div>
  );
}

export default Chatbot;
