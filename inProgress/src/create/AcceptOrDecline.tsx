import React, { useEffect, useState } from "react";
import "./acceptOrDecline.css";

type Collaborator = {
  id: string;
  name: string;
  skills: string[];
  avatarUrl?: string;
  approved?: boolean;
  role?: string;
  decline?: boolean; // used for slide-out animation
};

const AcceptOrDecline: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending collaborators
  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const token = localStorage.getItem("userToken") || "";

        if (!token) {
          // Demo data if no token
          setCollaborators([
            { id: "1", name: "Alice", skills: ["UI Design", "Figma"] },
            { id: "2", name: "Bob", skills: ["Backend", "Node.js"] },
            { id: "3", name: "Charlie", skills: ["Frontend", "React"] },
          ]);
          return;
        }

        const res = await fetch(`http://localhost:5000/api/collaborators/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch collaborators");

        const data: Collaborator[] = await res.json();
        setCollaborators(data);
      } catch (err) {
        console.error("Error fetching collaborators:", err);
        setCollaborators([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborators();
  }, []);

  // Accept collaborator
  const handleAccept = async (id: string) => {
    try {
      const token = localStorage.getItem("userToken") || "";
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`http://localhost:5000/api/collaborators/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to accept collaborator");

      setCollaborators(prev =>
        prev.map(c =>
          c.id === id ? { ...c, approved: true, role: "collaborator" } : c
        )
      );
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  // Decline collaborator
  const handleDecline = async (id: string) => {
    try {
      const token = localStorage.getItem("userToken") || "";
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`http://localhost:5000/api/collaborators/${id}/decline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to decline collaborator");

      // Trigger animation
      setCollaborators(prev =>
        prev.map(c => (c.id === id ? { ...c, decline: true } : c))
      );

      // Remove after animation
      setTimeout(() => {
        setCollaborators(prev => prev.filter(c => c.id !== id));
      }, 350);
    } catch (err) {
      console.error("Decline error:", err);
    }
  };

  if (loading) {
    return <p className="loading-text">Loading pending collaborators… 💌</p>;
  }

  return (
    <div className="accept-or-decline">
      <h2>Pending Collaborators</h2>

      {collaborators.length === 0 ? (
        <div className="no-collaborators">
          <img
          src="/assets/empty.png"
          alt="No requests"
          className="no-collab-img"
          />
          <p>No pending requests right now 💖</p>
          <p>Invite peers or share your project!</p>
        </div>
      ) : (
        <ul>
          {collaborators.map(user => (
            <li
              key={user.id}
              className={`collaborator-card ${user.decline ? "slide-out" : ""}`}
            >
              <div className="collaborator-info">
                <img
                  src={
                    user.avatarUrl ||
                    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
                  }
                  alt={user.name}
                  className="avatar"
                />
                <strong>{user.name}</strong>
                <p>Skills: {user.skills.join(", ")}</p>
              </div>

              <div className="collaborator-actions">
                {user.approved ? (
                  <span className="approved-badge pop-in">✓ Collaborator</span>
                ) : (
                  <>
                    <button
                      onClick={() => handleAccept(user.id)}
                      className="btn-accept"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(user.id)}
                      className="btn-decline"
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AcceptOrDecline;