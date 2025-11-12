import React from "react";
import "./FolderBackground.css";

const FolderBackground = ({ children }) => {
  return (
    <div className="folder-background">
      <div className="folder-container">
        <div className="folder-tab">{/* Empty tab*/}</div>
        <div className="folder-body">
          {children || <p className="placeholder">Contents here.</p>}
        </div>
      </div>
    </div>
  );
};

export default FolderBackground;
