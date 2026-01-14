import React from 'react';
import Header from './Components/common/Header';
import Chatbot from './Components/Chatbot/Chatbot';
import { useTheme } from './hooks/useTheme';
import { useChatbot } from './hooks/useChatbot';
import './App.css';

function App() {
  const { theme, toggleTheme } = useTheme();
  const chatbot = useChatbot();

  return (
    <div className={`App theme-${theme}`}>
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        isSidebarVisible={chatbot.isSidebarVisible}
        toggleSidebar={chatbot.toggleSidebar}
      />
      <Chatbot theme={theme} chatbot={chatbot} />
    </div>
  );
}

export default App;
