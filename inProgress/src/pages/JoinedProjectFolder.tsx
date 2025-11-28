// src/components/JoinedProjectFolder.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./JoinedProjectFolder.css";
import { Check, X, User, Calendar, Loader2 } from "lucide-react";

const API_BASE = "http://localhost:5000/api";

interface Role {
  id: number;
  roleName: string;
  count: number;
  filled: number;
}

interface Collaborator {
  userId: number;
  username: string;
  role?: string;
}

interface Task {
  id: number;
  title: string;
  status: "completed" | "in-progress" | "assigned" | "unassigned";
  assignedTo: string | null;
  dueDate: string;
  priority: "high" | "medium" | "low";
}

interface Project {
  id: number;
  title: string;
  description: string;
  creator_username: string;
  createdAt: string;
  college: string;
  status: "ongoing" | "done";
  roles: Role[];
  collaborators: Collaborator[];
  tasks?: Task[];
}

const FolderBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="folder-background">
    <div className="folder-container">
      <div className="folder-tab" />
      <div className="folder-body">
        <div className="folder-content">{children}</div>
      </div>
    </div>
  </div>
);

const JoinedProjectFolder: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("userToken");
  const currentUserId = localStorage.getItem("userId");

  const [project, setProject] = useState<Project | null>(null);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [taskFilter, setTaskFilter] = useState<"all" | "my-tasks" | "unassigned">("all");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load project");

      setProject(data);

      const userCollab = data.collaborators.find((c: Collaborator) => c.userId === Number(currentUserId));
      const isApproved = userCollab !== undefined;
      const isPending = !isApproved && data.collaborators.some((c: any) => c.userId === Number(currentUserId));

      setIsCollaborator(isApproved);
      setHasPendingRequest(isPending);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  }, [projectId, token, currentUserId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const joinProject = async () => {
    if (!selectedRole || !token || isRequesting) return;

    setIsRequesting(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleId: selectedRole }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send request");
      }

      setMessage({ text: "Join request sent! Waiting for approval.", type: "success" });
      setHasPendingRequest(true);
      setShowJoinModal(false);
      setSelectedRole(null);
      fetchProject(); // refresh to update filled count
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsRequesting(false);
    }
  };

  const myTasksCount = useMemo(() => {
    return project?.tasks?.filter(t => t.assignedTo === currentUserId).length || 0;
  }, [project?.tasks, currentUserId]);

  const completedTasksCount = useMemo(() => {
    return project?.tasks?.filter(t => t.assignedTo === currentUserId && t.status === "completed").length || 0;
  }, [project?.tasks, currentUserId]);

  if (!project) return <div className="loading">Loading project...</div>;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "#10b981",
      "in-progress": "#f59e0b",
      assigned: "#3b82f6",
      unassigned: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  return (
    <FolderBackground>
      <div className="joined-project-wrapper">
        <div className="project-header-compact">
          <h1 className="project-title-main">{project.title}</h1>
          <p className="project-meta-info">
            Created by <strong>{project.creator_username}</strong> • {formatDate(project.createdAt)}
          </p>
        </div>

        <div className="project-main-content">
          <div className="content-column-left">
            <div className="content-card">
              <h2 className="card-title">About This Project</h2>
              <p className="project-description">{project.description}</p>
            </div>

            {/* Show roles only if not collaborator */}
            {!isCollaborator && (
              <div className="content-card">
                <h2 className="card-title">Roles Available</h2>
                <div className="roles-list">
                  {project.roles
                    .filter(r => r.filled < r.count)
                    .map(role => (
                      <div key={role.id} className="role-item">
                        <span className="role-name">{role.roleName}</span>
                        <span className="role-count">({role.filled}/{role.count})</span>
                      </div>
                    ))}
                  {project.roles.filter(r => r.filled < r.count).length === 0 && (
                    <p className="no-data">No open roles at the moment.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tasks only for approved collaborators */}
            {isCollaborator && project.tasks && (
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">Tasks ({project.tasks.length})</h2>
                </div>
                <div className="task-filters">
                  <button className={`filter-chip ${taskFilter === "all" ? "active" : ""}`} onClick={() => setTaskFilter("all")}>All</button>
                  <button className={`filter-chip ${taskFilter === "my-tasks" ? "active" : ""}`} onClick={() => setTaskFilter("my-tasks")}>My Tasks</button>
                  <button className={`filter-chip ${taskFilter === "unassigned" ? "active" : ""}`} onClick={() => setTaskFilter("unassigned")}>Unassigned</button>
                </div>
                <div className="tasks-grid">
                  {project.tasks
                    .filter(t => {
                      if (taskFilter === "my-tasks") return t.assignedTo === currentUserId;
                      if (taskFilter === "unassigned") return !t.assignedTo;
                      return true;
                    })
                    .map(task => (
                      <div key={task.id} className="task-card">
                        <div className="task-header">
                          <h3 className="task-title">{task.title}</h3>
                          <span className="task-status-badge" style={{ backgroundColor: getStatusColor(task.status) + "20", color: getStatusColor(task.status) }}>
                            {task.status.replace("-", " ")}
                          </span>
                        </div>
                        <div className="task-meta">
                          <span><User size={14} /> {task.assignedTo || "Unassigned"}</span>
                          <span><Calendar size={14} /> {formatDate(task.dueDate)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="content-column-right">
            {/* Not collaborator → show join card */}
            {!isCollaborator ? (
              <div className="content-card join-card">
                <h3 className="card-title">Want to Join?</h3>
                <p>Select a role and send a request to the project owner.</p>

                {hasPendingRequest ? (
                  <button className="btn-join pending" disabled>
                    <Loader2 size={16} className="spin" /> Pending Request
                  </button>
                ) : (
                  <button className="btn-join" onClick={() => setShowJoinModal(true)} disabled={isRequesting}>
                    {isRequesting ? "Sending..." : "Join Project"}
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Approved collaborator → show stats + team */}
                <div className="content-card stats-card">
                  <h3 className="card-title">Your Progress</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-number">{myTasksCount}</span>
                      <span className="stat-label">Tasks Assigned</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{completedTasksCount}</span>
                      <span className="stat-label">Completed</span>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h2 className="card-title">Team ({project.collaborators.length})</h2>
                  <div className="collaborators-list">
                    {project.collaborators.map(c => (
                      <div key={c.userId} className="collaborator-item">
                        <div className="collab-avatar">{c.username.slice(0, 2).toUpperCase()}</div>
                        <div className="collab-info">
                          <p className="collab-name">{c.username}</p>
                          <p className="collab-role">{c.role || "—"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Join Modal */}
        {showJoinModal && (
          <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Join Project</h2>
              <p>Select a role to request:</p>
              <div className="role-selection">
                {project.roles
                  .filter(r => r.filled < r.count)
                  .map(role => (
                    <label key={role.id} className="role-option">
                      <input
                        type="radio"
                        name="role"
                        value={role.id}
                        checked={selectedRole === role.id}
                        onChange={() => setSelectedRole(role.id)}
                      />
                      <span>{role.roleName} ({role.filled}/{role.count} filled)</span>
                    </label>
                  ))}
              </div>
              <div className="modal-actions">
                <button className="btn-modal-cancel" onClick={() => setShowJoinModal(false)}>Cancel</button>
                <button
                  className="btn-modal-confirm"
                  onClick={joinProject}
                  disabled={!selectedRole || isRequesting}
                >
                  {isRequesting ? "Sending..." : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`message-bar ${message.type}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)}><X size={16} /></button>
          </div>
        )}
      </div>
    </FolderBackground>
  );
};

export default JoinedProjectFolder;