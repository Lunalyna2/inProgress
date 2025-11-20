import { useState } from "react";
import "./projectInterface.css";

export default function ProjectInterface() {
  // Entire project following a backend-ready structure:
  const [project, setProject] = useState({
    title: "",
    description: "",
    college: "",
    role: "",
    collaborators: [] as string[],
    status: "ongoing" as "ongoing" | "done",
    tasks: [] as { id: string; label: string; done: boolean }[],
  });

  // Handler for simple text fields
  const updateField = (field: string, value: any) => {
    setProject((prev) => ({ ...prev, [field]: value }));
  };

  // Add collaborator
  const addCollaborator = () => {
    const name = prompt("Collaborator name:");
    if (!name) return;
    updateField("collaborators", [...project.collaborators, name]);
  };

  // Task creation
  const addTask = () => {
    const label = prompt("Task name:");
    if (!label) return;

    updateField("tasks", [
      ...project.tasks,
      { id: crypto.randomUUID(), label, done: false },
    ]);
  };

  // Toggle task completion
  const toggleTask = (id: string) => {
    updateField(
      "tasks",
      project.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      )
    );
  };

  // Calculate progress percent
  const progress =
    project.tasks.length === 0
      ? 0
      : (project.tasks.filter((t) => t.done).length /
          project.tasks.length) *
        100;

  return (
    <div className="project-folder">

      {/* HEADER */}
      <div className="header-box">
        <input
          className="title-input"
          placeholder="Project Title"
          value={project.title}
          onChange={(e) => updateField("title", e.target.value)}
        />

        <textarea
          className="desc-input"
          placeholder="Description..."
          value={project.description}
          onChange={(e) => updateField("description", e.target.value)}
        />

        <div className="info-line">
          <label>College:</label>
          <input
            value={project.college}
            onChange={(e) => updateField("college", e.target.value)}
          />
        </div>

        <div className="info-line">
          <label>Role:</label>
          <input
            value={project.role}
            onChange={(e) => updateField("role", e.target.value)}
          />
        </div>

        <div className="collab-section">
          <label>Collaborators:</label>
          {project.collaborators.map((c, i) => (
            <div key={i}>{c}</div>
          ))}
          <button onClick={addCollaborator}>+ Add Collaborator</button>
        </div>

        <div className="status-section">
          <label>Status:</label>
          <div
            className={`status-indicator ${
              project.status === "done" ? "green" : "orange"
            }`}
          />
          <button onClick={() => updateField("status", "ongoing")}>
            Ongoing
          </button>
          <button onClick={() => updateField("status", "done")}>
            Done
          </button>
        </div>
      </div>

      {/* TASKS */}
      <div className="task-box">
        <button className="assign-btn" onClick={addTask}>
          Assign Task
        </button>

        <div className="task-list">
          {project.tasks.map((task) => (
            <div key={task.id} className="task-item">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
              />
              <span>{task.label}</span>
            </div>
          ))}
        </div>

        {/* PROGRESS BAR */}
        <div className="progress-bar">
          {project.tasks.map((t) => (
            <div
              key={t.id}
              className={`progress-dot ${t.done ? "done" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* REQUESTS */}
      <div className="request-box">
        <h3>Requests</h3>
        <div className="req-placeholder">No requests yet.</div>
      </div>
    </div>
  );
}
