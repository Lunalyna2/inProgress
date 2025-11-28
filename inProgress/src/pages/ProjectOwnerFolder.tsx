"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom"; // ← useNavigate added
import AcceptOrDecline from "../create/AcceptOrDecline";
import "./ProjectOwnerFolder.css";
import { Pencil, Trash2, Plus, X, Check, Calendar, User } from "lucide-react";
import Confetti from "react-confetti";

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

const ProjectOwnerFolder: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate(); // ← ADDED
  const token = localStorage.getItem("userToken");
  const currentUserId = localStorage.getItem("userId");

  const [project, setProject] = useState<Project | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    assignedTo: "",
    dueDate: "",
    priority: "medium" as "high" | "medium" | "low",
  });

  // Done Modal + Confetti
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!projectId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      setProject(data);
      setEditedTitle(data.title);
      setEditedDescription(data.description);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  }, [projectId, token]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const saveProject = async () => {
    if (!project || !token) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDescription,
          college: project.college,
          status: project.status,
          newRoles: [],
          removedRoleIds: [],
          collaboratorsToAdd: [],
          collaboratorsToRemove: [],
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage({ text: "Saved!", type: "success" });
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      fetchProject();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const addRole = async () => {
    const name = prompt("Role name (e.g. UI Designer):")?.trim();
    if (!name) return;
    const raw = prompt("How many needed?", "1");
    const count = Math.max(1, parseInt(raw || "1", 10) || 1);

    if (!token || !projectId) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: project?.title,
          description: project?.description,
          college: project?.college,
          status: project?.status,
          newRoles: [{ name, count }],
          removedRoleIds: [],
          collaboratorsToAdd: [],
          collaboratorsToRemove: [],
        }),
      });
      if (!res.ok) throw new Error("Failed to add role");
      fetchProject();
    } catch {
      setMessage({ text: "Failed to add role", type: "error" });
    }
  };

  const removeRole = async (roleId: number) => {
    if (!window.confirm("Remove this role?")) return;
    if (!token || !projectId) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: project?.title,
          description: project?.description,
          college: project?.college,
          status: project?.status,
          newRoles: [],
          removedRoleIds: [roleId],
          collaboratorsToAdd: [],
          collaboratorsToRemove: [],
        }),
      });
      if (!res.ok) throw new Error("Failed to remove role");
      fetchProject();
    } catch {
      setMessage({ text: "Failed to remove role", type: "error" });
    }
  };

  const toggleStatus = async (newStatus: "ongoing" | "done") => {
    if (!token || !projectId || project?.status === newStatus) return;

    if (newStatus === "done") {
      setShowDoneModal(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: project?.title,
          description: project?.description,
          college: project?.college,
          status: newStatus,
          newRoles: [],
          removedRoleIds: [],
          collaboratorsToAdd: [],
          collaboratorsToRemove: [],
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchProject();
    } catch {
      setMessage({ text: "Failed to update status", type: "error" });
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) {
      setMessage({ text: "Task title is required", type: "error" });
      return;
    }

    if (!token || !projectId) return;

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTask.title,
          assignedTo: newTask.assignedTo || null,
          dueDate: newTask.dueDate,
          priority: newTask.priority,
        }),
      });

      if (!res.ok) throw new Error("Failed to add task");
      setMessage({ text: "Task added!", type: "success" });
      setShowTaskModal(false);
      setNewTask({ title: "", assignedTo: "", dueDate: "", priority: "medium" });
      fetchProject();
    } catch {
      setMessage({ text: "Failed to add task", type: "error" });
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
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <FolderBackground>
      {/* Confetti */}
      {showConfetti && (
        <div className="confetti-container">
          <Confetti
            recycle={false}
            numberOfPieces={200}
            gravity={0.15}
            initialVelocityY={10}
            wind={0.02}
            opacity={0.9}
          />
        </div>
      )}

      <div className="joined-project-wrapper">
        {/* Header */}
        <div className="project-header-compact">
          <div className="title-container">
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="title-input"
                autoFocus
                onBlur={saveProject}
                onKeyDown={(e) => e.key === "Enter" && saveProject()}
              />
            ) : (
              <h1 className="project-title-main">{project.title}</h1>
            )}
            {!isEditingTitle && (
              <button
                className="icon-btn edit-title-btn"
                onClick={() => setIsEditingTitle(true)}
                title="Edit title"
              >
                <Pencil size={16} />
              </button>
            )}
          </div>
          <p className="project-meta-info">
            Created by <strong>{project.creator_username}</strong> • {formatDate(project.createdAt)}
          </p>
        </div>

        {/* Main Content */}
        <div className="project-main-content">
          {/* Left Column */}
          <div className="content-column-left">
            {/* About */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">About This Project</h2>
                {!isEditingDescription && (
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setEditedDescription(project.description);
                      setIsEditingDescription(true);
                    }}
                    title="Edit description"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
              {isEditingDescription ? (
                <div>
                  <textarea
                    className="description-input"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    rows={5}
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button className="btn-small" onClick={saveProject}>Save</button>
                    <button className="btn-small secondary" onClick={() => {
                      setEditedDescription(project.description);
                      setIsEditingDescription(false);
                    }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="project-description">{project.description}</p>
              )}
            </div>

            {/* Roles */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Roles Needed</h2>
                <button className="icon-btn" onClick={addRole} title="Add role">
                  <Plus size={18} />
                </button>
              </div>
              <div className="roles-grid">
                {project.roles.length === 0 ? (
                  <p className="no-data">No roles defined yet.</p>
                ) : (
                  project.roles.map((role) => (
                    <div key={role.id} className="role-tag">
                      <span className="role-name">{role.roleName}</span>
                      <span className="role-count">({role.filled}/{role.count})</span>
                      <button
                        className="icon-btn remove-role-btn"
                        onClick={() => removeRole(role.id)}
                        title="Remove role"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="content-card tasks-full">
              <div className="card-header">
                <h2 className="card-title">Tasks ({project.tasks?.length || 0})</h2>
                <button className="btn-add-task-soft" onClick={() => setShowTaskModal(true)}>
                  <Plus size={16} /> New Task
                </button>
              </div>
              <div className="tasks-scroll-container">
                {(!project.tasks || project.tasks.length === 0) ? (
                  <p className="no-data">No tasks yet. Click "New Task" to add one.</p>
                ) : (
                  <div className="tasks-list">
                    {project.tasks.map((task) => (
                      <div key={task.id} className="task-item">
                        <div className="task-header">
                          <h4>{task.title}</h4>
                          <span className={`priority-badge ${task.priority}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="task-meta">
                          <span><User size={14} /> {task.assignedTo || "Unassigned"}</span>
                          <span><Calendar size={14} /> {formatDate(task.dueDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="content-column-right">
            {/* Progress Stats */}
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

            {/* Status Toggle */}
            <div className="content-card">
              <h3 className="card-title">Project Status</h3>
              <div className="status-toggle-pill">
                <button
                  className={`toggle-btn ${project.status === "ongoing" ? "active" : ""}`}
                  onClick={() => toggleStatus("ongoing")}
                  disabled={project.status === "ongoing"}
                >
                  Ongoing
                </button>
                <button
                  className={`toggle-btn ${project.status === "done" ? "active" : ""}`}
                  onClick={() => toggleStatus("done")}
                  disabled={project.status === "done"}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Team */}
            <div className="content-card">
              <h2 className="card-title">Team ({project.collaborators.length})</h2>
              {project.collaborators.length === 0 ? (
                <p className="no-data">No collaborators yet.</p>
              ) : (
                <div className="collaborators-list">
                  {project.collaborators.map((c) => (
                    <div key={c.userId} className="collaborator-item">
                      <div className="collab-avatar">
                        {c.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="collab-info">
                        <p className="collab-name">{c.username}</p>
                        <p className="collab-role">{c.role || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Requests */}
            <div className="content-card">
              <h3 className="card-title">Pending Join Requests</h3>
              <AcceptOrDecline projectId={projectId!} />
            </div>

            {/* SAVE BUTTON WITH REDIRECT */}
            <button
              className="save-project-btn"
              onClick={async () => {
                await saveProject();
                navigate("/created-projects"); // ← REDIRECT TO MY PROJECTS
              }}
            >
              Save All Changes
            </button>

            {message && (
              <div className={`message-bar ${message.type}`}>
                <span>{message.text}</span>
                <button onClick={() => setMessage(null)} className="icon-btn">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD TASK MODAL */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Task</h3>
              <button className="icon-btn" onClick={() => setShowTaskModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <label>Task Title <span className="required">*</span></label>
              <input
                type="text"
                placeholder="e.g. Design login page"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />

              <label>Assign To</label>
              <select
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
              >
                <option value="">Unassigned</option>
                {project.collaborators.map((c) => (
                  <option key={c.userId} value={c.userId}>
                    {c.username} {c.role ? `(${c.role})` : ""}
                  </option>
                ))}
              </select>

              <label>Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />

              <label>Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-small secondary" onClick={() => setShowTaskModal(false)}>
                Cancel
              </button>
              <button className="btn-small" onClick={addTask}>
                <Check size={16} /> Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DONE MODAL */}
      {showDoneModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content done-modal">
            <div className="done-icon">
              <Check size={48} />
            </div>
            <h2>Congratulations!</h2>
            <p><strong>{project.title}</strong> is now marked as <strong>Done</strong>!</p>
            <p>Great work leading this project to completion</p>
            <button className="btn-small" onClick={() => setShowDoneModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </FolderBackground>
  );
};

export default ProjectOwnerFolder;