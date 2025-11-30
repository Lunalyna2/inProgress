"use client"

import React, { useState, useMemo, useEffect } from "react"
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

interface Role {
  id: number
  role: string
  count: number
  filled: number
}

interface Collaborator {
  id: number
  name: string
  role: string
  avatar: string
}

type TaskStatus = "completed" | "in-progress" | "assigned" | "unassigned"

interface Task {
  id: number
  title: string
  status: TaskStatus
  assignedTo: string | null
}

interface Project {
  id: number
  title: string
  description: string
  createdBy: string
  createdAt: string
  rolesNeeded: Role[]
  collaborators: Collaborator[]
  isCollaborator: boolean
}

interface CurrentUser {
  id: number
  name: string
  avatar: string
}

//  Component 
const JoinedProjectFolder: React.FC<{ projectId: number; currentUser: CurrentUser }> = ({
  projectId,
  currentUser,
}) => {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [taskFilter, setTaskFilter] = useState<"all" | "my-tasks" | TaskStatus>("all")
  const [isCollaborator, setIsCollaborator] = useState<boolean>(false)

  //  API BASE 
  const API_BASE = "/api/collaborators"

  //  Fetch Project 
  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/joined-view`)
      const data = await res.json()
      setProject({ ...data.project, id: projectId, isCollaborator: data.isCollaborator })
      setTasks(data.tasks)
      setIsCollaborator(data.isCollaborator)
    } catch (err) {
      console.error("Failed to fetch project:", err)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [])

  //  Join Project 
  const applyJoin = async () => {
    if (!selectedRole) return
    try {
      await fetch(`${API_BASE}/${projectId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      })
      setIsCollaborator(true)
      setShowJoinModal(false)
      setSelectedRole("")
      fetchProject()
    } catch (err) {
      console.error("Join failed:", err)
    }
  }

  //  Cancel Application 
  const cancelJoin = async () => {
    try {
      await fetch(`${API_BASE}/${projectId}/cancel`, {
        method: "DELETE",
      })
      setIsCollaborator(false)
      fetchProject()
    } catch (err) {
      console.error("Cancel join failed:", err)
    }
  }

  // Claim Task 
  const claimTask = async (taskId: number) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}/claim`, { method: "POST" })
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, assignedTo: currentUser.name, status: "assigned" } : t))
      )
    } catch (err) {
      console.error("Claim failed:", err)
    }
  }

  //  Update Task Status 
  const updateTaskStatus = async (taskId: number, status: TaskStatus) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
    } catch (err) {
      console.error("Update status failed:", err)
    }
  }

  //  Filters 
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

  const myTasksCount = useMemo(
    () => tasks.filter((t) => t.assignedTo === currentUser.name).length,
    [tasks, currentUser.name]
  )

  const completedTasksCount = useMemo(
    () => tasks.filter((t) => t.status === "completed" && t.assignedTo === currentUser.name).length,
    [tasks, currentUser.name]
  )

  const [editableProgress, setEditableProgress] = useState<number>(
    myTasksCount > 0 ? Math.round((completedTasksCount / myTasksCount) * 100) : 0
  )

  if (!project) return <div>Loading...</div>

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

  const getStatusLabel = (status: TaskStatus): string =>
    status
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")

  return (
    <FolderBackground>
      <div className="joined-project-wrapper">
        <div className="project-header-compact">
          <h1 className="project-title-main">{project.title}</h1>
          <p className="project-meta-info">
            Created by {project.createdBy} • {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="project-main-content">
          {/* Left Column */}
          <div className="content-column-left">
            {/* About */}
            <div className="content-card">
              <h2 className="card-title">About This Project</h2>
              <p className="project-description">{project.description}</p>
            </div>

            {/* Roles Needed */}
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
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            {isCollaborator && (
              <div className="content-card">
                <h2 className="card-title">Tasks ({tasks.length})</h2>
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
                          <h3 className="task-title">{task.title}</h3>
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
                        </div>

                        <div className="task-actions">
                          {task.status === "unassigned" && (
                            <button className="btn-action btn-claim" onClick={() => claimTask(task.id)}>
                              Claim
                            </button>
                          )}

                          {task.assignedTo === currentUser.name && task.status !== "completed" && (
                            <>
                              {task.status === "assigned" && (
                                <button
                                  className="btn-action btn-start"
                                  onClick={() => updateTaskStatus(task.id, "in-progress")}
                                >
                                  Start
                                </button>
                              )}
                              {task.status === "in-progress" && (
                                <button
                                  className="btn-action btn-complete"
                                  onClick={() => updateTaskStatus(task.id, "completed")}
                                >
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

          <div className="content-column-right">
            {!isCollaborator ? (
              <div className="content-card join-card">
                <h3 className="card-title">Join This Project</h3>
                <p className="join-description">Select a role and contribute to the team!</p>
                <button className="btn-join" onClick={() => setShowJoinModal(true)}>
                  Join Now
                </button>
              </div>
            ) : (
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
                    <div>
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
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${editableProgress}%` }}></div>
                  </div>
                </div>

                <button className="btn-cancel-application" onClick={cancelJoin}>
                  Cancel My Application
                </button>
              </div>
            )}

            {/* Collaborators */}
            <div className="content-card">
              <h2 className="card-title">Team ({project.collaborators.length})</h2>
              <div className="collaborators-list">
                {project.collaborators.map((collab) => (
                  <div key={collab.id} className="collaborator-item">
                    <div className="collab-avatar">{collab.avatar}</div>
                    <div className="collab-info">
                      <p className="collab-name">{collab.name}</p>
                      <p className="collab-role">{collab.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Join Modal */}
        {showJoinModal && (
          <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                        onChange={(e) => setSelectedRole(e.target.value)}
                      />
                      <span>{role.role}</span>
                    </label>
                  ))}
              </div>
              <div className="modal-actions">
                <button className="btn-modal-cancel" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
                <button className="btn-modal-confirm" onClick={applyJoin} disabled={!selectedRole}>
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
