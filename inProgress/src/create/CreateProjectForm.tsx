import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateProjectForm.css";

const API_URL = "http://localhost:5000/api"

// interfaces
interface Role {
  name: string;
  count: number;
}

interface ProjectData {
  id?: number;
  title: string;
  description: string;
  roles: Role[];
}

interface InputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  rows?: number;
  required?: boolean;
}

// reusable input component
const InputField: React.FC<InputProps> = ({
  id,
  label,
  value,
  onChange,
  type = "text",
  rows,
  required = true,
}) => (
  <>
    <label htmlFor={id}>{label}</label>
    {rows ? (
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        rows={rows}
        required={required}
      />
    ) : (
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
      />
    )}
  </>
);

interface CreateProjectFormProps {
  onProjectCreated?: (project: ProjectData) => void;
}

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({
  onProjectCreated,
}) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [roleCountInput, setRoleCountInput] = useState(1);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRoles([]);
    setRoleInput("");
    setRoleCountInput(1);
  };

  const handleCountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setRoleCountInput(isNaN(value) || value < 1 ? 1 : value);
  };

  const handleAddRole = () => {
    const trimmed = roleInput.trim();
    if (!trimmed) return;
    setRoles((prev) => [...prev, { name: trimmed, count: roleCountInput }]);
    setRoleInput("");
    setRoleCountInput(1);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const token = localStorage.getItem("userToken");
    const projectData: ProjectData = { title, description, roles };

    try {
      const createProjectUrl = `${API_URL}/projects/create`;
      const response = await fetch(createProjectUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || errData.message || "Project submission failed"
        );
      }

      const result = await response.json();
      const projectId = result.projectId;

      // Update parent with the new project
      const newProject: ProjectData = { id: projectId, title, description, roles };
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }

      resetForm();

      // Redirect to ProjectOwnerFolder page
      navigate(`/project-owner-folder/${projectId}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="create-project-form" onSubmit={handleSubmit}>
      <InputField
        id="title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <InputField
        id="description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />

      <label htmlFor="roles">Roles Needed</label>
      <div className="roles-row">
        <input
          id="roles"
          type="text"
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          placeholder="e.g., Backend Developer"
        />
        <input
          type="number"
          min="1"
          value={roleCountInput}
          onChange={handleCountChange}
          aria-label="Number of roles needed"
          className="role-count-input"
        />
        <button type="button" onClick={handleAddRole}>
          Add Role
        </button>
      </div>

      {roles.length > 0 && (
        <div className="role-list">
          <h4>Added Roles:</h4>
          <ul>
            {roles.map((role, i) => (
              <li key={i}>
                {role.name} (Qty: {role.count})
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
    </form>
  );
};

export default CreateProjectForm;
