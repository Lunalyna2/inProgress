import React from "react";
import { ArrowBigUp, MessageCircle } from "lucide-react";
import "./FolderProjectCard.css";

interface Project {
  id: number;
  title: string;
  description?: string; // ← make optional
}

interface Props {
  project: Project;
  upvotes: number;
  hasUpvoted: boolean;
  commentCount: number;
  onUpvote: (projectId: number) => void;
  onOpenComments: (projectId: number) => void;
}

const FolderProjectCard: React.FC<Props> = ({
  project,
  upvotes,
  hasUpvoted,
  commentCount,
  onUpvote,
  onOpenComments
}) => {
  return (
    <div className="folder-card">
      <div className="folder-tab"></div>
      <div className="folder-front"></div>

      <div className="folder-content">
        <h2>{project.title}</h2>
        <p>{project.description || "No description available."}</p>

        <div className="folder-actions">
          <div
            className="folder-upvote"
            onClick={() => onUpvote(project.id)}
          >
            <ArrowBigUp className={hasUpvoted ? "upvoted" : ""} />
            <span>{upvotes}</span>
          </div>

          <div
            className="folder-comments"
            onClick={() => onOpenComments(project.id)}
          >
            <MessageCircle />
            <span>{commentCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderProjectCard;
