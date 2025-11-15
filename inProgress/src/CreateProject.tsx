import React from "react";
import FolderBackground from "./layouts/FolderBackground";
import CreateProjectForm from "./create/CreateProjectForm";

// page component to create a new project within the folder-style layout
const CreateProject: React.FC = () => {
  return (
    <FolderBackground>
      <CreateProjectForm />
    </FolderBackground>
  );
};

export default CreateProject;
