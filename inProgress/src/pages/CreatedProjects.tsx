// src/pages/CreatedProjects.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreatedProjects.css";
import DashNavbar from "./DashboardNavbar";
import { ArrowBigUp, MessageCircle, Plus, Users } from "lucide-react";
import ProjectCommentsModal from "./ProjectCommentsModal";
import { getComments } from "../api/comments";

interface Project {
  id: number;
  title: string;
  description: string;
  college: string;
  status: "ongoing" | "done";
  collaboratorCount?: number;
  upvotes?: number;
}

const CreatedProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [commentCounts, setCommentCounts] = useState<{ [key: number]: number }>({});
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem("userToken");

  const fetchProjects = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:5000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();

      const enhanced = data.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description || "No description provided.",
        college: p.college?.trim() || "", // ← will be empty string if missing
        status: p.status || "ongoing",
        collaboratorCount: p.collaborators?.filter((c: any) => c.status === "accepted").length || 0,
        upvotes: p.upvotes || 0,
      }));
      setProjects(enhanced);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommentCounts = async () => {
    const counts: { [key: number]: number } = {};
    for (const p of projects) {
      try {
        const comments = await getComments(p.id);
        counts[p.id] = comments.length;
      } catch {
        counts[p.id] = 0;
      }
    }
    setCommentCounts(counts);
  };

  useEffect(() => {
    fetchProjects();
    const handleFocus = () => fetchProjects();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    if (projects.length > 0) loadCommentCounts();
  }, [projects]);

  return (
    <>
      <DashNavbar onProfileClick={() => {}} onHomeClick={() => {}} />

      {/* ← Added top padding so title is not under navbar */}
      <div className="created-projects-page">
        <header className="page-header">
          <div>
            <h1 className="page-title">My Projects</h1>
            <p className="page-subtitle">Manage and grow your ideas</p>
          </div>
          <button
            className="create-project-btn"
            onClick={() => navigate("/create-project-form")}
          >
            <Plus size={20} />
            Create New Project
          </button>
        </header>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading your projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">No projects yet</div>
            <h3>No projects created yet</h3>
            <p>Start building something amazing today!</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => navigate(`/project-owner-folder/${project.id}`)}
              >
                <div className="card-header">
                  <h3 className="project-title">{project.title}</h3>
                  <span className={`status-badge ${project.status}`}>
                    {project.status === "ongoing" ? "Active" : "Completed"}
                  </span>
                </div>

                <p className="project-description">
                  {project.description.length > 120
                    ? `${project.description.substring(0, 120)}...`
                    : project.description}
                </p>

                <div className="project-meta">
                  {/* Only show college if it exists */}
                  {project.college && (
                    <div className="meta-item">
                      <span className="college-icon" />
                      <span>{project.college}</span>
                    </div>
                  )}
                  <div className="meta-item">
                    <Users size={16} />
                    <span>
                      {project.collaboratorCount} {project.collaboratorCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="interaction-item">
                    <ArrowBigUp size={18} className="icon" />
                    <span>{project.upvotes || 0}</span>
                  </div>
                  <div
                    className="interaction-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProjectId(project.id);
                    }}
                  >
                    <MessageCircle size={18} className="icon" />
                    <span>{commentCounts[project.id] || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProjectId && (
        <ProjectCommentsModal
          projectId={selectedProjectId}
          projectTitle={projects.find(p => p.id === selectedProjectId)?.title || ""}
          projectDescription={projects.find(p => p.id === selectedProjectId)?.description || ""}
          onClose={() => setSelectedProjectId(null)}
          onCommentsChange={(count) => {
            if (selectedProjectId) {
              setCommentCounts(prev => ({ ...prev, [selectedProjectId]: count }));
            }
            setSelectedProjectId(null);
          }}
        />
      )}
    </>
  );
};

export default CreatedProjects;