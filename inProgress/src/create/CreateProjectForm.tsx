import React, { useState, type FormEvent, type ChangeEvent } from "react";
import "./CreateProjectForm.css";

// component: form to create a project with title, description, and collaborator roles
const CreateProjectForm: React.FC = () => {
  // track user inputs and list of roles
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [roleInput, setRoleInput] = useState<string>("");
  const [roles, setRoles] = useState<string[]>([]);

  // function: add a new role to the list
  const handleAddRole = (): void => {
    if (roleInput.trim()) {
      setRoles([...roles, roleInput.trim()]);
      setRoleInput("");
    }
  };

  // function: handle form submission - log data, alert user, reset form
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    console.log("Project Data:", { title, description, roles });
    alert("Project form submitted.");
    setTitle("");
    setDescription("");
    setRoles([]);
  };

  return (
    <form className="create-project-form" onSubmit={handleSubmit}>
      <label htmlFor="title">Title</label>
      <input
        id="title"
        type="text"
        value={title}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setTitle(e.target.value)
        }
        required
      />

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        value={description}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          setDescription(e.target.value)
        }
        rows={4}
        required
      />

      <label htmlFor="roles">Roles Needed</label>
      <div className="roles-row">
        <input
          id="roles"
          type="text"
          value={roleInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setRoleInput(e.target.value)
          }
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

      <div className="submit-row">
        <button type="submit" className="submit-btn">
          Submit Project
        </button>
      </div>
    </form>
  );
};

export default CreateProjectForm;
