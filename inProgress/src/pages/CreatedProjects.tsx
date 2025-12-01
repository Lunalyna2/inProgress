import React, { useState, useEffect } from "react";
import "./CreatedProjects.css";
import DashNavbar from "./DashboardNavbar";
import FolderProjectCard from "./FolderProjectCard";
import ProjectCommentsModal from "./ProjectCommentsModal";

const API_URL = process.env.REACT_APP_API_URL

interface Project {
  id: number;
  title: string;
  description?: string;
  creator_id?: number;
  upvote_count?: number;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const CreatedProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [upvotes, setUpvotes] = useState<{ [key: number]: number }>({});
  const [hasUpvoted, setHasUpvoted] = useState<{ [key: number]: boolean }>({});
  const [commentsCount, setCommentsCount] = useState<{ [key: number]: number }>({});
  const [selectedProjectIdForComments, setSelectedProjectIdForComments] = useState<number | null>(null);

  // ------------------- Fetch Created Projects -------------------
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/projects/created`, {
          credentials: "include",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch projects. Response: ${text}`);
        }

        const data = await res.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching created projects:", error);
      }
    };

    fetchProjects();
  }, []);

  // ------------------- Fetch Comments Count -------------------
  useEffect(() => {
    const loadCommentsCount = async () => {
      const counts: { [key: number]: number } = {};
      for (const p of projects) {
        try {
          const res = await fetch(`${API_URL}/comments/project/${p.id}`);
          if (!res.ok) continue;
          const comments = await res.json();
          counts[p.id] = comments.length;
        } catch {
          counts[p.id] = 0;
        }
      }
      setCommentsCount(counts);
    };

    if (projects.length > 0) loadCommentsCount();
  }, [projects]);

  // ------------------- Upvote Handler -------------------
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

  // ------------------- Render -------------------
  return (
    <div className="projects-container created-projects-page">
      <DashNavbar />

      <div className="projects-grid">
        {projects.map(project => (
          <FolderProjectCard
            key={project.id}
            project={project}
            upvotes={upvotes[project.id] ?? project.upvote_count ?? 0}
            hasUpvoted={!!hasUpvoted[project.id]}
            commentCount={commentsCount[project.id] ?? 0}
            onUpvote={() => handleUpvote(project.id)}
            onOpenComments={() => setSelectedProjectIdForComments(project.id)}
            viewType="created"
          />
        ))}
      </div>

      {selectedProjectIdForComments !== null && (
        <ProjectCommentsModal
          projectId={selectedProjectIdForComments}
          projectTitle={
            projects.find(p => p.id === selectedProjectIdForComments)?.title || ""
          }
          projectDescription={
            projects.find(p => p.id === selectedProjectIdForComments)?.description || "No description available."
          }
          onClose={() => setSelectedProjectIdForComments(null)}
          onCommentsChange={(newCount: number) =>
            setCommentsCount(prev => ({
              ...prev,
              [selectedProjectIdForComments]: newCount,
            }))
          }
        />
      )}
    </div>
  );
};

export default CreatedProjects;
