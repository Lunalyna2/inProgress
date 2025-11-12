import React, { useState, useEffect } from "react";
import type { ChangeEvent, FC, ReactNode, CSSProperties } from "react";
import "./flipBookProfile.css";

// --- Interfaces ---
interface PaperProps {
  id: string;
  isFlipped: boolean;
  frontContent: ReactNode;
  backContent: ReactNode;
  zIndex: number;
}

interface ProfileInfo {
  name: string;
  description: string;
  course: string;
  contactNo: string;
  skill: string;
}

interface ProfilePic {
  id: string;
  image: string;
}

interface PageData {
  id: string;
  frontContent: ReactNode;
  backContent: ReactNode;
}

interface Message {
  text: string;
  type: "success" | "error" | "info";
}

// --- Paper Component ---
const Paper: FC<PaperProps> = ({ id, isFlipped, frontContent, backContent, zIndex }) => {
  const paperStyle: CSSProperties = { zIndex };

  // ✅ Apply background image for pages (from public/assets)
  const pageBgStyle: CSSProperties = {
    backgroundImage: `url("/assets/page-bg.png")`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  };

  return (
    <div className={`paper ${isFlipped ? "flipped" : ""}`} id={id} style={paperStyle}>
      <div className="front" style={pageBgStyle}>
        <div className="page-content">{frontContent}</div>
      </div>
      <div className="back" style={pageBgStyle}>
        <div className="page-content">{backContent}</div>
      </div>
    </div>
  );
};

// --- MessageBar ---
const MessageBar: FC<{ message: Message | null; onClose: () => void }> = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className={`message-bar ${message.type}`}>
      <span>{message.text}</span>
      <button onClick={onClose}>&times;</button>
    </div>
  );
};

// --- Main Component ---
const FlipBookProfile: FC = () => {
  const [page, setPage] = useState<number>(1);
  const total: number = 3;

  const [selectedPic, setSelectedPic] = useState<string | null>(null);
  const [savedPic, setSavedPic] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
    name: "Albert Einstein",
    description: "I love to help other people achieve their dreams.",
    course: "Engineering",
    contactNo: "091223456789",
    skill: "Problem Solving, Designer, Writer",
  });

  const [profilePics] = useState<ProfilePic[]>([
    { id: "avatar1", image: "/assets/characters/char1.png" },
    { id: "avatar2", image: "/assets/characters/char2.png" },
    { id: "avatar3", image: "/assets/characters/char3.png" },
    { id: "avatar4", image: "/assets/characters/char4.png" },
    { id: "avatar5", image: "/assets/characters/char5.png" },
  ]);

  useEffect(() => {
    setSavedPic(profilePics[0]?.image || null);
  }, [profilePics]);

  const closeMessage = () => setMessage(null);
  const next = () => page < total + 1 && setPage(page + 1);
  const prev = () => page > 1 && setPage(page - 1);

  const handlePicSelect = (image: string) => setSelectedPic(image);
  const handleSavePic = () => {
    if (!selectedPic) {
      setMessage({ text: "Please select an avatar first.", type: "info" });
      return;
    }
    setSavedPic(selectedPic);
    setMessage({ text: "Profile picture saved successfully!", type: "success" });
  };

  const handleProfileInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfileInfo = () => {
    setIsEditing(false);
    setMessage({ text: "Profile details saved successfully!", type: "success" });
  };

  const handleEditProfile = () => setIsEditing(true);

  // --- Pages ---
  const pages: PageData[] = [
    {
      id: "p1",
      frontContent: <h1 className="cover-text">My Profile Book</h1>,
      backContent: (
        <div className="page-content-wrapper">
          <div className="polaroid-frame">
            <div className="polaroid-placeholder">
              {selectedPic ? (
                <img src={selectedPic} alt="Selected Avatar" className="avatar-preview" />
              ) : (
                <span>No Selection</span>
              )}
            </div>
          </div>
          <button onClick={handleSavePic} className="save-btn">
            Save
          </button>
        </div>
      ),
    },
    {
      id: "p2",
      frontContent: (
        <div className="page-content-wrapper">
          <h2 className="selection-title">Choose your Avatar!</h2>
          <div className="profile-pic-grid">
            {profilePics.map((pic) => (
              <div
                key={pic.id}
                className={`profile-thumbnail ${selectedPic === pic.image ? "selected" : ""}`}
                onClick={() => handlePicSelect(pic.image)}
              >
                <img src={pic.image} alt={pic.id} className="avatar-thumb" />
              </div>
            ))}
          </div>
        </div>
      ),
      backContent: (
        <div className="page-content-wrapper page-3-left-wrapper">
          <div className={`polaroid-frame-large ${page === 3 ? "tilt" : ""}`}>
            <div className="polaroid-placeholder-large">
              <img
                src={savedPic || "/images/default.png"}
                alt="Saved Avatar"
                className="avatar-preview-large"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "p3",
      frontContent: (
        <div className="page-content-wrapper page-3-right-wrapper">
          <h2 className="selection-title-small">About Myself</h2>
          <form className="profile-form-right">
            {["name", "description", "course", "contactNo", "skill"].map((field) => (
              <div key={field}>
                <label>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
                <input
                  type="text"
                  name={field}
                  value={(profileInfo as any)[field]}
                  onChange={handleProfileInfoChange}
                  disabled={!isEditing}
                />
              </div>
            ))}
          </form>
          <div className="form-buttons">
            {!isEditing ? (
              <button onClick={handleEditProfile} className="save-info-btn">
                Edit
              </button>
            ) : (
              <button onClick={handleSaveProfileInfo} className="save-info-btn">
                Save
              </button>
            )}
          </div>
        </div>
      ),
      backContent: <h1 className="cover-text"></h1>,
    },
  ];

  // --- Background for the entire page ---
  const containerStyle: CSSProperties = {
    backgroundImage: `url("/assets/background.png")`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    minHeight: "100vh",
    width: "100%",
  };

  return (
    <div style={containerStyle}>
      <div className="book-container">
        <div className={`book ${page === 1 ? "book-closed" : ""}`}>
          {pages.map((p, i) => {
            const isFlipped = page > i + 1;
            const zIndex = isFlipped ? i + 1 : total - i + 1;
            return (
              <Paper
                key={p.id}
                id={p.id}
                isFlipped={isFlipped}
                frontContent={p.frontContent}
                backContent={p.backContent}
                zIndex={zIndex}
              />
            );
          })}
        </div>

        <div className="nav-buttons">
          <button onClick={prev} disabled={page === 1}>
            ← Previous Page
          </button>
          <button onClick={next} disabled={page === total + 1}>
            Next Page →
          </button>
        </div>

        <MessageBar message={message} onClose={closeMessage} />
      </div>
    </div>
  );
};

export default FlipBookProfile;
