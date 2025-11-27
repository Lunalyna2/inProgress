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
  role: string | number | readonly string[] | undefined;
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

const COLLEGE_OPTIONS = [
  "",
  "Senior High School",
  "College of Agriculture, Resources and Environmental Sciences",
  "College of Arts & Sciences",
  "College of Business & Accountancy",
  "College of Computer Studies",
  "College of Education",
  "College of Engineering",
  "College of Hospitality Management",
  "College of Medical Laboratory Science",
  "College of Nursing",
  "College of Pharmacy",
  "College of Law",
  "College of Medicine",
  "College of Theology",
];

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

  const [projectRoles, setProjectRoles] = useState<ProjectRole[]>([]);
  const [message, setMessage] = useState<Message | null>(null);

  // Get the auth token and user ID once
  const token = localStorage.getItem("userToken");
  const userId = localStorage.getItem("userId");

  const updateField = (field: string, value: any) => {
    setProject((prev) => ({ ...prev, [field]: value }));
  };

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

      setProject({
        title: data.title || "",
        description: data.description || "",
        college: data.college || "",
        collaborators: data.collaborators || [],
        status: data.status || "ongoing",
        tasks: data.tasks || [],
        createdBy: data.createdBy || "",
        createdAt: data.createdAt || new Date().toISOString(),
        rolesNeeded: data.rolesNeeded || [],
      });
      setProjectRoles(data.roles || []);
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

  // --- ROLE HANDLERS ---

  const addRequiredRole = async () => {
    const role_name = prompt("Enter required role (e.g., UI/UX Designer):");
    if (!role_name || role_name.trim() === "") return;

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: project.title,
          description: project.description,
          college: project.college,
          status: project.status,
          newRoles: [role_name.trim()],
          removedRoleIds: [],
          collaboratorsToAdd: [],
          collaboratorsToRemove: [],
        }),
      });

      if (res.ok) {
        setMessage({
          text: "Role added successfully! (Please refresh if not immediately visible)",
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
      setMessage({ text: "Network error adding role.", type: "error" });
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
          title: project.title,
          description: project.description,
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

  // --- MAIN PROJECT SAVE HANDLER ---
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
          title: project.title,
          description: project.description,
          college: project.college,
          status: project.status,
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
    project.title,
    project.description,
    project.college,
    project.status,
  ]);

  // Add Task
  const addTask = async () => {
    const label = prompt("Task name:");
    if (!label) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ label: label.trim() }),
      });

      if (res.ok) {
        setMessage({ text: "Task added successfully!", type: "success" });
        fetchProjectData();
      } else {
        const errData = await res.json();
        setMessage({
          text: errData.message || "Failed to add task.",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({ text: "Network error adding task.", type: "error" });
    }
  };

  // Toggle Task Status
  const toggleTask = async (taskId: number, doneStatus: boolean) => {
    const updatedTasks = project.tasks.map((t) =>
      t.id === taskId ? { ...t, done: doneStatus } : t
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
        updateField("tasks", project.tasks);
        const errData = await res.json();
        setMessage({
          text: errData.message || "Failed to toggle task status.",
          type: "error",
        });
      }
    } catch (error) {
      updateField("tasks", project.tasks);
      setMessage({
        text: "Network error toggling task status.",
        type: "error",
      });
    }
  };

  // Add collaborator
  const addCollaborator = async () => {
    const username = prompt("Collaborator username or ID:");
    if (!username) return;

    // **In a real app:** You would first call a backend endpoint to look up the username/email // and get the corresponding `userId`. For now, we'll prompt for the ID.
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
          title: project.title,
          description: project.description,
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
          title: project.title,
          description: project.description,
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

  // Calculate progress percent
  const progress =
    project.tasks.length === 0
      ? 0
      : (project.tasks.filter((t) => t.done).length / project.tasks.length) *
        100;

  if (!projectId) {
    return <p>Loading project ID...</p>;
  }

  const [tasks, setTasks] = useState<ProjectTask[]>([]);

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [taskFilter, setTaskFilter] = useState<"all" | "my-tasks" | TaskStatus>(
    "all"
  );
  const [projectProgress, setProjectProgress] = useState<number>(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(project.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(project.description);
  const [nextTaskId, setNextTaskId] = useState(tasks.length + 1);

  const handleUpdateTaskStatus = (taskId: number, newStatus: TaskStatus) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const filteredTasks: ProjectTask[] = useMemo(() => {
    return tasks.filter((task) => {
      if (taskFilter === "all") return true;
      if (taskFilter === "my-tasks")
        return task.assignedTo === currentUser.name;
      if (taskFilter === "to-do") return task.status === "to-do";
      if (taskFilter === "in-progress") return task.status === "in-progress";
      if (taskFilter === "completed") return task.status === "completed";
      return true;
    });
  }, [tasks, taskFilter, currentUser.name]);

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

  const myTasksCount = useMemo(
    () => tasks.filter((t) => t.assignedTo === currentUser.name).length,
    [tasks, currentUser.name]
  );
  const completedTasksCount = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === "completed" && t.assignedTo === currentUser.name
      ).length,
    [tasks, currentUser.name]
  );

  const [editableProgress, setEditableProgress] = useState<number>(
    myTasksCount > 0
      ? Math.round((completedTasksCount / myTasksCount) * 100)
      : 0
  );

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
              if (isEditingTitle)
                setProject((prev) => ({ ...prev, title: editedTitle }));
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
                    if (isEditingDescription)
                      setProject((prev) => ({
                        ...prev,
                        description: descriptionValue,
                      }));
                    else setDescriptionValue(project.description);
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
                    {role.isEditing ? (
                      <input
                        type="text"
                        value={role.role}
                        autoFocus
                        onChange={(e) =>
                          setProject((prev) => ({
                            ...prev,
                            rolesNeeded: prev.rolesNeeded.map((r) =>
                              r.id === role.id
                                ? { ...r, role: e.target.value }
                                : r
                            ),
                          }))
                        }
                        onBlur={() =>
                          setProject((prev) => ({
                            ...prev,
                            rolesNeeded: prev.rolesNeeded.map((r) =>
                              r.id === role.id ? { ...r, isEditing: false } : r
                            ),
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                      />
                    ) : (
                      <>
                        <span>{role.role}</span>
                        <button
                          onClick={() =>
                            setProject((prev) => ({
                              ...prev,
                              rolesNeeded: prev.rolesNeeded.filter(
                                (r) => r.id !== role.id
                              ),
                            }))
                          }
                          className="remove-role-btn"
                        >
                          &times;
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const newRole = {
                    id: project.rolesNeeded.length + 1,
                    role: "",
                    role_name: "",
                    count: 1,
                    filled: 0,
                    isEditing: true,
                  };
                  setProject((prev) => ({
                    ...prev,
                    rolesNeeded: [...prev.rolesNeeded, newRole],
                  }));
                }}
                className="add-role-btn"
              >
                + Add Role
              </button>
            </div>

            {/* Add Task */}
            <div className="content-card">
              <h2 className="card-title">Add Task</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const taskInput = form.elements.namedItem(
                    "taskTitle"
                  ) as HTMLInputElement;
                  if (!taskInput.value) return;

                  const newTask: ProjectTask = {
                    id: nextTaskId,
                    title: taskInput.value,
                    status: "to-do",
                    assignedTo: null,
                    dueDate: new Date().toISOString().split("T")[0] ?? "",
                    priority: "medium",
                    done: false,
                    label: "",
                  };

                  setTasks((prev) => [...prev, newTask]);
                  setNextTaskId((prev) => prev + 1);
                  form.reset();
                }}
              >
                <input
                  type="text"
                  name="taskTitle"
                  placeholder="Task title"
                  className="task-input"
                />
                <button type="submit" className="add-task-btn">
                  Add Task
                </button>
              </form>
            </div>

            {/* Tasks */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Tasks ({tasks.length})</h2>
              </div>
              <div className="task-filters">
                <button
                  className={`filter-chip ${
                    taskFilter === "all" ? "active" : ""
                  }`}
                  onClick={() => setTaskFilter("all")}
                >
                  All ({tasks.length})
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
                              backgroundColor: getPriorityColor(task.priority),
                            }}
                          ></div>
                          <h3 className="task-title">{task.title}</h3>
                        </div>
                        <select
                          className="task-status-dropdown"
                          value={task.status}
                          onChange={(e) =>
                            handleUpdateTaskStatus(
                              task.id,
                              e.target.value as TaskStatus
                            )
                          }
                          style={{
                            backgroundColor: getStatusColor(task.status) + "20",
                            color: getStatusColor(task.status),
                          }}
                        >
                          <option value="to-do">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div className="task-meta">
                        <span>👤 {task.assignedTo || "to-do"}</span>
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

            {/* status togglr */}
            <div className="status-section">
              <label>Status:</label>
              <div
                className={`status-indicator ${
                  project.status === "done" ? "green" : "orange"
                }`}
                title={project.status.toUpperCase()}
              />

              <button
                onClick={async () => {
                  setProject((prev) => ({ ...prev, status: "ongoing" }));
                }}
                disabled={project.status === "ongoing"}
              >
                Ongoing
              </button>

              <button
                onClick={async () => {
                  setProject((prev) => ({ ...prev, status: "done" }));
                }}
                disabled={project.status === "done"}
              >
                Done
              </button>
            </div>

            {/* Collaborators */}
            <div className="content-card">
              <div className="card-title-row">
                <h2 className="card-title">
                  Team 
                </h2>
                <button
                  className="add-collaborator-btn"
                  onClick={() => console.log("Add collaborator clicked")}
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
                                setProject((prev) => ({
                                  ...prev,
                                  collaborators: prev.collaborators.filter(
                                    (c) => c.userId !== collaborator.userId
                                  ),
                                }))
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
