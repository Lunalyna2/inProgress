import React, { type ReactNode } from "react";
import "./FolderBackground.css";

// props: allows passing child components/content into the folder layout
interface FolderBackgroundProps {
  children?: ReactNode;
}

// component : renders a folder-style background with a tab and body area
const FolderBackground: React.FC<FolderBackgroundProps> = ({ children }) => {
  return (
    <div className="folder-background">
      <div className="folder-container">
        <div className="folder-tab" />
        <div className="folder-body">
          {children || <p className="placeholder">Contents here.</p>}
        </div>
      </div>
    </div>
  );
};

export default FolderBackground;
