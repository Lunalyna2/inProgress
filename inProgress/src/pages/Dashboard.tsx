import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import DashNavbar from "./DashboardNavbar";
import ProjectCommentsModal from "./ProjectCommentsModal";
import FolderProjectCard from "./FolderProjectCard";
import { getComments } from "../api/comments";
import "./Dashboard.css";
import { getUpvotes, addUpvote, removeUpvote } from "../api/upvotes"; 

interface Project {
  id: number;
  title: string;
  description?: string;
  course: string;
}

interface JoinedProject {
  id: number;
  title: string;
  course: string;
  progress: number;
  description?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedProjectIdForComments, setSelectedProjectIdForComments] = useState<number | null>(null);
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

  const filters = ["All", "Recent", "Popular", "Trending"];

  const [pickedProjects, setPickedProjects] = useState<Project[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<JoinedProject[]>([]);

  const loadCommentCounts = async () => {
    const allProjects = [...pickedProjects, ...joinedProjects];
    const counts: { [key: number]: number } = {};
    await Promise.all(
      allProjects.map(async (project) => {
        try {
          const comments = await getComments(project.id);
          counts[project.id] = comments.length;
        } catch {
          counts[project.id] = 0;
        }
      })
    );
    setCommentCounts(counts);
  };

  const loadUpvotes = async () => {
    const allProjects = [...pickedProjects, ...joinedProjects];
    const counts: { [key: number]: number } = {};
    const statuses: { [key: number]: boolean } = {};

    await Promise.all(
      allProjects.map(async (project) => {
        try {
          const data = await getUpvotes(project.id);
          counts[project.id] = data.upvotes;
          statuses[project.id] = data.hasUpvoted;
        } catch {
          counts[project.id] = 0;
          statuses[project.id] = false;
        }
      })
    );

    setUpvotes(counts);
    setHasUpvoted(statuses);
  };

  useEffect(() => {
    loadCommentCounts();
    loadUpvotes();
  }, [pickedProjects, joinedProjects]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredPickedProjects = pickedProjects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedDepartment === "All Departments" || project.course === selectedDepartment)
  );

  const filteredJoinedProjects = joinedProjects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allProjectsForModal = [...pickedProjects, ...joinedProjects];
  const projectForModal = allProjectsForModal.find(p => p.id === selectedProjectIdForComments);
 
  const toggleUpvote = async (projectId: number) => {
    try {
      if (hasUpvoted[projectId]) {
        const data = await removeUpvote(projectId);
        setUpvotes(prev => ({ ...prev, [projectId]: data.upvotes }));
        setHasUpvoted(prev => ({ ...prev, [projectId]: false }));
      } else {
        const data = await addUpvote(projectId);
        setUpvotes(prev => ({ ...prev, [projectId]: data.upvotes }));
        setHasUpvoted(prev => ({ ...prev, [projectId]: true }));
      }
    } catch (err) {
      console.error("Upvote action failed:", err);
    }
  };

  return (
    <div className="dashboard">
      <DashNavbar onProfileClick={() => {}} onHomeClick={() => {}} />

      <div className="dashboard-content">
        <div className="dashboard-header-row">
          <div className="dashboard-actions" style={{ width: "100%", justifyContent: "space-between" }}>
            <div className="dashboard-search">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={handleSearch}
              />
              <Search className="search-icon" />
            </div>
            <button className="create-btn" onClick={() => navigate("/create-project")}>
              MAKE<br />PROJECT
            </button>
          </div>
        </div>
      </div>

      <main className="dashboard-main">
        <div className="dashboard-filters-top">
          <div className="dropdown">
            <button onClick={() => { setShowDepartmentDropdown(!showDepartmentDropdown); setShowFilterDropdown(false); }}>
              DEPARTMENT
            </button>
            {showDepartmentDropdown && (
              <div className="dropdown-menu">
                {departments.map(dept => (
                  <button key={dept} onClick={() => { setSelectedDepartment(dept); setShowDepartmentDropdown(false); }}>
                    {dept}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="dropdown">
            <button onClick={() => { setShowFilterDropdown(!showFilterDropdown); setShowDepartmentDropdown(false); }}>
              FILTER
            </button>
            {showFilterDropdown && (
              <div className="dropdown-menu">
                {filters.map(f => (
                  <button key={f} onClick={() => { setSelectedFilter(f); setShowFilterDropdown(false); }}>
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="picked-projects">
          <h2>Picked Out For You</h2>
          <div className="project-grid">
            {filteredPickedProjects.map(project => (
              <FolderProjectCard
                key={project.id}
                project={{ id: project.id, title: project.title }}
                viewType="dashboard"
                upvotes={upvotes[project.id] || 0}
                hasUpvoted={!!hasUpvoted[project.id]}
                commentCount={commentCounts[project.id] || 0}
                onUpvote={(id) => toggleUpvote(id)}
                onOpenComments={(id) => setSelectedProjectIdForComments(id)}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        </section>

        <section className="joined-projects">
          <h2>Joined Projects</h2>
          <div className="project-grid">
            {filteredJoinedProjects.map(project => (
              <FolderProjectCard
                key={project.id}
                project={{ id: project.id, title: project.title }}
                viewType="joined"
                upvotes={upvotes[project.id] || 0}
                hasUpvoted={!!hasUpvoted[project.id]}
                commentCount={commentCounts[project.id] || 0}
                onUpvote={(id) => toggleUpvote(id)}
                onOpenComments={(id) => setSelectedProjectIdForComments(id)}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        </section>
      </main>

      {selectedProjectIdForComments !== null && projectForModal && (
        <ProjectCommentsModal
          projectId={selectedProjectIdForComments}
          projectTitle={projectForModal.title}
          projectDescription={projectForModal.description || "No description available."}
          onClose={() => {
            setSelectedProjectIdForComments(null);
            loadCommentCounts();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
