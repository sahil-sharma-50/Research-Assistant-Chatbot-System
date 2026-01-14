import { v4 as uuidv4 } from 'uuid';

export const getSessionId = (setSessionId) => {
  let sessionId = sessionStorage.getItem('session_id'); // Check if session ID exists in sessionStorage
  if (!sessionId) {
    sessionId = uuidv4(); // Generate a new session ID if not found
    sessionStorage.setItem('session_id', sessionId); // Save it to sessionStorage
    if (setSessionId) setSessionId(sessionId);
  } else {
      if (setSessionId) setSessionId(sessionId);
  }
  return sessionId;
};

export const clearSession = () => {
    sessionStorage.removeItem('session_id');
};
