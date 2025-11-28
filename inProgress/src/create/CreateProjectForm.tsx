import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateProjectForm.css";
import { Trash2 } from "lucide-react";

interface Role {
  name: string;
  count: number;
}
interface ProjectData {
  title: string;
  description: string;
  roles: Role[];
}

const InputField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  rows?: number;
  required?: boolean;
}> = ({ id, label, value, onChange, type = "text", rows, required = true }) => (
  <>
    <label htmlFor={id}>{label}</label>
    {rows ? (
      <textarea id={id} value={value} onChange={onChange} rows={rows} required={required} />
    ) : (
      <input id={id} type={type} value={value} onChange={onChange} required={required} />
    )}
  </>
);

const CreateProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [roleCount, setRoleCount] = useState(1);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRoles([]);
    setRoleInput("");
    setRoleCount(1);
  };

  const handleAddRole = () => {
    const trimmed = roleInput.trim();
    if (!trimmed) return;
    setRoles(prev => [...prev, { name: trimmed, count: roleCount }]);
    setRoleInput("");
    setRoleCount(1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const token = localStorage.getItem("userToken");
    const projectData: ProjectData = { title, description, roles };

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
      if (!res.ok) throw new Error(result.error || "Failed");

      setCreatedProjectId(result.projectId);
      alert(`Project created! ID: ${result.projectId}`);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="create-project-form" onSubmit={handleSubmit}>
      <InputField id="title" label="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <InputField id="description" label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={4} />

      <label>Roles Needed</label>
      <div className="roles-row">
        <input
          type="text"
          value={roleInput}
          onChange={e => setRoleInput(e.target.value)}
          placeholder="Backend Developer"
          className="role-name-input"
        />
        <input
          type="number"
          min="1"
          value={roleCount}
          onChange={e => setRoleCount(Math.max(1, +e.target.value))}
          className="role-count-input"
        />
        <button type="button" onClick={handleAddRole} className="add-role-btn">
          Add Role
        </button>
      </div>

      {roles.length > 0 && (
        <div className="role-list">
          <ul>
            {roles.map((r, i) => (
              <li key={i} className="role-item">
                <span className="role-name">{r.name}</span>
                <span className="role-count">({r.count})</span>
                <button
                  type="button"
                  onClick={() => setRoles(p => p.filter((_, idx) => idx !== i))}
                  className="remove-role-btn"
                  title="Remove role"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="submit-row">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Project"}
        </button>
      </div>

      {createdProjectId && (
        <div className="success-banner">
          <p>Project created successfully!</p>
          <button
            className="view-project-btn"
            onClick={() => navigate(`/project-owner-folder/${createdProjectId}`)}
          >
            Go to Project
          </button>
        </div>
      )}
    </form>
  );
};

export default CreateProjectForm;