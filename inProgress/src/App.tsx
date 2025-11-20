import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import FlipBookProfile from './pages/flipBookProfile';
import SignUpPage from './components/SignUpPage';
import ForgotPasswordModal from './components/forgotPasswordModal';
import LoginPage from './components/LoginPage';
import CreateProject from './pages/CreateProject';
import FolderPage from './pages/FolderPage';  
import ResetPasswordPage from './components/ResetPasswordPage';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ProjectInterface from './pages/projectInterface';

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
  const [showLogin, setShowLogin] = useState(false); // toggle between sign up / login

  const goToLogin = () => setShowLogin(true);
  const goToSignUp = () => setShowLogin(false);

  return (
  <Router>
    <Routes>

      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth route */}
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

      {/* Reset Password */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* FlipBook */}
      <Route path="/flipbook" element={<FlipBookProfile />} />

      {/* Create Project */}
      <Route path="/create-project" element={<CreateProject />} />

      {/* Folder Page */}
      <Route path="/folders" element={<FolderPage />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  </Router>
);


    <div className="App">
      <LandingPage/>
    </div>
};

export default App;
