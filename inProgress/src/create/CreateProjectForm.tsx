import React, { useState, type FormEvent, type ChangeEvent } from "react";
import "./CreateProjectForm.css";

// component: form to create a project with title, description, and collaborator roles
const CreateProjectForm: React.FC = () => {
  // track user inputs and list of roles
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [roleInput, setRoleInput] = useState<string>("");
  const [roles, setRoles] = useState<string[]>([]);

  // submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // function: add a new role to the list
  const handleAddRole = (): void => {
    if (roleInput.trim()) {
      setRoles([...roles, roleInput.trim()]);
      setRoleInput("");
    }
  };

  // function: handle form submission - sends data and token to backend
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    // Check for Authentication Token
    const token = localStorage.getItem('userToken'); 

    if (!token) {
        setError("You must be logged in to create a project. Please log in.");
        return; // Stop submission if no token is found
    }

    setIsSubmitting(true);
    
    const projectData = { title, description, roles };

    try {
      const response = await fetch('http://localhost:5000/api/projects/create', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(projectData)
      });

      if (response.status === 401 || response.status === 403) {
          // Handle cases where the token is invalid or expired
          throw new Error('Session expired or unauthorized. Please log in again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Project submission failed on the server.');
      }

      // Success!
      const result = await response.json();
      alert(`Project created successfully! ID: ${result.projectId}`);

      // Reset form on success
      setTitle("");
      setDescription("");
      setRoles([]);
    } catch (error) {
      console.error("Submission Error:", error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
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
      
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      <div className="submit-row">
        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Project'}
        </button>
      </div>
    </form>
  );
};

export default CreateProjectForm;