import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreatedProjects.css";
import DashNavbar from "./DashboardNavbar";
import { ArrowBigUp, MessageCircle } from "lucide-react";
import ProjectCommentsModal from "./ProjectCommentsModal";
import { getComments } from "../api/comments";

interface Project {
  id: number;
  title: string;
  description: string;
  college: string;
}

const CreatedProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [upvotes, setUpvotes] = useState<{ [key: number]: number }>({});
  const [hasUpvoted, setHasUpvoted] = useState<{ [key: number]: boolean }>({});
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [commentCounts, setCommentCounts] = useState<{ [key: number]: number }>({});

  const fetchProjects = async () => {
    const token = localStorage.getItem("userToken");
    try {
      const res = await fetch("http://localhost:5000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          college: p.college || "Unknown",
        })));
      }
    } catch (err) {
      console.error("Failed to load projects");
    }
  };

  const loadCommentCounts = async () => {
    const counts: { [key: number]: number } = {};
    for (const p of projects) {
      try {
        const c = await getComments(p.id);
        counts[p.id] = c.length;
      } catch {
        counts[p.id] = 0;
      }
    }
    setCommentCounts(counts);
  };

  useEffect(() => {
    fetchProjects();

    // Auto-refresh when page regains focus (e.g. after redirect)
    const handleFocus = () => fetchProjects();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    if (projects.length) loadCommentCounts();
  }, [projects]);

  return (
    <div className="projects-container">
      <DashNavbar onProfileClick={() => {}} onHomeClick={() => {}} />
      <h1 className="projects-title">My Projects</h1>

      <div className="projects-grid">
        {projects.length === 0 ? (
          <p className="no-data">
            No projects yet. <br />
            Click <strong>"MAKE PROJECT"</strong> to get started!
          </p>
        ) : (
          projects.map(project => (
            <div
              key={project.id}
              className="project-card clickable"
              onClick={() => navigate(`/project-owner-folder/${project.id}`)}
            >
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <small>{project.college}</small>

              <div className="action-icons">
                <div className="upvote-wrapper" onClick={e => e.stopPropagation()}>
                  <ArrowBigUp
                    className={hasUpvoted[project.id] ? "upvoted" : ""}
                    onClick={() => {
                      if (!hasUpvoted[project.id]) {
                        setUpvotes(prev => ({ ...prev, [project.id]: (prev[project.id] || 0) + 1 }));
                        setHasUpvoted(prev => ({ ...prev, [project.id]: true }));
                      }
                    }}
                  />
                  <span className="upvote-count">{upvotes[project.id] || 0}</span>
                </div>

                <MessageCircle
                  className="action-icon"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedProjectId(project.id);
                  }}
                />
                <span className="comment-count">{commentCounts[project.id] || 0}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedProjectId && (
        <ProjectCommentsModal
          projectId={selectedProjectId}
          projectTitle={projects.find(p => p.id === selectedProjectId)?.title || ""}
          projectDescription={projects.find(p => p.id === selectedProjectId)?.description || ""}
          onClose={() => setSelectedProjectId(null)}
          onCommentsChange={count => setCommentCounts(prev => ({ ...prev, [selectedProjectId]: count }))}
        />
      )}
    </div>
  );
};

export default CreatedProjects;