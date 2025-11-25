import React from "react";
import "./CreatedProjects.css";
import DashNavbar from "./DashboardNavbar";

interface Project {
  id: number;
  title: string;
  description: string;
  image?: string;
}

const CreatedProjects = () => {
  const projects: Project[] = [
    {
      id: 1,
      title: "E-Commerce Platform",
      description:
        "A full-stack e-commerce application with payment integration and inventory management.",
      image: "https://via.placeholder.com/400x200",
    },
    {
      id: 2,
      title: "Task Management App",
      description:
        "A collaborative tool with drag-and-drop functionality and team workspaces.",
      image: "https://via.placeholder.com/400x200",
    },
    {
      id: 3,
      title: "Weather Dashboard",
      description:
        "An interactive weather app with real-time forecasts and alerts.",
      image: "https://via.placeholder.com/400x200",
    },
  ];

  return (
    <div className="projects-container">
      <DashNavbar onProfileClick={() => {}} onHomeClick={() => {}} />

      <div className="projects-wrapper">
        <h1 className="projects-title">My Projects</h1>

        <div className="projects-grid">
          {projects.map((project) => (
           <div className="project-card">
            <div className="project-image">
              <img src={project.image} alt={project.title} />
            </div>

            <h3 className="project-title">{project.title}</h3>

            <p className="project-description">
              {project.description}
            </p>
          </div>

          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatedProjects;
