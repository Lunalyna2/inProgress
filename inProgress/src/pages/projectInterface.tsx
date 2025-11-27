import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./projectInterface.css"; 
import FolderBackground from "../layouts/FolderBackground";
import AcceptOrDecline from "../create/AcceptOrDecline";
import "./projectInterface.css";
import { API_URL } from "@/config/api";

// --- INTERFACES ---

interface Collaborator {
    id: number; 
    userId: number;
    username: string;   
}

interface ProjectRole {
    id: number;
    role_name: string;
}

interface ProjectTask {
    id: number;
    label: string;
    done: boolean;
}

interface ProjectState {
    title: string;
    description: string;
    college: string;
    collaborators: Collaborator[];
    status: "ongoing" | "done";
    tasks: ProjectTask[];
}

interface Message {
    text: string;
    type: "success" | "error";
}

const COLLEGE_OPTIONS = [
    '',
    'Senior High School',
    'College of Agriculture, Resources and Environmental Sciences',
    'College of Arts & Sciences',
    'College of Business & Accountancy',
    'College of Computer Studies',
    'College of Education',
    'College of Engineering',
    'College of Hospitality Management',
    'College of Medical Laboratory Science',
    'College of Nursing',
    'College of Pharmacy',
    'College of Law',
    'College of Medicine',
    'College of Theology',
];

const API_BASE_URL = `http://${API_URL}/api`;

export default function ProjectInterface() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    
  const [project, setProject] = useState<ProjectState>({
    title: "",
    description: "",
    college: "",
    collaborators: [],
    status: "ongoing",
    tasks: [],
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
            setMessage({ text: "Missing Project ID or Authentication.", type: "error" });
            setTimeout(() => navigate("/dashboard"), 3000);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ text: data.message || `Failed to fetch project ${projectId}.`, type: "error" });
                return;
            }

            setProject({
                title: data.title || "",
                description: data.description || "",
                college: data.college || "",
                collaborators: data.collaborators || [], 
                status: data.status || "ongoing",
                tasks: data.tasks || [], 
            });
            setProjectRoles(data.roles || []);             
        } catch (error) {
            console.error("Fetch error:", error);
            setMessage({ text: "Network error fetching project data.", type: "error" });
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
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title: project.title, description: project.description, college: project.college, status: project.status,
                    newRoles: [role_name.trim()],
                    removedRoleIds: [],
                    collaboratorsToAdd: [],
                    collaboratorsToRemove: [],
                }),
            });

            if (res.ok) {
                setMessage({ text: "Role added successfully! (Please refresh if not immediately visible)", type: "success" });
                fetchProjectData(); 
            } else {
                const errData = await res.json();
                setMessage({ text: errData.message || "Failed to add role.", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Network error adding role.", type: "error" });
        }
    };

    const removeRequiredRole = async (roleId: number) => {
        if (!window.confirm("Are you sure you want to remove this role?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title: project.title, description: project.description, college: project.college, status: project.status,
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
                setMessage({ text: errData.message || "Failed to remove role.", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Network error removing role.", type: "error" });
        }
    };

    // --- MAIN PROJECT SAVE HANDLER ---
    const saveProject = useCallback(async () => {
        if (!projectId || !token) {
            setMessage({ text: "Cannot save: Missing Project ID or Authentication.", type: "error" });
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
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
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ text: data.message || "Failed to save project details.", type: "error" });
                return;
            }

            setMessage({ text: "Project details saved successfully!", type: "success" });

        } catch (error) {
            console.error("Save error:", error);
            setMessage({ text: "Network error saving project data.", type: "error" });
        }
    }, [projectId, token, project.title, project.description, project.college, project.status]);

  // Add Task 
  const addTask = async () => {
        const label = prompt("Task name:");
        if (!label) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/tasks/${projectId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ label: label.trim() }),
            });

            if (res.ok) {
                setMessage({ text: "Task added successfully!", type: "success" });
                fetchProjectData(); 
            } else {
                const errData = await res.json();
                setMessage({ text: errData.message || "Failed to add task.", type: "error" });
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
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ done: doneStatus }),
            });

            if (!res.ok) {
                updateField("tasks", project.tasks); 
                const errData = await res.json();
                setMessage({ text: errData.message || "Failed to toggle task status.", type: "error" });
            }
            
        } catch (error) {
            updateField("tasks", project.tasks); 
            setMessage({ text: "Network error toggling task status.", type: "error" });
        }
    };
  
  
  // Add collaborator
  const addCollaborator = async () => {
        const username = prompt("Collaborator username or ID:");
        if (!username) return;

        // **In a real app:** You would first call a backend endpoint to look up the username/email 
        // and get the corresponding `userId`. For now, we'll prompt for the ID.
        const userIdToAdd = parseInt(prompt(`Enter User ID for ${username}`) || '0');
        if (!userIdToAdd || isNaN(userIdToAdd)) {
             setMessage({ text: "Invalid User ID provided.", type: "error" });
             return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title: project.title, description: project.description, college: project.college, status: project.status,
                    newRoles: [],
                    removedRoleIds: [],
                    collaboratorsToAdd: [userIdToAdd],
                    collaboratorsToRemove: [],
                }),
            });

            if (res.ok) {
                setMessage({ text: `User ${userIdToAdd} added as collaborator!`, type: "success" });
                fetchProjectData(); 
            } else {
                const errData = await res.json();
                setMessage({ text: errData.message || "Failed to add collaborator.", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Network error adding collaborator.", type: "error" });
        }
    };
    
    // Remove Collaborator
    const removeCollaborator = async (userIdToRemove: number) => {
        if (!window.confirm("Are you sure you want to remove this collaborator?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title: project.title, description: project.description, college: project.college, status: project.status,
                    newRoles: [],
                    removedRoleIds: [],
                    collaboratorsToAdd: [],
                    collaboratorsToRemove: [userIdToRemove],
                }),
            });

            if (res.ok) {
                setMessage({ text: "Collaborator removed successfully!", type: "success" });
                fetchProjectData(); 
            } else {
                const errData = await res.json();
                setMessage({ text: errData.message || "Failed to remove collaborator.", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Network error removing collaborator.", type: "error" });
        }
    };

  // Calculate progress percent
  const progress =
    project.tasks.length === 0
      ? 0
      : (project.tasks.filter((t) => t.done).length /
          project.tasks.length) *
        100;

  if (!projectId) {
      return <p>Loading project ID...</p>;
  }

  return (
   <FolderBackground>
  <div className="folder-content-grid">

    {/* HEADER - Left Column */}
    <div className="header-box">
      <input
        className="title-input"
        placeholder="Project Title"
        value={project.title}
        onChange={(e) => updateField("title", e.target.value)}
      />

      {/* DESCRIPTION */}
      <textarea
        className="desc-input expanded"
        placeholder="Description..."
        value={project.description}
        onChange={(e) => updateField("description", e.target.value)}
      />

      <div className="info-line">
        <label>College:</label>
        <select
          value={project.college}
          onChange={(e) => updateField("college", e.target.value)}
        >
          {COLLEGE_OPTIONS.map((collegeName) => (
            <option key={collegeName || "none"} value={collegeName}>
              {collegeName || "Select College"}
            </option>
          ))}
        </select>
      </div>

      <div className="roles-section">
        <label>Roles Needed:</label>
        <div className="roles-list">
          {projectRoles.map((role) => (
            <div key={role.id} className="role-tag">
              <span>{role.role_name}</span>
              <button
                onClick={() => removeRequiredRole(role.id)}
                className="remove-role-btn"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <button onClick={addRequiredRole} className="add-role-btn">
          + Add Role
        </button>
      </div>

      {/* COLLABORATORS */}
      <div className="collab-section">
        <label>Collaborators:</label>
        <div className="collab-list">
          {project.collaborators.map((c, i) => (
            <span key={c.id || c.userId || i} className="collaborator-tag">
              {c.username}
              {/* REMOVE BUTTON */}
              {String(c.userId) !== userId && (
                <button
                  onClick={() => removeCollaborator(c.userId)}
                  className="remove-role-btn"
                >
                  &times;
                </button>
              )}
            </span>
          ))}
        </div>
        <button onClick={addCollaborator} className="add-collab-btn">
          + Add Collaborator
        </button>
      </div>

      {/* Status Toggle */}
      <div className="status-section">
        <label>Status:</label>
        <div
          className={`status-indicator ${
            project.status === "done" ? "green" : "orange"
          }`}
          title={project.status.toUpperCase()}
        />
        <button
          onClick={() => updateField("status", "ongoing")}
          disabled={project.status === "ongoing"}
        >
          Ongoing
        </button>
        <button
          onClick={() => updateField("status", "done")}
          disabled={project.status === "done"}
        >
          Done
        </button>
      </div>

      {/* SAVE BUTTON */}
      <button className="save-project-btn" onClick={saveProject}>
        Save Project Details
      </button>
    </div>

    {/* TASKS & REQUESTS - Right Column */}
    <div className="right-panel">

      {/* TASKS */}
      <div className="task-box">
        <h3 className="task-header">To-Do ({progress.toFixed(0)}%)</h3>
        <button className="assign-btn" onClick={addTask}>
          Assign Task
        </button>

        <div className="task-list scrollable">
          {project.tasks.map((task) => (
            <div key={task.id} className="task-item">
              <input
                type="checkbox"
                checked={task.done}
                onChange={(e) => toggleTask(task.id, e.target.checked)}
              />
              <span className={task.done ? "task-done" : ""}>{task.label}</span>
            </div>
          ))}
          {project.tasks.length === 0 && (
            <div className="req-placeholder">No tasks assigned yet.</div>
          )}
        </div>

        {/* PROGRESS BAR */}
        <div className="progress-bar-container">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          >
            {progress > 0 && `${progress.toFixed(0)}%`}
          </div>
        </div>
      </div>

      {/* REQUESTS → AcceptOrDecline */}
      <AcceptOrDecline projectId={projectId} />
    </div>

    {/* Message Bar for Success/Error */}
    {message && (
      <div className={`message-bar ${message.type}`}>
        <span>{message.text}</span>
        <button onClick={() => setMessage(null)}>&times;</button>
      </div>
    )}
  </div>
</FolderBackground>
);
}