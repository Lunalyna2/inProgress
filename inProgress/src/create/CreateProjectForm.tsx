// src/pages/CreateProjectForm.tsx
import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateProjectForm.css";
import { API_URL } from "../config/api";
import { Trash2, Plus } from "lucide-react";
import FolderBackground from "../layouts/FolderBackground";

interface Role {
  name: string;
  count: number;
}

const departments = [
  "Senior High School",
  "College of Arts & Sciences",
  "College of Business & Accountancy",
  "College of Computer Studies",
  "College of Education",
  "College of Engineering",
  "College of Hospitality Management",
  "College of Nursing",
  "College of Pharmacy",
  "College of Law",
  "College of Medicine",
];

const CreateProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [college, setCollege] = useState(""); // ← NEW
  const [roleInput, setRoleInput] = useState("");
  const [roleCount, setRoleCount] = useState(1);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  const handleAddRole = () => {
    const trimmed = roleInput.trim();
    if (!trimmed) return;
    setRoles(prev => [...prev, { name: trimmed, count: roleCount }]);
    setRoleInput("");
    setRoleCount(1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const token = localStorage.getItem("userToken");
    const projectData = {
      title: title.trim(),
      description: description.trim(),
      college: college || "Not specified", // ← NOW SENT!
      roles,
    };

    try {
      const res = await fetch("http://localhost:5000/api/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create project");

      setCreatedProjectId(result.projectId);
      setTitle("");
      setDescription("");
      setCollege("");
      setRoles([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FolderBackground>
      <div className="create-project-wrapper">
        <h1 className="page-title">Create New Project</h1>

        <form className="create-project-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Campus Event Management System"
              required
            />
          </div>

          <div className="field">
            <label>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe your project idea..."
              required
            />
          </div>

          {/* ← NEW: College Dropdown */}
          <div className="field">
            <label>College / Department</label>
            <select
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="college-select"
            >
              <option value="">Not specified</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Roles Needed</label>
            <div className="roles-row">
              <input
                type="text"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRole())}
                placeholder="e.g. UI/UX Designer"
              />
              <input
                type="number"
                min="1"
                value={roleCount}
                onChange={(e) => setRoleCount(Math.max(1, +e.target.value || 1))}
                style={{ width: "70px" }}
              />
              <button type="button" onClick={handleAddRole} className="add-btn">
                <Plus size={18} /> Add
              </button>
            </div>

            {roles.length > 0 && (
              <div className="roles-list">
                {roles.map((role, i) => (
                  <span key={i} className="role-tag">
                    {role.name} ×{role.count}
                    <button
                      type="button"
                      onClick={() => setRoles(roles.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? "Creating..." : "Create Project"}
          </button>

          {createdProjectId && (
            <div className="success-msg">
              Project created successfully!
              <button
                onClick={() => navigate(`/project-owner-folder/${createdProjectId}`)}
                className="view-btn"
              >
                Go to Project
              </button>
            </div>
          )}
        </form>
      </div>
    </FolderBackground>
  );
};

export default CreateProjectForm;