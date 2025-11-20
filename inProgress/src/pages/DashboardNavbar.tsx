import React from 'react';
import { Link } from "react-router-dom";

interface NavbarProps {
  onProfileClick: () => void;
  onHomeClick: () => void;
}

const DashNavbar: React.FC<NavbarProps> = ({ onProfileClick, onHomeClick }) => {
  return (
    <div className="top-container">
      <div className="logo-section">
        <img src="./pglogo.png" alt="Logo" className="logo-img" />
        <h2 className="logo">inProgress</h2>
      </div>

      <div className="nav-links">
        <Link to="/dashboard" className="menu-link">Home</Link>
        <Link to="/dashboard" className="menu-link">Profile</Link>

      </div>
    </div>
  );
};

export default DashNavbar;
