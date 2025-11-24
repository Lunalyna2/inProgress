import React, { useEffect, useState } from "react";
import "./acceptOrDecline.css";

type Collaborator = {
  id: string;
  name: string;
  skills: string[];
  avatarUrl?: string;
};

const AcceptOrDecline: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch collaborators from backend or use dummy data
  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const token = localStorage.getItem("userToken") || "";

        if (!token) {
          // No token, use dummy collaborators for demo
          setCollaborators([
            { id: "1", name: "Alice", skills: ["UI Design", "Figma"] },
            { id: "2", name: "Bob", skills: ["Backend", "Node.js"] },
            { id: "3", name: "Charlie", skills: ["Frontend", "React"] },
          ]);
          return;
        }

        const res = await fetch("http://localhost:5000/api/collaborators/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch collaborators");

        const data: Collaborator[] = await res.json().catch(() => []);
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

  // Handle accept/decline
  const handleAccept = async (id: string) => {
    try {
      const token = localStorage.getItem("userToken") || "";
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`http://localhost:5000/api/collaborators/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to accept collaborator");

      setCollaborators(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const token = localStorage.getItem("userToken") || "";
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`http://localhost:5000/api/collaborators/${id}/decline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to decline collaborator");

      setCollaborators(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Loading state
  if (loading) {
    return <p className="loading-text">Loading pending collaborators… 💌</p>;
  }

  return (
    <div className="accept-or-decline">
      <h2>Pending Collaborators</h2>

      {collaborators.length === 0 ? (
        <div className="no-collaborators">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
            alt="No requests"
            className="no-collab-img"
          />
          <p>Yay! No pending requests right now 💖</p>
          <p>Invite friends or share your project to get collaborators!</p>
        </div>
      ) : (
        <ul>
          {collaborators.map(user => (
            <li key={user.id} className="collaborator-card">
              <div className="collaborator-info">
                <img
                  src={
                    user.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}&background=FFC0CB&color=000`
                  }
                  alt={user.name}
                  className="avatar"
                />
                <strong>{user.name}</strong>
                <p>Skills: {user.skills.join(", ")}</p>
              </div>
              <div className="collaborator-actions">
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AcceptOrDecline;
