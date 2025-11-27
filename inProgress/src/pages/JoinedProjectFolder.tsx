"use client"

import type React from "react"
import { useState, useMemo } from "react"
import "./JoinedProjectFolder.css"

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

// (All type definitions remain the same: Role, Collaborator, Task, etc.)

interface Role {
  id: number
  role: string
  count: number
  filled: number
}

interface Notification {
    id: number
    text: string
    time: string
    type: string
}

interface Collaborator {
  id: number
  name: string
  role: string
  avatar: string
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

interface Milestone {
  id: number
  name: string
  targetDate: string
  status: "pending" | "in-progress" | "completed"
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

// --- Component Definition ---

const JoinedProjectFolder: React.FC = () => {
  const currentUser: CurrentUser = {
    name: "Current User",
    avatar: "CU",
  }

  const [project] = useState<Project>({
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
      { id: 1, name: "John Farmer", role: "Project Manager", avatar: "JF" },
      { id: 2, name: "Sarah Green", role: "Frontend Developer", avatar: "SG" },
      { id: 3, name: "Mike Brown", role: "UI/UX Designer", avatar: "MB" },
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

  const [isCollaborator, setIsCollaborator] = useState<boolean>(false)
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [taskFilter, setTaskFilter] = useState<"all" | "my-tasks" | TaskStatus>("all")
  const [projectProgress, setProjectProgress] = useState<number>(0)

  const notifications: Notification[] = [
    { id: 1, text: "Sarah Green completed a task", time: "5 min ago", type: "task" },
    { id: 2, text: "New comment from John Farmer", time: "1 hour ago", type: "comment" },
    { id: 3, text: "Task deadline approaching", time: "2 hours ago", type: "alert" },
  ]

  const handleJoinProject = (): void => {
    setShowJoinModal(true)
  }

  const handleJoinConfirm = (): void => {
    if (selectedRole) {
      setIsCollaborator(true)
      setShowJoinModal(false)
      setSelectedRole("")
      console.log("Joined project with role:", selectedRole)
    }
  }

  const handleClaimTask = (taskId: number): void => {
    setTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, assignedTo: currentUser.name, status: "assigned" } : task)),
    )
    console.log("Claimed task:", taskId)
  }

  const handleUpdateTaskStatus = (taskId: number, newStatus: TaskStatus): void => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
    console.log("Updated task status:", taskId, newStatus)
  }

  const handleCompleteTask = (taskId: number): void => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: "completed" } : task)))
    console.log("Completed task:", taskId)
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

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
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

  const getStatusLabel = (status: TaskStatus): string => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
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

  return (
    <FolderBackground>
      <div className="joined-project-wrapper">
        {/* Header */}
        <div className="project-header-compact">
          <h1 className="project-title-main">{project.title}</h1>
          <p className="project-meta-info">
            Created by {project.createdBy} • {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="project-main-content">
          {/* Left Column */}
          <div className="content-column-left">
            {/* About Section */}
            <div className="content-card">
              <h2 className="card-title">About This Project</h2>
              <p className="project-description">{project.description}</p>
            </div>

            {!isCollaborator && (
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
            )}

            {/* Tasks Section */}
            {isCollaborator && (
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

                {/* Tasks List */}
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
                          <span
                            className="task-status-badge"
                            style={{
                              backgroundColor: getStatusColor(task.status) + "20",
                              color: getStatusColor(task.status),
                            }}
                          >
                            {getStatusLabel(task.status)}
                          </span>
                        </div>

                        <div className="task-meta">
                          <span>👤 {task.assignedTo || "Unassigned"}</span>
                          <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>

                        {/* Task Actions */}
                        <div className="task-actions">
                          {task.status === "unassigned" && (
                            <button className="btn-action btn-claim" onClick={() => handleClaimTask(task.id)}>
                              Claim
                            </button>
                          )}

                          {task.assignedTo === currentUser.name && task.status !== "completed" && (
                            <>
                              {task.status === "assigned" && (
                                <button
                                  className="btn-action btn-start"
                                  onClick={() => handleUpdateTaskStatus(task.id, "in-progress")}
                                >
                                  Start
                                </button>
                              )}
                              {task.status === "in-progress" && (
                                <button className="btn-action btn-complete" onClick={() => handleCompleteTask(task.id)}>
                                  Complete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No tasks found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="content-column-right">
            {!isCollaborator ? (
              <div className="content-card join-card">
                <h3 className="card-title">Join This Project</h3>
                <p className="join-description">Select a role and contribute to the team!</p>
                <button className="btn-join" onClick={handleJoinProject}>
                  Join Now
                </button>
              </div>
            ) : (
              <>
                {/* Stats Dashboard */}
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Join Project Modal */}
        {showJoinModal && (
          <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
            <div className="modal-content" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <h2 className="modal-title">Join Project</h2>
              <p className="modal-description">Select your role:</p>
              <div className="role-selection">
                {project.rolesNeeded
                  .filter((r) => r.filled < r.count)
                  .map((role) => (
                    <label key={role.id} className="role-option">
                      <input
                        type="radio"
                        name="role"
                        value={role.role}
                        checked={selectedRole === role.role}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedRole(e.target.value)}
                      />
                      <span>{role.role}</span>
                    </label>
                  ))}
              </div>
              <div className="modal-actions">
                <button className="btn-modal-cancel" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
                <button className="btn-modal-confirm" onClick={handleJoinConfirm} disabled={!selectedRole}>
                  Join
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FolderBackground>
  )
}

export default JoinedProjectFolder
