import React, { useState } from 'react'; 
import SignUpPage from './SignUpPage'; 
import LoginPage from './LoginPage'; 

// Define a union type for the pages
type Page = 'signup' | 'login';

// Define interfaces for the props expected by each page component
export interface LoginPageProps {
    switchToSignup: () => void;
}

export interface SignUpPageProps {
    switchToLogin: () => void;
}

const App: React.FC = () => {
  // State to track the current page being displayed
  const [currentPage, setCurrentPage] = useState<Page>('signup');

  // Function to switch the view
  const switchToLogin = () => {
    setCurrentPage('login');
  };
  
  const switchToSignup = () => {
    setCurrentPage('signup');
  };

  // Conditional Rendering Logic
  const renderPage = () => {
    if (currentPage === 'login') {
      // TypeScript now ensures LoginPage receives a function that matches LoginPageProps
      return <LoginPage switchToSignup={switchToSignup} />;
    } else {
      // TypeScript now ensures SignUpPage receives a function that matches SignUpPageProps
      return <SignUpPage switchToLogin={switchToLogin} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
};

export default App;


import React, { useState } from 'react'; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FlipBookProfile from './flipBookProfile';
import SignUpPage from './components/SignUpPage'; 
import LoginPage from './components/LoginPage'; 

// Define a union type for the pages
type Page = 'signup' | 'login';

// Define interfaces for the props expected by each page component
export interface LoginPageProps {
    switchToSignup: () => void;
}

export interface SignUpPageProps {
    switchToLogin: () => void;
}

const App: React.FC = () => {
  // State to track the current page being displayed
  const [currentPage, setCurrentPage] = useState<Page>('signup');

  // Function to switch the view
  const switchToLogin = () => {
    setCurrentPage('login');
  };
  
  const switchToSignup = () => {
    setCurrentPage('signup');
  };

  // Conditional Rendering Logic
  const renderPage = () => {
    if (currentPage === 'login') {
      return <LoginPage switchToSignup={switchToSignup} />;
    } else {
      return <SignUpPage switchToLogin={switchToLogin} />;
    }
  };

  return (
    <Router>
      <Routes>
        {/* ⭐ Your FlipBook landing page route */}
        <Route path="/" element={<FlipBookProfile />} />

        {/* ⭐ Your old state-based system kept exactly the same */}
        <Route path="/auth" element={renderPage()} />
      </Routes>
    </Router>
  );
};

export default App;
`

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import FlipBookProfile from './flipBookProfile';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false); // toggle between sign up / login

  const goToLogin = () => setShowLogin(true);
  const goToSignUp = () => setShowLogin(false);

  return (
    <Router>
      <Routes>
        {/* Default landing route */}
        <Route path="/" element={<Navigate to="/auth" replace />} />

        {/* Auth route: shows SignUp by default */}
        <Route
          path="/auth"
          element={
            showLogin ? (
              <LoginPage switchToSignup={goToSignUp} />
            ) : (
              <SignUpPage switchToLogin={goToLogin} />
            )
          }
        />

        {/* FlipBook after successful login/signup */}
        <Route path="/flipbook" element={<FlipBookProfile />} />

        {/* Catch-all: redirect unknown routes to auth */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
