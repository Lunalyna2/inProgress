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
