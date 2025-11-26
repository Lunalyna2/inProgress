// src/components/ProjectCommentsModal.tsx
import React, { useEffect, useState } from "react";
import { getComments, postComment, deleteComment } from "../api/comments";
import "./ProjectCommentsModal.css";

interface Comment {
  id: number;
  project_id: number;
  user_id: number | null;
  username: string;
  text: string;
  created_at: string;
}

interface ProjectCommentsModalProps {
  projectId: number;
  currentUserId: number;
  onClose: () => void;
}

const ProjectCommentsModal: React.FC<ProjectCommentsModalProps> = ({
  projectId,
  currentUserId,
  onClose,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load comments
  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getComments(projectId);
      setComments(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch comments");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [projectId]);

  // Add a comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const added = await postComment(projectId, newComment);
      setComments([...comments, added]);
      setNewComment("");
    } catch (err) {
      console.error(err);
      setError("Failed to add comment");
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error(err);
      setError("Failed to delete comment");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Comments</h2>
        <button className="close-btn" onClick={onClose}>
          X
        </button>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <div className="comments-list">
            {comments.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <strong>{comment.username}:</strong> {comment.text}
                  {comment.user_id === currentUserId && (
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <form className="comment-form" onSubmit={handleAddComment}>
          <input
            id="new-comment"
            name="newComment"
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
};

export default ProjectCommentsModal;
