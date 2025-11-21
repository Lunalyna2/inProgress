import React, { useState, type FormEvent, type ChangeEvent } from "react";
import "./CreateProjectForm.css";

// interfaces

interface ProjectData {
  title: string;
  description: string;
  roles: string[];
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
    <label htmlFor={id}></label>
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

// main form component
const CreateProjectForm: React.FC = () => {
  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [roles, setRoles] = useState<string[]>([]);

  // submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // reset form fields
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRoles([]);
    setRoleInput("");
  };

  // add a role to the list
  const handleAddRole = () => {
    const trimmed = roleInput.trim();
    if (!trimmed) return;
    setRoles((prev) => [...prev, trimmed]);
    setRoleInput("");
  };

  // handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const token = localStorage.getItem("userToken");

    setIsSubmitting(true);

    const projectData: ProjectData = { title, description, roles };

    try {
      const response = await fetch(
        "http://localhost:5000/api/projects/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(projectData),
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Project submission failed.");
      }

      const result = await response.json();
      alert(`Project created successfully! ID: ${result.projectId}`);
      resetForm();
    } catch (err) {
      console.error("Submission error:", err);
      setError(
        err instanceof Error ? err.message : "Unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="create-project-form" onSubmit={handleSubmit}>
      {/* Title*/}
      <InputField
        id="title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Description */}
      <InputField
        id="description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />

      {/* Roles */}
      <label htmlFor="roles">Roles Needed</label>
      <div className="roles-row">
        <input
          id="roles"
          type="text"
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          placeholder="e.g., Backend Developer"
        />
        <button type="button" className="add-btn" onClick={handleAddRole}>
          Add Collaborator
        </button>
      </div>

      {roles.length > 0 && (
        <div className="role-list">
          <h4>Added Roles:</h4>
          <ul>
            {roles.map((role, index) => (
              <li key={index}>{role}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="error-text">{error}</p>}

      {/* Submit */}
      <div className="submit-row">
        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Create Project"}
        </button>
      </div>
    </form>
  );
};

export default CreateProjectForm;
