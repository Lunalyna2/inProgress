import React from 'react';

interface NavbarProps {
  onAboutClick: () => void;
  onHomeClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAboutClick, onHomeClick }) => {
  return (
    <div className="top-container">
      <div className="logo-section">
        <img src="./pglogo.png" alt="Logo" className="logo-img" />
        <h2 className="logo">inProgress</h2>
      </div>

      <div className="nav-links">
        <a href="#home" onClick={onHomeClick} className="menu-link">Home</a>
        <a href="#about" onClick={onAboutClick} className="menu-link">About</a>
      </div>
    </div>
  );
};

export default Navbar;
