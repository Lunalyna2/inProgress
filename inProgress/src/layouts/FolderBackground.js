import React from "react";
import "./FolderBackground.css";

const FolderBackground = ({
  title = "Folder",
  subtitle = "FolderBackground",
  children,
}) => {
  return (
    <div className="folder-background">
      <div className="folder-container">
        <div className="folder-tab">
          <div className="folder-tab-title">{title}</div>
          <div className="folder-tab-subtitle">{subtitle}</div>
        </div>
        <div className="folder-body">
          {children || <p className="placeholder">Contents here.</p>}
        </div>
      </div>
    </div>
  );
};

export default FolderBackground;
