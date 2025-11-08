import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; 

// Get the root container from the HTML
const container = document.getElementById('root');

// Ensure the container exists before creating the root
if (container) {
    // createRoot is imported from 'react-dom/client' (React 18 standard)
    const root = createRoot(container);
    
    // Render the application
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    // Handle the case where the root element is not found
    console.error("Failed to find the root element in the document.");
}