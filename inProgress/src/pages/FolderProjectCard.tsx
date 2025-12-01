import React from "react";
import { ArrowBigUp, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./FolderProjectCard.css";

interface Project {
  id: number;
  title: string;
  course?: string;
}

interface Props {
  project: Project;
  upvotes: number;
  hasUpvoted: boolean;
  commentCount: number;
  onUpvote: (id: number) => void;
  onOpenComments: (id: number) => void;
  viewType: "created" | "dashboard" | "joined";
  onClick?: () => void;
}

const FolderProjectCard: React.FC<Props> = ({
  project,
  upvotes,
  hasUpvoted,
  commentCount,
  onUpvote,
  onOpenComments,
  viewType,
  onClick,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    switch (viewType) {
      case "created":
        navigate(`/projectownerfolder/${project.id}`);
        break;
      case "dashboard":
        navigate(`/project/${project.id}`);
        break;
      case "joined":
        navigate(`/joinedprojectsfolder/${project.id}`);
        break;
      default:
        console.warn("Unknown viewType in FolderProjectCard");
        break;
    }
  };

  return (
    <div className="folder-card" onClick={handleCardClick}>
      <div className="folder-flap"></div>
      <div className="folder-box">
        <div className="folder-title">{project.title}</div>
        <div className="folder-actions-wrapper">
          <button
            className={`folder-upvote ${hasUpvoted ? "upvoted" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onUpvote(project.id);
            }}
          >
            <ArrowBigUp />
            <span>{upvotes}</span>
          </button>
          <button
            className="folder-comments"
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(project.id);
            }}
          >
            <MessageCircle />
            <span>{commentCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderProjectCard;
