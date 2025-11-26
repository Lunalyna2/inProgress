import React, { useState, useEffect } from "react";
import type { ChangeEvent, FC, ReactNode, CSSProperties } from "react";
import "./flipBookProfile.css";
import DashNavbar from "./DashboardNavbar"; 

interface PaperProps {
  id: string
  isFlipped: boolean
  frontContent: ReactNode
  backContent: ReactNode
  zIndex: number
}

interface ProfileInfo {
  name: string
  description: string
  course: string
  contactNo: string
  skill: string
}

interface ProfilePic {
  id: string
  image: string
}

interface PageData {
  id: string
  frontContent: ReactNode
  backContent: ReactNode
}

interface Message {
  text: string
  type: "success" | "error" | "info"
}

// --- COMPONENTS ---

const Paper: FC<PaperProps> = ({ id, isFlipped, frontContent, backContent, zIndex }) => {
  const paperStyle: CSSProperties = { zIndex }

  const pageBgStyle: CSSProperties = {
    backgroundImage: `url("/assets/page-bg.png")`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  }

  return (
    <div className={`paper ${isFlipped ? "flipped" : ""}`} id={id} style={paperStyle}>
      <div className="front" style={pageBgStyle}>
        <div className="page-content">{frontContent}</div>
      </div>
      <div className="back" style={pageBgStyle}>
        <div className="page-content">{backContent}</div>
      </div>
    </div>
  )
}

const MessageBar: FC<{ message: Message | null; onClose: () => void }> = ({ message, onClose }) => {
  if (!message) return null
  return (
    <div className={`message-bar ${message.type}`}>
      <span>{message.text}</span>
      <button onClick={onClose}>&times;</button>
    </div>
  );
};

const FlipBookProfile: FC = () => {
  const [page, setPage] = useState<number>(1);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const total: number = 3;

  const [selectedPic, setSelectedPic] = useState<string | null>(null);
  const [savedPic, setSavedPic] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  // NEW: edit mode state
  const [isEditing, setIsEditing] = useState(true);

  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
    name: "",
    description: "",
    course: "",
    contactNo: "",
    skill: "",
  })

  const [profilePics] = useState<ProfilePic[]>([
    { id: "avatar1", image: "/assets/characters/char1.png" },
    { id: "avatar2", image: "/assets/characters/char2.png" },
    { id: "avatar3", image: "/assets/characters/char3.png" },
    { id: "avatar4", image: "/assets/characters/char4.png" },
    { id: "avatar5", image: "/assets/characters/char5.png" },
  ])

  // Initialize name from signup (localStorage) and set initial avatar preview
  useEffect(() => {
    const savedName = localStorage.getItem("name") || "";
    setProfileInfo((prev) => ({ ...prev, name: savedName }));
    setSavedPic(profilePics[0]?.image || null);
  }, [profilePics]);

  const loadUserProfile = async () => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        setMessage({ text: "User ID not found.", type: "error" })
        return
      }

      const res = await fetch(`http://localhost:5000/profile/${userId}`)
      const data = await res.json()

      if (res.ok) {
        setProfileInfo({
          name: data.name || "",
          description: data.description || "",
          course: data.course || "",
          contactNo: data.contactNo || "",
          skill: data.skill || "",
        })
        setSavedPic(data.avatar || profilePics[0]?.image || null)
        setSelectedPic(data.avatar || profilePics[0]?.image || null)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      setMessage({ text: "Failed to load profile data.", type: "error" })
    }
  }

  const closeMessage = () => setMessage(null)
  const next = () => page < total + 1 && setPage(page + 1)
  const prev = () => page > 1 && setPage(page - 1)

  const handlePicSelect = (image: string) => setSelectedPic(image)
  const handleSavePic = () => {
    if (!selectedPic) {
      setMessage({ text: "Please select an avatar first.", type: "info" })
      return
    }
    setSavedPic(selectedPic)
    setMessage({ text: "Avatar selected!", type: "success" })
  }

  const handleProfileInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileInfo((prev) => ({ ...prev, [name]: value }))
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!savedPic) {
            setMessage({ text: "Please select an avatar before saving.", type: "error" });
            return; // Stop execution
        }

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setMessage({ text: "Missing user ID. Please sign up again.", type: "error" });
        return;
      }

      const res = await fetch(`http://localhost:5000/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatar: savedPic,
          description: profileInfo.description,
          course: profileInfo.course,
          contact_no: profileInfo.contactNo,
          skill: profileInfo.skill,
        }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
        setMessage({ text: data.message || "Failed to save profile", type: "error" });
        return;
        }

        setMessage({ text: "Profile saved successfully!", type: "success" });
        setIsEditing(false);
        setIsSaved(true);
    } catch (error) {
        console.error(error);
        setMessage({ text: "Network error saving profile", type: "error" });
    }
    };


  const pages: PageData[] = [
    {
      id: "p1",
      frontContent: <h1 className="cover-text">My Profile Book</h1>,
      backContent: (
        <div className="page-content-wrapper">
          <div className="polaroid-frame">
            <div className="polaroid-placeholder">
              {selectedPic ? (
                <img src={selectedPic || "/placeholder.svg"} alt="Selected Avatar" className="avatar-preview" />
              ) : (
                <span>No Selection</span>
              )}
            </div>
          </div>
          <button onClick={handleSavePic} className="save-btn">
            Save Avatar
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
                <img src={pic.image || "/placeholder.svg"} alt={pic.id} className="avatar-thumb" />
              </div>
            ))}
          </div>
        </div>
      ),
      backContent: (
        <div className="page-content-wrapper page-3-left-wrapper">
          <div className={`polaroid-frame-large ${page === 3 ? "tilt" : ""}`}>
            <div className="polaroid-placeholder-large">
              <img src={savedPic || "/assets/characters/char1.png"} alt="Saved Avatar" className="avatar-preview-large" />
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

          <form className="profile-form-right" onSubmit={saveProfile}>
            <div>
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={profileInfo.name}
                onChange={handleProfileInfoChange}
                disabled={!isEditing}
                onFocus={() => setIsEditing(true)}
                required
              />
            </div>

            <div>
              <label>Description:</label>
              <input
                type="text"
                name="description"
                value={profileInfo.description}
                onChange={handleProfileInfoChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div>
              <label>Course:</label>
              <input
                type="text"
                name="course"
                value={profileInfo.course}
                onChange={handleProfileInfoChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div>
              <label>Contact No:</label>
              <input
                type="text"
                name="contactNo"
                value={profileInfo.contactNo}
                onChange={handleProfileInfoChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div>
              <label>Skill:</label>
              <input
                type="text"
                name="skill"
                value={profileInfo.skill}
                onChange={handleProfileInfoChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-buttons">
              {!isEditing && isSaved ? (
                  <button 
                      onClick={() => (window.location.href = "/dashboard")} 
                      className="proceed-btn"
                  >
                      Proceed to Dashboard →
                  </button>
              ) : (
                  <button 
                      type="submit" 
                      className="save-info-btn"
                      disabled={!isEditing}
                  >
                      Save Profile
                  </button>
              )}
          </div>
          
          </form>
        </div>
      ),
      backContent: <h1 className="cover-text"></h1>,
    },
  ]

  const containerStyle: CSSProperties = {
    backgroundImage: `url("/assets/background.png")`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    minHeight: "100vh",
    width: "100%",
    paddingTop: "5rem",
    boxSizing: "border-box",
  }

  const handleProfileClick = () => console.log("Profile clicked (Navbar)")
  const handleHomeClick = () => console.log("Home clicked (Navbar)")

return (
  <div style={containerStyle}>
    <DashNavbar onProfileClick={handleProfileClick} onHomeClick={handleHomeClick} />

    <button
      className="close-btn"
      onClick={() => (window.location.href = "/dashboard")}
    >
      &times;
    </button>

      <DashNavbar onProfileClick={handleProfileClick} onHomeClick={handleHomeClick} />
      <div className="book-container">
        <div className={`book ${page === 1 ? "book-closed" : ""}`}>
          {pages.map((p, i) => {
            const isFlipped = page > i + 1
            const zIndex = isFlipped ? i + 1 : total - i + 1
            return (
              <Paper
                key={p.id}
                id={p.id}
                isFlipped={isFlipped}
                frontContent={p.frontContent}
                backContent={p.backContent}
                zIndex={zIndex}
              />
            )
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
  )
}

export default FlipBookProfile;
