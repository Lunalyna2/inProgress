import React from 'react';
import { useNavigate } from "react-router-dom";
import './DashboardNavbar.css';

const API_URL = process.env.REACT_APP_API_URL

interface NavbarProps {
  onProfileClick?: () => void;
  onHomeClick?: () => void;
}

const DashNavbar: React.FC<NavbarProps> = ({ onProfileClick, onHomeClick }) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string, callback?: () => void) => {
    navigate(path);
    callback?.();
  };

  const handleLogout = async () => {
  const userId = localStorage.getItem("userId");
  if (userId) {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    }
  }

  localStorage.removeItem("userToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  localStorage.removeItem("email");

  navigate("/login");
};

  return (
    <div className="top-container">
      <div className="logo-section">
        <img src="./pglogo.png" alt="Logo" className="logo-img" />
        <h2 className="logo">inProgress</h2>
      </div>

      <div className="nav-links">
        <button
          className="menu-button"
          onClick={() => handleNavigate("/dashboard")}
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
          onClick={() => handleNavigate("/flipbook?source=profile")}
        >
          Profile
        </button>
        <button
          className="menu-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default DashNavbar;
