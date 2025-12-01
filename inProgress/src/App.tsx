import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import FlipBookProfile from "./pages/flipBookProfile";
import SignUpPage from "./components/SignUpPage";
import LoginPage from "./components/LoginPage";
import CreateProject from "./pages/CreateProject";
import CreatedProjects from "./pages/CreatedProjects";
import FolderPage from "./pages/FolderPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import AcceptOrDecline from "./create/AcceptOrDecline";
import ProjectInterface from "./pages/projectInterface";
import CreateProjectForm from "./create/CreateProjectForm";
import JoinedProjectFolder from "./pages/JoinedProjectFolder";
import ProjectOwnerFolder from "./pages/ProjectOwnerFolder";

import JoinedProjectFolderWrapper from "./pages/JoinedProjectFolderWrapper";
import ProtectedRoute from "./components/protectedRoutes";

// // Define interfaces for props
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
        <Route path="/flipbook" element={<ProtectedRoute> <FlipBookProfile /> </ProtectedRoute>} />

        {/* Create Project */}
        <Route path="/create-project" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />

        {/* Created Projects */}
        <Route path="/created-projects" element={<ProtectedRoute><CreatedProjects /></ProtectedRoute>} />

        {/*create project form*/}
        <Route path="/create-project-form" element={<ProtectedRoute><CreateProjectForm /></ProtectedRoute>} />

        {/* Project Interface */}
        <Route path="/project/:projectId" element={<ProtectedRoute><ProjectInterface /></ProtectedRoute>} />

        {/* Project Owner Folder */}
        <Route path="/project-owner-folder/:projectId" element={<ProtectedRoute><ProjectOwnerFolder /></ProtectedRoute>} />

        {/* Joined Collaborator */}
        <Route
        path="/joined-collaborator-folder/:projectId"
        element={<ProtectedRoute><JoinedProjectFolderWrapper /></ProtectedRoute>}
        />

        {/* Folder Page */}
        <Route path="/folders" element={<FolderPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;


