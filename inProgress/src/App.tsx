import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import FlipBookProfile from './flipBookProfile';
import SignUpPage from './components/SignUpPage';
import ForgotPasswordModal from './components/forgotPasswordModal';
import LoginPage from './components/LoginPage';
import CreateProject from './CreateProject';
import FolderPage from './FolderPage';  
import ResetPasswordPage from './components/ResetPasswordPage';

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

    {/* Reset Password Page */}
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    {/* FlipBook after successful login/signup */}
    <Route path="/flipbook" element={<FlipBookProfile />} />

    {/* Create Project Route */}
    <Route path="/create-project" element={<CreateProject />} />

    {/* Folder Page Route */}
    <Route path="/folders" element={<FolderPage />} />

    {/* Catch-all: redirect unknown routes to auth */}
    <Route path="*" element={<Navigate to="/auth" replace />} />
  </Routes>
</Router>

  );
};

export default App;
