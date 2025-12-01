import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import DashNavbar from "./DashboardNavbar";
import ProjectCommentsModal from "./ProjectCommentsModal";
import FolderProjectCard from "./FolderProjectCard";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api";

interface Project {
  id: number;
  title: string;
  description?: string;
  course?: string;
  upvote_count?: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedProjectIdForComments, setSelectedProjectIdForComments] = useState<number | null>(null);
  const [pickedProjects, setPickedProjects] = useState<Project[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<Project[]>([]);
  const [upvotes, setUpvotes] = useState<{ [key: number]: number }>({});
  const [hasUpvoted, setHasUpvoted] = useState<{ [key: number]: boolean }>({});
  const [commentCounts, setCommentCounts] = useState<{ [key: number]: number }>({});

  const departments = [
    "All Departments",
    "Senior High School",
    "College of Arts & Sciences",
    "College of Business & Accountancy",
    "College of Computer Studies",
    "College of Education",
    "College of Engineering",
    "College of Hospitality Management",
    "College of Nursing",
    "College of Pharmacy",
    "College of Law",
    "College of Medicine",
  ];

  const fetchPickedProjects = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/projects/picked`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch picked projects");
      const data = await res.json();
      setPickedProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJoinedProjects = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/projects/joined`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch joined projects");
      const data = await res.json();
      setJoinedProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProjectMeta = async () => {
    const allProjects = [...pickedProjects, ...joinedProjects];
    const upvoteCounts: { [key: number]: number } = {};
    const upvoteStatus: { [key: number]: boolean } = {};
    const comments: { [key: number]: number } = {};

    await Promise.all(
      allProjects.map(async (project) => {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        try {
          const upvoteRes = await fetch(`${API_URL}/projects/${project.id}/upvotes`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          });
          if (upvoteRes.ok) {
            const upvoteData = await upvoteRes.json();
            upvoteCounts[project.id] = upvoteData.upvotes ?? 0;
            upvoteStatus[project.id] = upvoteData.hasUpvoted ?? false;
          }
          const commentRes = await fetch(`${API_URL}/projects/${project.id}/comments`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          });
          if (commentRes.ok) {
            const commentData = await commentRes.json();
            comments[project.id] = commentData.length;
          }
        } catch (err) {
          console.error(err);
        }
      })
    );

    setUpvotes(upvoteCounts);
    setHasUpvoted(upvoteStatus);
    setCommentCounts(comments);
  };

  const toggleUpvote = async (projectId: number) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      const method = hasUpvoted[projectId] ? "DELETE" : "POST";
      await fetch(`${API_URL}/projects/${projectId}/upvotes`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      await loadProjectMeta();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPickedProjects();
    fetchJoinedProjects();
  }, []);

  useEffect(() => {
    if (pickedProjects.length || joinedProjects.length) loadProjectMeta();
  }, [pickedProjects, joinedProjects]);

  const filteredPickedProjects = pickedProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedDepartment === "All Departments" || p.course === selectedDepartment)
  );

  const filteredJoinedProjects = joinedProjects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allProjectsForModal = [...pickedProjects, ...joinedProjects];
  const projectForModal = selectedProjectIdForComments
    ? allProjectsForModal.find((p) => p.id === selectedProjectIdForComments)
    : null;

  return (
    <div className="dashboard">
      <DashNavbar onProfileClick={() => {}} onHomeClick={() => navigate("/dashboard")} />
      <div className="dashboard-content">
        <div className="dashboard-header-row">
          <div className="dashboard-actions" style={{ width: "100%", justifyContent: "space-between" }}>
            <div className="dashboard-search">
              <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <Search className="search-icon" />
            </div>
            <button className="create-btn" onClick={() => navigate("/create-project")}>
              MAKE<br />PROJECT
            </button>
          </div>
        </div>
      </div>

      <main className="dashboard-main">
        <section className="picked-projects">
          <h2>Picked Out For You</h2>
          <div className="project-grid">
            {filteredPickedProjects.map((p) => (
              <FolderProjectCard
                key={p.id}
                project={p}
                viewType="dashboard"
                upvotes={upvotes[p.id] || 0}
                hasUpvoted={!!hasUpvoted[p.id]}
                commentCount={commentCounts[p.id] || 0}
                onUpvote={() => toggleUpvote(p.id)}
                onOpenComments={(id) => setSelectedProjectIdForComments(id)}
                onClick={() => navigate(`/joinedprojectsfolder/${p.id}`)}
              />
            ))}
          </div>
        </section>

        <section className="joined-projects">
          <h2>Joined Projects</h2>
          <div className="project-grid">
            {filteredJoinedProjects.map((p) => (
              <FolderProjectCard
                key={p.id}
                project={p}
                viewType="joined"
                upvotes={upvotes[p.id] || 0}
                hasUpvoted={!!hasUpvoted[p.id]}
                commentCount={commentCounts[p.id] || 0}
                onUpvote={() => toggleUpvote(p.id)}
                onOpenComments={(id) => setSelectedProjectIdForComments(id)}
                onClick={() => navigate(`/joinedprojectsfolder/${p.id}`)}
              />
            ))}
          </div>
        </section>
      </main>

      {projectForModal && selectedProjectIdForComments && (
        <ProjectCommentsModal
          projectId={selectedProjectIdForComments}
          projectTitle={projectForModal.title}
          projectDescription={projectForModal.description || "No description available."}
          onClose={() => setSelectedProjectIdForComments(null)}
          onCommentsChange={() => loadProjectMeta()}
        />
      )}
    </div>
  );
};

export default Dashboard;
