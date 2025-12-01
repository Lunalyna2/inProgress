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

import ProtectedRoute from "./components/protectedRoutes";

const App: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);

  const goToLogin = () => setShowLogin(true);
  const goToSignUp = () => setShowLogin(false);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

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

        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/flipbook"
          element={
            <ProtectedRoute>
              <FlipBookProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-project"
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          }
        />

        <Route
          path="/created-projects"
          element={
            <ProtectedRoute>
              <CreatedProjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-project-form"
          element={
            <ProtectedRoute>
              <CreateProjectForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <ProjectInterface />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projectownerfolder/:projectId"
          element={
            <ProtectedRoute>
              <ProjectOwnerFolder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/joinprojectsfolder/:projectId"
          element={
            <ProtectedRoute>
              <AcceptOrDecline projectId={""} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/joinedprojectsfolder/:projectId"
          element={
            <ProtectedRoute>
              <JoinedProjectFolderWrapper />
            </ProtectedRoute>
          }
        />

        <Route path="/folders" element={<FolderPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
