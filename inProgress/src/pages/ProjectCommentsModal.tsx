import React, { useState, useEffect, useRef } from "react";
import "./ProjectCommentsModal.css";
import { Trash2, Edit2, Send, X } from "lucide-react";

import { 
    getComments, 
    postComment, 
    deleteComment as apiDeleteComment
} from '../api/comments';

// --- LOCAL COMMENT TYPE ---
// Define the complete comment structure based on what your API returns
interface LocalComment {
    id: number;
    project_id: number;
    user_id: number;
    username: string;
    avatar?: string;
    text: string;
    created_at: string;
    updated_at?: string;
    isNew?: boolean; // Local flag for newly added comments
}

interface ProjectCommentsModalProps {
    projectId: number;
    projectTitle: string;
    projectDescription: string;
    onClose: () => void;
}

// Helper function to format timestamp
const formatTimestamp = (timestamp: string): string => {
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }) + ' ' +
               date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
    } catch {
        return "Time Unknown";
    }
};

// --- REACT COMPONENT ---
const ProjectCommentsModal: React.FC<ProjectCommentsModalProps> = ({
    projectId,
    projectTitle,
    projectDescription,
    onClose,
}) => {
    const [comments, setComments] = useState<LocalComment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState("");

    const commentsEndRef = useRef<HTMLDivElement>(null);

    const token = localStorage.getItem("userToken");
    const username = localStorage.getItem("username") || "Unknown";

    // --- LOAD COMMENTS ---
    useEffect(() => {
        const loadComments = async () => {
            try {
                const data = await getComments(projectId);
                setComments(data as LocalComment[]);
            } catch (err) {
                console.error("Error fetching comments:", err);
                setComments([]);
            }
        };
        loadComments();
    }, [projectId]);

    // Auto-scroll to bottom when comments change
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    // --- HANDLERS ---
    const handleSendComment = async () => {
        if (!commentText.trim() || !token) return;

        try {
            const newComment = await postComment(projectId, commentText);
            setComments(prev => [...prev, { ...newComment, isNew: true } as LocalComment]);
            setCommentText("");
        } catch (err) {
            console.error("Error sending comment:", err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendComment();
        }
    };

    const handleEditComment = async (id: number) => {
        if (!editingCommentText.trim() || !token) return;

        try {
            // Call your API to update the comment
            const response = await fetch(`/api/comments/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: editingCommentText })
            });

            if (!response.ok) throw new Error('Failed to update comment');

            const updated = await response.json();
            
            setComments(prev =>
                prev.map(c =>
                    c.id === id
                        ? { ...c, text: updated.text, updated_at: updated.updated_at }
                        : c
                )
            );
            setEditingCommentId(null);
            setEditingCommentText("");
        } catch (err) {
            console.error("Error editing comment:", err);
        }
    };

    const handleDeleteComment = async (id: number) => {
        if (!token) return;

        try {
            await apiDeleteComment(id);
            setComments(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error("Error deleting comment:", err);
        }
    };

    const isOwner = (commentUsername: string) => commentUsername === username;

    // --- RENDER ---
    return (
        <div className="modal-overlay">
            <div className="project-comments-modal">
                <button className="close-button" onClick={onClose}>
                    <X size={20} color="#fff" />
                </button>

                <h2 className="modal-title">{projectTitle}</h2>
                <p className="modal-project-description">{projectDescription}</p>

                <div className="comments-section-wrapper">
                    <div className="comments-list">
                        {comments.length === 0 ? (
                            <p className="empty-state">No comments yet. Be the first to start a conversation!</p>
                        ) : (
                            comments.map((comment) => (
                                <div 
                                    key={comment.id} 
                                    className="comment-item"
                                    style={{ justifyContent: isOwner(comment.username) ? 'flex-end' : 'flex-start' }}
                                >
                                    {/* Avatar */}
                                    <img 
                                        src={comment.avatar || "https://i.pravatar.cc/150?img=1"} 
                                        alt={`${comment.username} avatar`} 
                                        className="user-avatar" 
                                    />

                                    <div className="comment-content">
                                        <div className="comment-bubble" style={{ backgroundColor: isOwner(comment.username) ? '#f0f0f0' : undefined }}>
                                            <div className="comment-header">
                                                <span className="comment-username">{comment.username}</span>
                                                {comment.isNew && <span className="new-comment-tag">NEW</span>}
                                                <span>{formatTimestamp(comment.created_at)}</span>
                                            </div>

                                            {editingCommentId === comment.id ? (
                                                <div className="comment-edit-form">
                                                    <input
                                                        type="text"
                                                        value={editingCommentText}
                                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleEditComment(comment.id);
                                                            }
                                                        }}
                                                    />
                                                    <button 
                                                        className="save-edit-btn" 
                                                        onClick={() => handleEditComment(comment.id)}
                                                        disabled={!editingCommentText.trim()}
                                                    >
                                                        Save
                                                    </button>
                                                    <button 
                                                        className="cancel-edit-btn" 
                                                        onClick={() => setEditingCommentId(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <p>{comment.text}</p>
                                            )}
                                        </div>

                                        {isOwner(comment.username) && editingCommentId !== comment.id && (
                                            <div className="comment-actions">
                                                <button 
                                                    onClick={() => {
                                                        setEditingCommentId(comment.id);
                                                        setEditingCommentText(comment.text);
                                                    }}
                                                >
                                                    <Edit2 size={16} color="#444" />
                                                </button>
                                                <button onClick={() => handleDeleteComment(comment.id)}>
                                                    <Trash2 size={16} color="#ff4757" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={commentsEndRef} />
                    </div>
                </div>

                <div className="comment-input-area">
                    <input
                        type="text"
                        id="comment-input"
                        name="comment"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={handleKeyDown} 
                        placeholder="Write a comment…"
                        disabled={!token} 
                    />

                    <button 
                        className="send-button" 
                        onClick={handleSendComment}
                        disabled={!commentText.trim() || !token} 
                    >
                        <Send size={20} color="#fff" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectCommentsModal;