"use client";

import type React from "react";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import "./ProjectOwnerFolder.css";
import { useParams, useNavigate } from "react-router-dom";
import AcceptOrDecline from "../create/AcceptOrDecline";

const FolderBackground: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="folder-background">
    <div className="folder-container">
      <div className="folder-tab" />
      <div className="folder-body">
        <div className="folder-content">{children}</div>
      </div>
    </div>
  </div>
);

interface ProjectRole {
  isEditing: any;
  id: number;
  role_name: string;
  count: number;
  filled: number;
}

interface Collaborator {
  name: ReactNode;
  showMenu: any;
  id: number;
  userId: number;
  username: string;
  role: string;
  avatar: string;
  access: "can edit" | "view only";
}

type TaskStatus = "completed" | "in-progress" | "to-do";
type TaskPriority = "high" | "medium" | "low";

interface ProjectTask {
  id: number;
  title: string;
  status: TaskStatus;
  assignedTo: string | null;
  dueDate: string;
  priority: TaskPriority;
  done: boolean;
  label: string;
}

interface ProjectState {
  title: string;
  description: string;
  college: string;
  collaborators: Collaborator[];
  status: "ongoing" | "done";
  tasks: ProjectTask[];
  createdBy: string;
  createdAt: string;
  rolesNeeded: ProjectRole[];
}

interface CurrentUser {
  name: string;
  avatar: string;
}

interface Message {
  text: string;
  type: "success" | "error";
}

const API_BASE_URL = "http://localhost:5000/api";

const ProjectOwnerFolder: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const currentUser: CurrentUser = {
    name: "Current User",
    avatar: "CU",
  };

  const [project, setProject] = useState<ProjectState>({
    status: "ongoing",
    title: "",
    description: "",
    createdAt: new Date().toISOString(),
    createdBy: "",
    college: "",
    rolesNeeded: [],
    tasks: [],
    collaborators: [],
  });

  const [message, setMessage] = useState<Message | null>(null);

  // Get the auth token and user ID once
  const token = localStorage.getItem("userToken");
  const userId = localStorage.getItem("userId");

  const updateField = (field: string, value: any) => {
    setProject((prev) => ({ ...prev, [field]: value }));
  };

  // Local UI States for Editing Project Details
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(project.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(project.description);

  // Local UI States for Adding Roles/Tasks
  const [taskInput, setTaskInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [roleCountInput, setRoleCountInput] = useState(1);

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [taskFilter, setTaskFilter] = useState<"all" | "my-tasks" | TaskStatus>(
    "all"
  );

  // Local state for editable progress (synced with task data)
  const [editableProgress, setEditableProgress] = useState<number>(0);

  // --- FETCH HANDLERS ---

  const fetchProjectData = useCallback(async () => {
    if (!projectId || !token || !userId) {
      setMessage({
        text: "Missing Project ID or Authentication.",
        type: "error",
      });
      setTimeout(() => navigate("/dashboard"), 3000);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.message || `Failed to fetch project ${projectId}.`,
          type: "error",
        });
        return;
      }

      // Map API roles to ProjectRole interface for display
      const fetchedRoles: ProjectRole[] = (data.roles || []).map((r: any) => ({
        id: r.id,
        role_name: r.role_name,
        count: r.count,
        filled: 0,
        isEditing: false,
      }));

      setProject({
        title: data.title || "",
        description: data.description || "",
        college: data.college || "",
        collaborators: data.collaborators || [],
        status: data.status || "ongoing",
        tasks: data.tasks || [],
        createdBy: data.createdBy || "",
        createdAt: data.createdAt || new Date().toISOString(),
        rolesNeeded: fetchedRoles,
      });
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage({
        text: "Network error fetching project data.",
        type: "error",
      });
    }
  }, [projectId, token, userId, navigate]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Sync local UI states with fetched data (safely, only if not currently editing)
  useEffect(() => {
    if (!isEditingTitle) setEditedTitle(project.title);
    if (!isEditingDescription) setDescriptionValue(project.description);
  }, [
    project.title,
    project.description,
    isEditingTitle,
    isEditingDescription,
  ]);

  // --- TASK & PROGRESS COMPUTATION ---

  const myTasksCount = useMemo(
    () => project.tasks.filter((t) => t.assignedTo === currentUser.name).length,
    [project.tasks, currentUser.name]
  );

  const completedTasksCount = useMemo(
    () =>
      project.tasks.filter(
        (t) => t.status === "completed" && t.assignedTo === currentUser.name
      ).length,
    [project.tasks, currentUser.name]
  );

  // Sync editableProgress with the project task data on load/fetch
  useEffect(() => {
    setEditableProgress(
      myTasksCount > 0
        ? Math.round((completedTasksCount / myTasksCount) * 100)
        : 0
    );
  }, [myTasksCount, completedTasksCount]);

  // --- ROLE HANDLERS ---

  const addRequiredRole = async () => {
    const role_name = roleInput.trim();
    const count = roleCountInput;

    // Client-side validation
    if (!role_name || role_name === "") {
      setMessage({ text: "Role name cannot be empty.", type: "error" });
      return;
    }
    if (count < 1 || isNaN(count)) {
      setMessage({ text: "Role count must be 1 or greater.", type: "error" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editedTitle,
          description: descriptionValue,
          college: project.college,
          status: project.status,
          newRoles: [{ name: role_name, count: count }],
          removedRoleIds: [],
          collaboratorsToAdd: [],
          collaboratorsToRemove: [],
        }),
      });
      if (res.ok) {
        setRoleInput("");
        setRoleCountInput(1);
        setMessage({
          text: "Role added successfully!",
          type: "success",
        });
        fetchProjectData();
      } else {
        const errData = await res.json();
        setMessage({
          text: errData.message || "Failed to add role.",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "Network error adding role. Please check server logs.",
        type: "error",
      });
    }
  };

  const removeRequiredRole = async (roleId: number) => {
    if (!window.confirm("Are you sure you want to remove this role?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editedTitle,
          description: descriptionValue,
          college: project.college,
          status: project.status,
          newRoles: [],
          removedRoleIds: [roleId],
          collaboratorsToAdd: [],
          collaboratorsToRemove: [],
        }),
      });
      if (res.ok) {
        setMessage({ text: "Role removed successfully!", type: "success" });
        fetchProjectData();
      } else {
        const errData = await res.json();
        setMessage({
          text: errData.message || "Failed to remove role.",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({ text: "Network error removing role.", type: "error" });
    }
  };

  // --- MAIN PROJECT SAVE HANDLER (Called by 'Save Project Details') ---
  const saveProject = useCallback(async () => {
    if (!projectId || !token) {
      setMessage({
        text: "Cannot save: Missing Project ID or Authentication.",
        type: "error",
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editedTitle,
          description: descriptionValue,
          college: project.college,
          status: project.status, // Current status is saved
          newRoles: [],
          removedRoleIds: [],
          collaboratorsToAdd: [],
          collaboratorsToRemove: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.message || "Failed to save project details.",
          type: "error",
        });
        return;
      }

      fetchProjectData();

      setMessage({
        text: "Project details saved successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Save error:", error);
      setMessage({ text: "Network error saving project data.", type: "error" });
    }
  }, [
    projectId,
    token,
    editedTitle,
    descriptionValue,
    project.college,
    project.status,
    fetchProjectData,
  ]);

  // --- PROJECT STATUS CHANGE HANDLER (FIXED: Added Rollback) ---
  const handleProjectStatusChange = async (newStatus: "ongoing" | "done") => {
    const originalStatus = project.status;

    // 1. Optimistic Update (For instant visual feedback)
    setProject((prev) => ({ ...prev, status: newStatus }));

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Sending all editable fields for a complete status change persistence
        body: JSON.stringify({
          title: editedTitle,
          description: descriptionValue,
          college: project.college,
          status: newStatus,
          newRoles: [],
          removedRoleIds: [],
          collaboratorsToAdd: [],
          collaboratorsToRemove: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 2. Rollback on API failure
        setProject((prev) => ({ ...prev, status: originalStatus }));
        setMessage({
          text:
            data.message ||
            `Failed to change status to ${newStatus}. Status reverted.`,
          type: "error",
        });
        return;
      }

      // 3. Success
      fetchProjectData();
      setMessage({
        text: `Project status changed to ${newStatus.toUpperCase()} successfully!`,
        type: "success",
      });
    } catch (error) {
      // 4. Rollback on Network failure
      setProject((prev) => ({ ...prev, status: originalStatus }));
      console.error("Status change network error:", error);
      setMessage({
        text: "Network error changing project status. Status reverted.",
        type: "error",
      });
    }
  };

  // --- TASK HANDLERS (FIXED: Changed 'label' to 'title' in API body) ---

  // Add Task
  const addTask = async () => {
    const title = taskInput.trim(); // Renamed local variable for clarity and API consistency

    // Client-side validation
    if (!title) {
      setMessage({ text: "Task title cannot be empty.", type: "error" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }), // Sending 'title' instead of 'label' for API consistency
      });
      if (res.ok) {
        setTaskInput(""); // Clear input on success
        setMessage({ text: "Task added successfully!", type: "success" });
        fetchProjectData(); // Re-fetch to update task list
      } else {
        const errData = await res.json();
        setMessage({
          text: errData.message || "Failed to add task.",
          type: "error",
        });
      }
    } catch (error) {
      // NOTE: If this error persists, it is definitely a server issue (CORS, server offline, malformed API endpoint).
      setMessage({
        text: "Network error adding task. Please check server logs for /tasks/:projectId.",
        type: "error",
      });
    }
  };

  // Toggle Task Status (Used for setting task.done status)
  const toggleTask = async (taskId: number, doneStatus: boolean) => {
    const originalTasks = project.tasks;

    // 1. Optimistic local update (Stops jarring re-render)
    const updatedTasks = project.tasks.map((t) =>
      t.id === taskId
        ? { ...t, done: doneStatus, status: doneStatus ? "completed" : "to-do" }
        : t
    );
    updateField("tasks", updatedTasks);

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/toggle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ done: doneStatus }),
      });

      if (!res.ok) {
        // Rollback optimistic update
        updateField("tasks", originalTasks);
        const errData = await res.json();
        setMessage({
          text: errData.message || "Failed to toggle task status.",
          type: "error",
        });
      }
    } catch (error) {
      // Rollback optimistic update
      updateField("tasks", originalTasks);
      setMessage({
        text: "Network error toggling task status.",
        type: "error",
      });
    }
  };

  // Unified handler for status change in the UI (calls API)
  const handleTaskStatusChange = async (
    taskId: number,
    newStatus: TaskStatus
  ) => {
    const isDone = newStatus === "completed";
    await toggleTask(taskId, isDone);
  };

  // --- COLLABORATOR HANDLERS (Omitted for brevity, unchanged) ---

  // Add collaborator
  const addCollaborator = async () => {
    const username = prompt("Collaborator username or ID:");
    if (!username) return;

    // For now, we'll prompt for the ID.
    const userIdToAdd = parseInt(
      prompt(`Enter User ID for ${username}`) || "0"
    );
    if (!userIdToAdd || isNaN(userIdToAdd)) {
      setMessage({ text: "Invalid User ID provided.", type: "error" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editedTitle,
          description: descriptionValue,
          college: project.college,
          status: project.status,
          newRoles: [],
          removedRoleIds: [],
          collaboratorsToAdd: [userIdToAdd],
          collaboratorsToRemove: [],
        }),
      });
      if (res.ok) {
        setMessage({
          text: `User ${userIdToAdd} added as collaborator!`,
          type: "success",
        });
        fetchProjectData();
      } else {
        const errData = await res.json();
        setMessage({
          text: errData.message || "Failed to add collaborator.",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({ text: "Network error adding collaborator.", type: "error" });
    }
  };

  // Remove Collaborator
  const removeCollaborator = async (userIdToRemove: number) => {
    if (!window.confirm("Are you sure you want to remove this collaborator?"))
      return;
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editedTitle,
          description: descriptionValue,
          college: project.college,
          status: project.status,
          newRoles: [],
          removedRoleIds: [],
          collaboratorsToAdd: [],
          collaboratorsToRemove: [userIdToRemove],
        }),
      });
      if (res.ok) {
        setMessage({
          text: "Collaborator removed successfully!",
          type: "success",
        });
        fetchProjectData();
      } else {
        const errData = await res.json();
        setMessage({
          text: errData.message || "Failed to remove collaborator.",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "Network error removing collaborator.",
        type: "error",
      });
    }
  };

  if (!projectId) {
    return <p>Loading project ID...</p>;
  }

  // Use project.tasks for filtering
  const filteredTasks: ProjectTask[] = useMemo(() => {
    return project.tasks.filter((task) => {
      if (taskFilter === "all") return true;
      if (taskFilter === "my-tasks")
        return task.assignedTo === currentUser.name;
      if (taskFilter === "to-do") return task.status === "to-do";
      if (taskFilter === "in-progress") return task.status === "in-progress";
      if (taskFilter === "completed") return task.status === "completed";
      return true;
    });
  }, [project.tasks, taskFilter, currentUser.name]);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "in-progress":
        return "#f59e0b";
      case "to-do":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  return (
    <FolderBackground>
      <div className="project-header-compact">
        <div className="title-edit-row">
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="title-input"
            />
          ) : (
            <h1 className="project-title-main">{project.title}</h1>
          )}

          <button
            className="edit-btn"
            onClick={() => {
              // Only update the main project state locally on save button click
              if (isEditingTitle) {
                setProject((prev) => ({ ...prev, title: editedTitle }));
                // Persistence is handled by the main 'Save Project Details' button
              }
              setIsEditingTitle(!isEditingTitle);
            }}
          >
            {isEditingTitle ? "Save" : "Edit"}
          </button>

          <p className="project-meta-info">
            Created • {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Main Content */}
        <div className="project-main-content">
          {/* Left Column */}
          <div className="content-column-left">
            {/* About */}
            <div className="content-card">
              <h2 className="card-title">About This Project</h2>
              <div className="description-edit-row">
                {isEditingDescription ? (
                  <textarea
                    className="description-input"
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                  />
                ) : (
                  <p className="project-description">{project.description}</p>
                )}
                <button
                  className="edit-btn"
                  onClick={() => {
                    if (isEditingDescription) {
                      setProject((prev) => ({
                        ...prev,
                        description: descriptionValue,
                      }));
                      // Persistence is handled by the main 'Save Project Details' button
                    }
                    setIsEditingDescription(!isEditingDescription);
                  }}
                >
                  {isEditingDescription ? "Save" : "Edit"}
                </button>
              </div>
            </div>

            {/* Roles Needed */}
            <div className="content-card">
              <h2 className="card-title">Roles Needed:</h2>

              <div className="roles-list">
                {project.rolesNeeded.map((role) => (
                  <div key={role.id} className="role-tag">
                    <span>
                      {role.role_name} (Qty: {role.count})
                    </span>
                    <button
                      onClick={() => removeRequiredRole(role.id)}
                      className="remove-role-btn"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Role Controls */}
              <div className="add-role-controls">
                <input
                  type="text"
                  placeholder="New Role Name"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="role-input-field"
                />
                <input
                  type="number"
                  min="1"
                  value={roleCountInput}
                  onChange={(e) =>
                    setRoleCountInput(parseInt(e.target.value) || 1)
                  }
                  className="role-count-input-field"
                />
                <button onClick={addRequiredRole} className="add-role-btn">
                  + Add Role
                </button>
              </div>
            </div>

            {/* Add Task */}
            <div className="content-card">
              <h2 className="card-title">Add Task</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addTask();
                }}
              >
                <input
                  type="text"
                  name="taskTitle"
                  placeholder="Task title"
                  className="task-input"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                />
                <button type="submit" className="add-task-btn">
                  Add Task
                </button>
              </form>
            </div>

            {/* Tasks */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Tasks ({project.tasks.length})</h2>
              </div>
              <div className="task-filters">
                <button
                  className={`filter-chip ${
                    taskFilter === "all" ? "active" : ""
                  }`}
                  onClick={() => setTaskFilter("all")}
                >
                  All ({project.tasks.length})
                </button>
                <button
                  className={`filter-chip ${
                    taskFilter === "my-tasks" ? "active" : ""
                  }`}
                  onClick={() => setTaskFilter("my-tasks")}
                >
                  My Tasks ({myTasksCount})
                </button>
                <button
                  className={`filter-chip ${
                    taskFilter === "to-do" ? "active" : ""
                  }`}
                  onClick={() => setTaskFilter("to-do")}
                >
                  To-do
                </button>
              </div>
              <div className="tasks-grid">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <div key={task.id} className="task-card">
                      <div className="task-header">
                        <div className="task-title-section">
                          <div
                            className="task-priority-dot"
                            style={{
                              backgroundColor: getPriorityColor(
                                task.priority as TaskPriority
                              ),
                            }}
                          ></div>
                          <h3 className="task-title">{task.title}</h3>
                        </div>
                        <select
                          className="task-status-dropdown"
                          value={task.status}
                          onChange={(e) =>
                            handleTaskStatusChange(
                              task.id,
                              e.target.value as TaskStatus
                            )
                          }
                          style={{
                            backgroundColor:
                              getStatusColor(task.status as TaskStatus) + "20",
                            color: getStatusColor(task.status as TaskStatus),
                          }}
                        >
                          <option value="to-do">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div className="task-meta">
                        <span>👤 {task.assignedTo || "Unassigned"}</span>
                        <span>
                          📅 {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No tasks found</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="content-column-right">
            {/* Stats */}
            <div className="content-card stats-card">
              <h3 className="card-title">Your Progress</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">{myTasksCount}</span>
                  <span className="stat-label">Tasks</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{completedTasksCount}</span>
                  <span className="stat-label">Done</span>
                </div>
              </div>
              <div className="progress-section">
                <div className="progress-header">
                  <span>Completion</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editableProgress}
                    onChange={(e) =>
                      setEditableProgress(
                        Math.min(
                          100,
                          Math.max(0, Number.parseInt(e.target.value) || 0)
                        )
                      )
                    }
                    className="progress-input"
                  />
                  %
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${editableProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <hr />

            {/* status toggler */}
            <div className="status-section">
              <label>Status:</label>
              <div
                className={`status-indicator ${
                  project.status === "done" ? "green" : "orange"
                }`}
                title={project.status.toUpperCase()}
              />

              <button
                style={{
                  backgroundColor:
                    project.status === "ongoing" ? "#3b82f6" : "#d1d5db",
                  color: project.status === "ongoing" ? "white" : "#1f2937",
                  cursor: project.status === "ongoing" ? "default" : "pointer",
                }}
                onClick={() => handleProjectStatusChange("ongoing")}
                disabled={project.status === "ongoing"}
              >
                Ongoing
              </button>

              <button
                style={{
                  backgroundColor:
                    project.status === "done" ? "#3b82f6" : "#d1d5db",
                  color: project.status === "done" ? "white" : "#1f2937",
                  cursor: project.status === "done" ? "default" : "pointer",
                }}
                onClick={() => handleProjectStatusChange("done")}
                disabled={project.status === "done"}
              >
                Done
              </button>
            </div>

            <hr />

            {/* Collaborators */}
            <div className="content-card">
              <div className="card-title-row">
                <h2 className="card-title">Team </h2>
                <button
                  className="add-collaborator-btn"
                  onClick={addCollaborator}
                >
                  + Collaborator
                </button>
              </div>

              {project.collaborators.filter((c) => c && c.userId).length ===
              0 ? (
                <p className="no-collab-text">
                  No collaborators yet. Invite collaborators now...
                </p>
              ) : (
                <div className="collaborators-list">
                  {project.collaborators
                    .filter((c) => c && c.userId)
                    .map((collaborator) => (
                      <div key={collaborator.id} className="collaborator-item">
                        <div className="collab-avatar">
                          {collaborator.avatar}
                        </div>

                        <div className="collab-info">
                          <p className="collab-name">{collaborator.username}</p>
                          <p className="collab-role">{collaborator.role}</p>
                          <p className="collab-access-label">
                            {collaborator.access}
                          </p>
                        </div>

                        <div className="collab-options-wrapper">
                          {String(collaborator.userId) !== userId && (
                            <button
                              className="remove-role-btn"
                              onClick={() =>
                                removeCollaborator(collaborator.userId)
                              }
                            >
                              &times;
                            </button>
                          )}

                          <button
                            className="collab-options-btn"
                            onClick={() =>
                              setProject((prev) => ({
                                ...prev,
                                collaborators: prev.collaborators.map((c) =>
                                  c.id === collaborator.id
                                    ? { ...c, showMenu: !c.showMenu }
                                    : { ...c, showMenu: false }
                                ),
                              }))
                            }
                          >
                            ⋮
                          </button>

                          {collaborator.showMenu && (
                            <div className="collab-options-menu">
                              <button
                                className="menu-item"
                                onClick={() =>
                                  setProject((prev) => ({
                                    ...prev,
                                    collaborators: prev.collaborators.map((c) =>
                                      c.id === collaborator.id
                                        ? {
                                            ...c,
                                            access: "can edit",
                                            showMenu: false,
                                          }
                                        : c
                                    ),
                                  }))
                                }
                              >
                                Can Edit
                              </button>

                              <button
                                className="menu-item"
                                onClick={() =>
                                  setProject((prev) => ({
                                    ...prev,
                                    collaborators: prev.collaborators.map((c) =>
                                      c.id === collaborator.id
                                        ? {
                                            ...c,
                                            access: "view only",
                                            showMenu: false,
                                          }
                                        : c
                                    ),
                                  }))
                                }
                              >
                                View Only
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Join Requests */}
            <div className="join-requests-section">
              <AcceptOrDecline projectId={projectId} />
            </div>

            {/* SAVE BUTTON */}
            <button className="save-project-btn" onClick={saveProject}>
              Save Project Details
            </button>

            {/* Message Bar for Success/Error */}
            {message && (
              <div className={`message-bar ${message.type}`}>
                <span>{message.text}</span>
                <button onClick={() => setMessage(null)}>&times;</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </FolderBackground>
  );
};

export default ProjectOwnerFolder;
