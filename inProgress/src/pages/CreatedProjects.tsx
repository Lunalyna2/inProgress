import React, { useState, useEffect } from "react";
import "./CreatedProjects.css";
import DashNavbar from "./DashboardNavbar";
import FolderProjectCard from "./FolderProjectCard"; 
import ProjectCommentsModal from "./ProjectCommentsModal";

const API_URL = process.env.REACT_APP_API_URL

interface Project {
  id: number;
  title: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const CreatedProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [upvotes, setUpvotes] = useState<{ [key: number]: number }>({});
  const [hasUpvoted, setHasUpvoted] = useState<{ [key: number]: boolean }>({});
  const [commentsCount, setCommentsCount] = useState<{ [key: number]: number }>({});
  const [selectedProjectIdForComments, setSelectedProjectIdForComments] = useState<number | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/projects/created`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProjects(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const loadCommentsCount = async () => {
      const counts: { [key: number]: number } = {};
      for (const p of projects) {
        try {
          const res = await fetch(`${API_URL}/comments/project/${p.id}`);
          if (!res.ok) continue;
          const comments = await res.json();
          counts[p.id] = comments.length;
        } catch (error) {
          counts[p.id] = 0;
        }
      }
      setCommentsCount(counts);
    };
    if (projects.length > 0) loadCommentsCount();
  }, [projects]);

  const handleUpvote = async (projectId: number) => {
    if (!hasUpvoted[projectId]) {
      try {
        const res = await fetch(`${API_URL}/projects/${projectId}/upvote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) throw new Error("Upvote failed");
        setUpvotes(prev => ({ ...prev, [projectId]: (prev[projectId] || 0) + 1 }));
        setHasUpvoted(prev => ({ ...prev, [projectId]: true }));
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="projects-container created-projects-page">
      <DashNavbar />
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
            viewType="created" 
          />
        ))}
      </div>

      {selectedProjectIdForComments !== null && (
        <ProjectCommentsModal
          projectId={selectedProjectIdForComments}
          projectTitle={projects.find(p => p.id === selectedProjectIdForComments)?.title || ""}
          projectDescription=""
          onClose={() => setSelectedProjectIdForComments(null)}
          onCommentsChange={(newCount: number) =>
            setCommentsCount(prev => ({ ...prev, [selectedProjectIdForComments]: newCount }))
          }
        />
      )}
    </div>
  );
};

export default CreatedProjects;
