"use client"

import type React from "react"
import { useState, useMemo } from "react"
import "./ProjectOwnerFolder.css"
import { useNavigate } from "react-router-dom";



const FolderBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="folder-background">
    <div className="folder-container">
      <div className="folder-tab" />
      <div className="folder-body">
        <div className="folder-content">{children}</div>
      </div>
    </div>
  </div>
)

interface Role {
  id: number
  role: string
  count: number
  filled: number
}

interface Notification {
  id: number;
  text: string;
  time: string;
  type: "join-request";
  requesterId?: number; 
  requesterName?: string;
  projectId?: number;
}


interface Collaborator {
  showMenu: any
  id: number
  name: string
  role: string
  avatar: string
  access: "can edit" | "view only"
}

type TaskStatus = "completed" | "in-progress" | "assigned" | "unassigned"
type TaskPriority = "high" | "medium" | "low"

interface Task {
  id: number
  title: string
  status: TaskStatus
  assignedTo: string | null
  dueDate: string
  priority: TaskPriority
}

interface Project {
  title: string
  description: string
  createdBy: string
  createdAt: string
  rolesNeeded: Role[]
  collaborators: Collaborator[]
}

interface CurrentUser {
  name: string
  avatar: string
}

const ProjectOwnerFolder: React.FC = () => {
  const navigate = useNavigate()

  const currentUser: CurrentUser = {
    name: "Current User",
    avatar: "CU",
  }
  const [project, setProject] = useState<Project>({
    title: "Farm Management System",
    description:
      "A comprehensive farm management application to help farmers track crops, livestock, and resources. This project aims to digitize traditional farming practices and provide data-driven insights for better decision making.",
    createdBy: "John Farmer",
    createdAt: "2024-01-15",
    rolesNeeded: [
      { id: 1, role: "Frontend Developer", count: 2, filled: 1 },
      { id: 2, role: "Backend Developer", count: 1, filled: 0 },
      { id: 3, role: "UI/UX Designer", count: 1, filled: 1 },
      { id: 4, role: "Project Manager", count: 1, filled: 1 },
    ],
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
  })

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Design login page",
      status: "completed",
      assignedTo: "Mike Brown",
      dueDate: "2024-02-01",
      priority: "high",
    },
    {
      id: 2,
      title: "Implement user authentication",
      status: "in-progress",
      assignedTo: "Current User",
      dueDate: "2024-02-15",
      priority: "high",
    },
    {
      id: 3,
      title: "Create database schema",
      status: "in-progress",
      assignedTo: "Sarah Green",
      dueDate: "2024-02-10",
      priority: "medium",
    },
    {
      id: 4,
      title: "Build crop tracking module",
      status: "unassigned",
      assignedTo: null,
      dueDate: "2024-02-20",
      priority: "medium",
    },
    {
      id: 5,
      title: "Implement notification system",
      status: "unassigned",
      assignedTo: null,
      dueDate: "2024-02-25",
      priority: "low",
    },
    {
      id: 6,
      title: "Write API documentation",
      status: "unassigned",
      assignedTo: null,
      dueDate: "2024-02-28",
      priority: "low",
    },
    {
      id: 7,
      title: "Setup CI/CD pipeline",
      status: "assigned",
      assignedTo: "John Farmer",
      dueDate: "2024-02-12",
      priority: "high",
    },
  ])

  const [selectedRole, setSelectedRole] = useState<string>("")
  const [taskFilter, setTaskFilter] = useState<"all" | "my-tasks" | TaskStatus>("all")
  const [projectProgress, setProjectProgress] = useState<number>(0)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(project.title)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState(project.description)

  const saveDescription = () => {
    console.log("Saving:", descriptionValue)
  }

  const notifications: Notification[] = [
    {
        id: 1,
        text: "Mike Brown wants to join your project",
        time: "Just now",
        type: "join-request",
        requesterId: 3,       
        requesterName: "Mike Brown",
        projectId: 123,       
    },
    {
        id: 2,
        text: "Sarah Green wants to join your project",
        time: "10 min ago",
        type: "join-request",
        requesterId: 4,
        requesterName: "Sarah Green",
        projectId: 123,
    },
    ]

  const handleUpdateTaskStatus = (taskId: number, newStatus: TaskStatus): void => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
  }

  const handleCompleteTask = (taskId: number): void => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: "completed" } : task)))
  }

  const handleProjectProgressChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newProgress = Math.min(100, Math.max(0, Number.parseInt(e.target.value) || 0))
    setProjectProgress(newProgress)
  }

  const filteredTasks: Task[] = useMemo(() => {
    return tasks.filter((task) => {
      if (taskFilter === "all") return true
      if (taskFilter === "my-tasks") return task.assignedTo === currentUser.name
      if (taskFilter === "unassigned") return task.status === "unassigned"
      if (taskFilter === "assigned")
        return task.status === "assigned" || (task.status === "in-progress" && task.assignedTo !== currentUser.name)
      if (taskFilter === "in-progress") return task.status === "in-progress"
      if (taskFilter === "completed") return task.status === "completed"
      return true
    })
  }, [tasks, taskFilter, currentUser.name])

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case "high":
        return "#ef4444"
      case "medium":
        return "#f59e0b"
      case "low":
        return "#10b981"
      default:
        return "#6b7280"
    }
  }

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case "completed":
        return "#10b981"
      case "in-progress":
        return "#f59e0b"
      case "assigned":
        return "#3b82f6"
      case "unassigned":
        return "#6b7280"
      default:
        return "#6b7280"
    }
  }

  const myTasksCount = useMemo(
    () => tasks.filter((t) => t.assignedTo === currentUser.name).length,
    [tasks, currentUser.name],
  )
  const completedTasksCount = useMemo(
    () => tasks.filter((t) => t.status === "completed" && t.assignedTo === currentUser.name).length,
    [tasks, currentUser.name],
  )

  const [editableProgress, setEditableProgress] = useState<number>(
    myTasksCount > 0 ? Math.round((completedTasksCount / myTasksCount) * 100) : 0,
  )

  const joinRequestCount = useMemo(
    () => notifications.filter((n) => n.type === "join-request").length,
    [notifications]
  )

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

          <button className="edit-btn" onClick={() => setIsEditingTitle(!isEditingTitle)}>
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
                    if (isEditingDescription) saveDescription()
                    setIsEditingDescription(!isEditingDescription)
                  }}
                >
                  {isEditingDescription ? "Save" : "Edit"}
                </button>
              </div>
            </div>

            {/* Roles Needed always visible for owner */}
            <div className="content-card">
              <h2 className="card-title">Roles Needed</h2>
              <div className="roles-list">
                {project.rolesNeeded.map((role) => (
                  <div key={role.id} className="role-item">
                    <div className="role-info">
                      <span className="role-name">{role.role}</span>
                      <span className="role-count">
                        {role.filled} / {role.count}
                      </span>
                    </div>
                    <div className="role-progress-bar">
                      <div
                        className="role-progress-fill"
                        style={{ width: `${(role.filled / role.count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Tasks ({tasks.length})</h2>
              </div>

              <div className="task-filters">
                <button
                  className={`filter-chip ${taskFilter === "all" ? "active" : ""}`}
                  onClick={() => setTaskFilter("all")}
                >
                  All ({tasks.length})
                </button>
                <button
                  className={`filter-chip ${taskFilter === "my-tasks" ? "active" : ""}`}
                  onClick={() => setTaskFilter("my-tasks")}
                >
                  My Tasks ({myTasksCount})
                </button>
                <button
                  className={`filter-chip ${taskFilter === "unassigned" ? "active" : ""}`}
                  onClick={() => setTaskFilter("unassigned")}
                >
                  Unassigned
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
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          ></div>
                          <h3 className="task-title">{task.title}</h3>
                        </div>

                        <select
                          className="task-status-dropdown"
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                          style={{
                            backgroundColor: getStatusColor(task.status) + "20",
                            color: getStatusColor(task.status),
                          }}
                        >
                          <option value="unassigned">Unassigned</option>
                          <option value="assigned">Assigned</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div className="task-meta">
                        <span>👤 {task.assignedTo || "Unassigned"}</span>
                        <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
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
                      setEditableProgress(Math.min(100, Math.max(0, Number.parseInt(e.target.value) || 0)))
                    }
                    className="progress-input"
                  />
                  %
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${editableProgress}%` }}></div>
                </div>
              </div>
            </div>

            {/* Collaborators */}
            <div className="content-card">
              <h2 className="card-title">Team ({project.collaborators.length})</h2>

              <div className="collaborators-list">
                {project.collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="collaborator-item">
                    <div className="collab-avatar">{collaborator.avatar}</div>

                    <div className="collab-info">
                      <p className="collab-name">{collaborator.name}</p>
                      <p className="collab-role">{collaborator.role}</p>
                      <p className="collab-access-label">{collaborator.access}</p>
                    </div>

                    <div className="collab-options-wrapper">
                      <button
                        className="collab-options-btn"
                        onClick={() => {
                          setProject((prev) => ({
                            ...prev,
                            collaborators: prev.collaborators.map((c) =>
                              c.id === collaborator.id
                                ? { ...c, showMenu: !c.showMenu }
                                : { ...c, showMenu: false },
                            ),
                          }))
                        }}
                      >
                        ⋮
                      </button>

                      {collaborator.showMenu && (
                        <div className="collab-options-menu">
                          <button
                            className="menu-item"
                            onClick={() => {
                              setProject((prev) => ({
                                ...prev,
                                collaborators: prev.collaborators.map((c) =>
                                  c.id === collaborator.id
                                    ? { ...c, access: "can edit", showMenu: false }
                                    : c,
                                ),
                              }))
                            }}
                          >
                            Can Edit
                          </button>

                          <button
                            className="menu-item"
                            onClick={() => {
                              setProject((prev) => ({
                                ...prev,
                                collaborators: prev.collaborators.map((c) =>
                                  c.id === collaborator.id
                                    ? { ...c, access: "view only", showMenu: false }
                                    : c,
                                ),
                              }))
                            }}
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

            {/* Notification Badge */}
            {joinRequestCount > 0 && (
            <div
                className="join-request-badge"
                onClick={() => navigate("/accept-decline")}
            >
                {joinRequestCount} Join Request{joinRequestCount > 1 ? "s" : ""}
            </div>
            )}
          </div>
        </div>
      </div>
    </FolderBackground>
  )
}

export default ProjectOwnerFolder
