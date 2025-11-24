import React from 'react';
import { useNavigate } from "react-router-dom";
import './DashboardNavbar.css';

interface NavbarProps {
  onProfileClick?: () => void;
  onHomeClick?: () => void;
}

const DashNavbar: React.FC<NavbarProps> = ({ onProfileClick, onHomeClick }) => {
  const navigate = useNavigate();

  // Helper function for navigation with optional callback
  const handleNavigate = (path: string, callback?: () => void) => {
    navigate(path);
    callback?.();
  };

  return (
    <div className="top-container">
      <div className="logo-section">
        <img src="./pglogo.png" alt="Logo" className="logo-img" />
        <h2 className="logo">inProgress</h2>
      </div>
//corrected links
      <div className="nav-links">
        <button
          className="menu-button"
          onClick={() => window.location.href = "http://localhost:3000"}
        >
          Home
        </button>
        <button
          className="menu-button"
          onClick={() => handleNavigate("/created-projects")}
        >
          Projects
        </button>
        <button
          className="menu-button"
          onClick={() => handleNavigate("/flipbook")}
        >
          Profile
        </button>
      </div>
    </div>
  );
};

export default DashNavbar;
