import React, { useState, useEffect } from "react";
import "./CreatedProjects.css";
import DashNavbar from "./DashboardNavbar";
import FolderProjectCard from "./FolderProjectCard"; 
import ProjectCommentsModal from "./ProjectCommentsModal";
import { getComments } from "../api/comments";

interface Project {
  id: number;
  title: string;
  description: string;
}

const CreatedProjects: React.FC = () => {
  const [upvotes, setUpvotes] = useState<{ [key: number]: number }>({});
  const [hasUpvoted, setHasUpvoted] = useState<{ [key: number]: boolean }>({});
  const [commentsCount, setCommentsCount] = useState<{ [key: number]: number }>({});
  const [selectedProjectIdForComments, setSelectedProjectIdForComments] = useState<number | null>(null);

  const projects: Project[] = [
    { id: 1, title: "E-Commerce Platform", description: "A full-stack e-commerce application..." },
    { id: 2, title: "Task Management App", description: "A collaborative tool with drag-and-drop..." },
    { id: 3, title: "Weather Dashboard", description: "An interactive weather app..." },
  ];

  useEffect(() => {
    const loadCounts = async () => {
      const counts: { [key: number]: number } = {};
      for (const p of projects) {
        const comments = await getComments(p.id);
        counts[p.id] = comments.length;
      }
      setCommentsCount(counts);
    };
    loadCounts();
  }, []);

  const handleUpvote = (projectId: number) => {
    if (!hasUpvoted[projectId]) {
      setUpvotes(prev => ({ ...prev, [projectId]: (prev[projectId] || 0) + 1 }));
      setHasUpvoted(prev => ({ ...prev, [projectId]: true }));
    }
  };

  return (
    <div className="projects-container">
      <DashNavbar />

      <h1 className="projects-title">My Projects</h1>

      <div className="projects-grid">
        {projects.map(project => (
          <FolderProjectCard
            key={project.id}
            project={project}
            upvotes={upvotes[project.id] || 0}
            hasUpvoted={!!hasUpvoted[project.id]}
            commentCount={commentsCount[project.id] || 0}
            onUpvote={handleUpvote}
            onOpenComments={(id) => setSelectedProjectIdForComments(id)}
          />
        ))}
      </div>

      {selectedProjectIdForComments !== null && (
        <ProjectCommentsModal
          projectId={selectedProjectIdForComments}
          projectTitle={projects.find(p => p.id === selectedProjectIdForComments)?.title || ""}
          projectDescription={projects.find(p => p.id === selectedProjectIdForComments)?.description || ""}
          onClose={() => setSelectedProjectIdForComments(null)}
          onCommentsChange={(newCount: number) =>
            setCommentsCount(prev => ({
              ...prev,
              [selectedProjectIdForComments]: newCount
            }))
          }
        />
      )}
    </div>
  );
};

export default CreatedProjects;
