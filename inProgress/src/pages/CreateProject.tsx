import React from "react";
import FolderBackground from "../layouts/FolderBackground";
import CreateProjectForm from "../create/CreateProjectForm";
import DashNavbar from "./DashboardNavbar";

// page component to create a new project within the folder-style layout
const CreateProject: React.FC = () => {
  return (
    <>
      <DashNavbar onHomeClick={() => {}} onProfileClick={() => {}} />
      <FolderBackground>
        <CreateProjectForm />
      </FolderBackground>
    </>
  );
};

export default CreateProject;
