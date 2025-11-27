"use client";

import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
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

interface Role {
  isEditing: any;
  id: number;
  role: string;
  count: number;
  filled: number;
}

interface Collaborator {
  showMenu: any;
  id: number;
  name: string;
  role: string;
  avatar: string;
  access: "can edit" | "view only";
}

type TaskStatus = "completed" | "in-progress" | "to-do";
type TaskPriority = "high" | "medium" | "low";

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  assignedTo: string | null;
  dueDate: string;
  priority: TaskPriority;
}

interface Project {
  status: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  rolesNeeded: Role[];
  collaborators: Collaborator[];
}

interface CurrentUser {
  name: string;
  avatar: string;
}

const ProjectOwnerFolder: React.FC = () => {
  const navigate = useNavigate();

  const currentUser: CurrentUser = {
    name: "Current User",
    avatar: "CU",
  };

  const [project, setProject] = useState<Project>({
    status: "ongoing",
    title: "Farm Management System",
    description:
      "A comprehensive farm management application to help farmers track crops, livestock, and resources. This project aims to digitize traditional farming practices and provide data-driven insights for better decision making.",
    createdBy: "John Farmer",
    createdAt: "2024-01-15",
    rolesNeeded: [],

    collaborators: [
      {
        id: 1,
        name: "John Farmer",
        role: "Project Manager",
        avatar: "JF",
        access: "can edit",
        showMenu: undefined,
      },
      {
        id: 2,
        name: "Sarah Green",
        role: "Frontend Developer",
        avatar: "SG",
        access: "can edit",
        showMenu: undefined,
      },
      {
        id: 3,
        name: "Mike Brown",
        role: "UI/UX Designer",
        avatar: "MB",
        access: "view only",
        showMenu: undefined,
      },
    ],
  });

  const [tasks, setTasks] = useState<Task[]>([]);

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

  const filteredTasks: Task[] = useMemo(() => {
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

  function updateField(arg0: string, arg1: string) {
    throw new Error("Function not implemented.");
  }

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

                  const newTask: Task = {
                    id: nextTaskId,
                    title: taskInput.value,
                    status: "to-do",
                    assignedTo: null,
                    dueDate: new Date().toISOString().split("T")[0] ?? "",
                    priority: "medium",
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
                  Team ({project.collaborators.length})
                </h2>
                <button
                  className="add-collaborator-btn"
                  onClick={() => console.log("Add collaborator clicked")}
                >
                  + Collaborator
                </button>
              </div>

              <div className="collaborators-list">
                {project.collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="collaborator-item">
                    <div className="collab-avatar">{collaborator.avatar}</div>
                    <div className="collab-info">
                      <p className="collab-name">{collaborator.name}</p>
                      <p className="collab-role">{collaborator.role}</p>
                      <p className="collab-access-label">
                        {collaborator.access}
                      </p>
                    </div>
                    <div className="collab-options-wrapper">
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
            </div>

            {/* Join Requests */}
            <div className="join-requests-section">
              <AcceptOrDecline projectId="123" />
            </div>
          </div>
        </div>
      </div>
    </FolderBackground>
  );
};

export default ProjectOwnerFolder;
