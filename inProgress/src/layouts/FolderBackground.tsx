import React, { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import "./FolderBackground.css";

// Props: allows passing child components/content into the folder layout
interface FolderBackgroundProps {
  children?: ReactNode;
}

// Component: renders a folder-style background with a tab and body area
const FolderBackground: React.FC<FolderBackgroundProps> = ({ children }) => {
  const navigate = useNavigate();
  return (
    <div className="folder-background">
      <div className="folder-container">
        <div className="folder-tab" />
        <div className="folder-body">
          <button
            className="exit-button"
            onClick={() => navigate("/dashboard")}
            aria-label="Exit to dashboard"
          >
            ✕
          </button>

          <div className="folder-content">
            {children || <p className="placeholder">Contents here.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderBackground;
