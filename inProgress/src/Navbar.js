import React from 'react';
import './LandingPage.css'; 

const Navbar = () => {
  return (
    <div className="top-container">
      <div className="logo-section">
        <img src="./pglogo.png" alt="Logo" className="logo-img" />
        <h2 className="logo">inProgress</h2>
      </div>

      <div className="nav-links">
        <a href="#home">Home</a>
        <a href="#profile">Profile</a>
        <a href="#groups">Groups</a>
        <a href="#about">About</a>
      </div>
    </div>
  );
};

export default Navbar;
