import React, { useReducer, useEffect, useRef, useState } from "react";
import { Trash2, Edit2, Send, X } from "lucide-react";
import "./ProjectCommentsModal.css";
import {
  getComments,
  postComment,
  editComment,
  deleteComment as apiDeleteComment,
} from "../api/comments";

interface LocalComment {
  id: number;
  project_id: number;
  user_id: number;
  username: string;
  avatar?: string | null;
  text: string;
  created_at: string;
  updated_at: string; 
}

interface ProjectCommentsModalProps {
  projectId: number;
  projectTitle: string;
  projectDescription: string;
  onClose: () => void;
  onCommentsChange?: (newCount: number) => void;
}

const formatTimestamp = (ts: string) => {
  const d = new Date(ts);
  return (
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " • " +
    d.toLocaleDateString([], { month: "short", day: "numeric" })
  );
};

interface State {
  comments: LocalComment[];
}

type Action =
  | { type: "set"; payload: LocalComment[] }
  | { type: "add"; payload: LocalComment }
  | { type: "update"; payload: LocalComment }
  | { type: "delete"; payload: number };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "set":
      return { ...state, comments: action.payload };
    case "add":
      return { ...state, comments: [...state.comments, action.payload] };
    case "update":
      return {
        ...state,
        comments: state.comments.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case "delete":
      return {
        ...state,
        comments: state.comments.filter((c) => c.id !== action.payload),
      };
    default:
      return state;
  }
};

const normalizeComment = (c: any): LocalComment => ({
  ...c,
  updated_at: c.updated_at ?? c.created_at,
});

const ProjectCommentsModal: React.FC<ProjectCommentsModalProps> = ({
  projectId,
  projectTitle,
  projectDescription,
  onClose,
  onCommentsChange,
}) => {
  const [state, dispatch] = useReducer(reducer, { comments: [] });
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const username = localStorage.getItem("username") || "";

  useEffect(() => {
    const load = async () => {
      const data = await getComments(projectId);
      dispatch({ type: "set", payload: data.map(normalizeComment) });
      onCommentsChange?.(data.length);
    };
    load();
  }, [projectId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.comments]);

  const sendComment = async () => {
    if (!commentText.trim()) return;

    const tempId = Date.now();
    const optimistic: LocalComment = {
      id: tempId,
      project_id: projectId,
      user_id: 0,
      username,
      avatar: localStorage.getItem("avatar") || null,
      text: commentText,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dispatch({ type: "add", payload: optimistic });
    setCommentText("");
    onCommentsChange?.(state.comments.length + 1);

    try {
      const newComment = await postComment(projectId, optimistic.text);
      dispatch({ type: "update", payload: normalizeComment(newComment) });
    } catch {
      dispatch({ type: "delete", payload: tempId });
      onCommentsChange?.(state.comments.length);
    }
  };

  const startEdit = (c: LocalComment) => {
    setEditingId(c.id);
    setEditingText(c.text);
  };

  const saveEdit = async (id: number) => {
    const updated = await editComment(id, editingText);
    dispatch({ type: "update", payload: normalizeComment(updated) });
    setEditingId(null);
  };

  const deleteComment = async (id: number) => {
    setDeletingId(id);

    setTimeout(async () => {
      await apiDeleteComment(id);
      dispatch({ type: "delete", payload: id });
      onCommentsChange?.(state.comments.length - 1);
      setDeletingId(null);
    }, 500);
  };

  const isOwner = (name: string) => name === username;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="modal-overlay">
      <div className={`project-comments-modal ${isClosing ? "closing" : ""}`}>
        <button className="close-button" onClick={handleClose}>
          <X size={20} />
        </button>

        <h2 className="modal-title">{projectTitle}</h2>
        <p className="modal-description">{projectDescription}</p>

        <div className="comments-container">
          {state.comments.map((c) => {
            const owner = isOwner(c.username);
            const editing = editingId === c.id;

            return (
              <div
                key={c.id}
                className={`comment-row ${owner ? "right" : "left"} ${
                  deletingId === c.id ? "deleting" : ""
                }`}
              >
                <img
                  src={
                    c.avatar || `https://i.pravatar.cc/150?u=${c.user_id.toString()}`
                  }
                  className="comment-avatar"
                />

                <div className={`bubble ${owner ? "me" : "them"}`}>
                  <div className="bubble-header">
                    <span className="username">{c.username}</span>
                  </div>

                  {!editing ? (
                    <>
                      <p className="bubble-text">{c.text}</p>
                      <span className="time">{formatTimestamp(c.created_at)}</span>
                    </>
                  ) : (
                    <div>
                      <textarea
                        className="edit-box"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                      />
                      <div className="edit-actions">
                        <button onClick={() => saveEdit(c.id)}>Save</button>
                        <button onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {owner && !editing && (
                  <div className="bubble-actions">
                    <button onClick={() => startEdit(c)}>
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => deleteComment(c.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div ref={commentsEndRef} />
        </div>

        <div className="input-area">
          <input
            className="chat-input"
            value={commentText}
            placeholder="Write a message..."
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendComment()}
          />
          <button className="send-btn" onClick={sendComment}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCommentsModal;
