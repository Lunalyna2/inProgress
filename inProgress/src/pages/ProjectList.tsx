import React, { useEffect, useState } from "react";
import FolderProjectCard from "./FolderProjectCard";
import "./ProjectList.css";

interface Project {
  id: number;
  title: string;
  upvotes: number;
  commentCount: number;
}

const API_URL = "http://localhost:5000/api";

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  const token = localStorage.getItem("userToken");

  const fetchCreatedProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects/created`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch created projects");

      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCreatedProjects();
  }, []);

  const handleUpvote = (id: number) => {
    console.log("Upvote project:", id);
    // Implement API call if needed
  };

  const handleOpenComments = (id: number) => {
    console.log("Open comments for project:", id);
    // Implement modal or redirect if needed
  };

  return (
    <div className="project-list-container">
      {projects.length > 0 ? (
        projects.map((project) => (
          <FolderProjectCard
            key={project.id}
            project={project}
            upvotes={project.upvotes || 0}
            hasUpvoted={false}
            commentCount={project.commentCount || 0}
            onUpvote={handleUpvote}
            onOpenComments={handleOpenComments}
            viewType="created"
          />
        ))
      ) : (
        <p>No created projects yet.</p>
      )}
    </div>
  );
};

export default ProjectList;
