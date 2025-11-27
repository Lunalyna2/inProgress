import React, { useState } from "react";
import "./CreatedProjects.css";
import DashNavbar from "./DashboardNavbar";
import { ArrowBigUp, MessageCircle } from "lucide-react";
import ProjectCommentsModal from "./ProjectCommentsModal";

interface Project {
  id: number;
  title: string;
  description: string;
  image?: string;
}

const CreatedProjects: React.FC = () => {
  const [upvotes, setUpvotes] = useState<{ [key: number]: number }>({});
  const [hasUpvoted, setHasUpvoted] = useState<{ [key: number]: boolean }>({});
  const [selectedProjectIdForComments, setSelectedProjectIdForComments] = useState<number | null>(null);

  const currentUserId = Number(localStorage.getItem("userId"));

  const projects: Project[] = [
    { id: 1, title: "E-Commerce Platform", description: "A full-stack e-commerce application with payment integration and inventory management.", image: "https://via.placeholder.com/400x200" },
    { id: 2, title: "Task Management App", description: "A collaborative tool with drag-and-drop functionality and team workspaces.", image: "https://via.placeholder.com/400x200" },
    { id: 3, title: "Weather Dashboard", description: "An interactive weather app with real-time forecasts and alerts.", image: "https://via.placeholder.com/400x200" },
  ];

  return (
    <div className="projects-container">
      <DashNavbar onProfileClick={() => {}} onHomeClick={() => {}} />
      <h1 className="projects-title">My Projects</h1>

      <div className="projects-grid">
        {projects.map(project => (
          <div key={project.id} className="project-card">
            {project.image && <img src={project.image} alt={project.title} />}
            <h2>{project.title}</h2>
            <p>{project.description}</p>

            <div className="action-icons">
              <div
                className="upvote-wrapper"
                onClick={() => {
                  if (!hasUpvoted[project.id]) {
                    setUpvotes(prev => ({ ...prev, [project.id]: (prev[project.id] || 0) + 1 }));
                    setHasUpvoted(prev => ({ ...prev, [project.id]: true }));
                  }
                }}
              >
                <ArrowBigUp className={hasUpvoted[project.id] ? "upvoted" : ""} />
                <span className="upvote-count">{upvotes[project.id] || 0}</span>
              </div>

              <MessageCircle
                className="action-icon"
                onClick={() => setSelectedProjectIdForComments(project.id)}
              />
              <span className="comment-count">0</span>
            </div>
          </div>
        ))}
      </div>

      {selectedProjectIdForComments !== null && (
        <ProjectCommentsModal
          projectId={selectedProjectIdForComments}
          projectTitle={projects.find(p => p.id === selectedProjectIdForComments)?.title || "No title"}
          projectDescription={projects.find(p => p.id === selectedProjectIdForComments)?.description || "No description"}
          onClose={() => setSelectedProjectIdForComments(null)}
        />
      )}
    </div>
  );
};

export default CreatedProjects;
