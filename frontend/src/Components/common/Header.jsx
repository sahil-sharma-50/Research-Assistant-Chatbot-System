import React from "react";
import './Header.css';
import logo from "../../images/logo192.png"

const Header = ({ theme, toggleTheme, isSidebarVisible, toggleSidebar }) => {
  return (
    <div className={`header theme-${theme}`}>
      <div className="main_header">
        <div className="header-info">
          <h1 className="headerText">
            <i className="fas fa-robot"></i> Research Assistant
          </h1>
        </div>
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
