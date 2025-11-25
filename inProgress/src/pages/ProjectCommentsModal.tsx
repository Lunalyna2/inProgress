import React, { useState, useEffect, useRef } from 'react'; 
import './ProjectCommentsModal.css';

interface Comment {
  id: number;
  username: string;
  text: string;
  isNew?: boolean;
}

interface ProjectCommentsModalProps {
  projectId: number;
  projectTitle: string;
  // ✨ NEW PROP ADDED
  projectDescription: string; 
  onClose: () => void;
}

// Dummy data for initial comments
const initialComments: Comment[] = [
  { id: 3, username: 'Modern_Aesthete', text: 'Clean, sleek, and truly mobile-first. Excellent job!' },
  { id: 2, username: 'Interaction_Fan', text: 'The input field lifting up is a great interactive touch.' },
  { id: 1, username: 'Design_Lover', text: 'This version is so clean, I love the flat look!' },
];

const ProjectCommentsModal: React.FC<ProjectCommentsModalProps> = ({ 
  projectId, 
  projectTitle, 
  projectDescription, // ✨ Destructured
  onClose 
}) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(initialComments);
  const [isSending, setIsSending] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);


  const handleSendComment = () => {
    if (commentText.trim() && !isSending) {
      setIsSending(true);
      const newComment: Comment = {
        id: Date.now(), 
        username: 'New Creator ✨', 
        text: commentText.trim(),
        isNew: true,
      };

      setTimeout(() => {
        setComments(currentComments => [newComment, ...currentComments]);
        setCommentText('');
        setIsSending(false);

        setTimeout(() => {
          setComments(currentComments =>
            currentComments.map(c => (c.id === newComment.id ? { ...c, isNew: false } : c))
          );
        }, 3000);
      }, 300);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendComment();
    }
  };

  return (
    <div className="modal-overlay"> 
      <div className="project-comments-modal"> 
        
        <button className="close-button" onClick={onClose}>
          ✖
        </button>

        {/* --- Header/Title Section --- */}
        <header className="modal-header-section">
          <h2 className="modal-title">
            Project Discussion: {projectTitle}
          </h2>
          {/* ✨ NEW DESCRIPTION ELEMENT */}
          <p className="modal-project-description">{projectDescription}</p> 
          <p className="modal-project-id">Project ID: {projectId}</p>
        </header>

        {/* --- Comments Section Wrapper (Handles Scrolling) --- */}
        <div className="comments-section-wrapper">
          <h3 className="comments-label">Comments:</h3>
          
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className={`comment-item ${comment.isNew ? 'is-new-comment' : ''}`}>
                <div className="user-avatar" />
                <div className="comment-body">
                  <span className="comment-username">{comment.username}</span>
                  {comment.isNew && <span className="new-comment-tag">New!</span>}
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* --- Comment Input Box (Fixed to Bottom) --- */}
        <div className={`comment-input-area ${isInputFocused ? 'is-focused' : ''}`}>
          <input
            type="text"
            className="comment-input"
            placeholder="Share your thoughts..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)} 
            onBlur={() => setIsInputFocused(false)} 
          />
          <button
            className={`send-button ${isSending ? 'is-sending' : ''}`}
            onClick={handleSendComment}
            disabled={isSending || commentText.trim() === ''} 
          >
            {isSending ? (
              <svg className="spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCommentsModal;