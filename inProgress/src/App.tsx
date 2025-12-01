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

import JoinedProjectFolderWrapper from "./pages/JoinedProjectFolderWrapper";
import ProjectOwnerFolder from "./pages/ProjectOwnerFolder";
import JoinedProjectFolder from "./pages/JoinedProjectFolder"; // if needed

import ProtectedRoute from "./components/protectedRoutes";

export interface LoginPageProps {
  switchToSignup: () => void;
}

export interface SignUpPageProps {
  switchToLogin: () => void;
}

const App: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);

  const goToLogin = () => setShowLogin(true);
  const goToSignUp = () => setShowLogin(false);

  return (
    <Router>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth screen */}
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

        {/* Flipbook */}
        <Route
          path="/flipbook"
          element={
            <ProtectedRoute>
              <FlipBookProfile />
            </ProtectedRoute>
          }
        />

        {/* Create Project */}
        <Route
          path="/create-project"
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          }
        />

        {/* Created Projects */}
        <Route
          path="/created-projects"
          element={
            <ProtectedRoute>
              <CreatedProjects />
            </ProtectedRoute>
          }
        />

        {/* Create project form */}
        <Route
          path="/create-project-form"
          element={
            <ProtectedRoute>
              <CreateProjectForm />
            </ProtectedRoute>
          }
        />

        {/* Project Interface */}
        <Route
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <ProjectInterface />
            </ProtectedRoute>
          }
        />

        {/* ---------------------------------------- */}
        {/*   FOLDER ROUTES YOUR CARD NAVIGATES TO   */}
        {/* ---------------------------------------- */}

        {/* Project Owner Folder */}
        <Route
          path="/projectownerfolder/:id"
          element={
            <ProtectedRoute>
              <ProjectOwnerFolder />
            </ProtectedRoute>
          }
        />

        {/* Dashboard → Joining projects */}
        <Route
          path="/joinprojectsfolder/:id"
          element={
            <ProtectedRoute>
              <AcceptOrDecline projectId={""} />
            </ProtectedRoute>
          }
        />

        {/* Joined Projects */}
        <Route
          path="/joinedprojectsfolder/:id"
          element={
            <ProtectedRoute>
              <JoinedProjectFolderWrapper />
            </ProtectedRoute>
          }
        />

        {/* Folders Page */}
        <Route path="/folders" element={<FolderPage />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
