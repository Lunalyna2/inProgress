import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { Search, ArrowBigUp, MessageCircle } from "lucide-react";
import DashNavbar from "./DashboardNavbar";
import ProjectCommentsModal from "./ProjectCommentsModal";
import { getComments } from "../api/comments";

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
  const [commentCounts, setCommentCounts] = useState<{ [key: number]: number }>({}); // ✅ store comment counts

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

  const [pickedProjects] = useState<Project[]>([
    { id: 1, title: "Build a Social Media App", course: "Mobile Development", description: "An app that allows users to connect and share content." },
    { id: 2, title: "E-commerce Website", course: "Web Development", description: "An online platform for buying and selling products." },
    { id: 3, title: "Data Visualization Dashboard", course: "Data Science", description: "Interactive dashboard to visualize complex datasets." },
    { id: 4, title: "Portfolio Website", course: "Design", description: "A personal website to showcase projects and skills." },
  ]);

  const [joinedProjects] = useState<JoinedProject[]>([
    { id: 101, title: "Website Redesign", course: "Web Development", progress: 65 },
    { id: 102, title: "Mobile App", course: "Mobile Development", progress: 30 },
    { id: 103, title: "Marketing Dashboard", course: "Data Science", progress: 85 },
    { id: 104, title: "UI Design System", course: "Design", progress: 50 },
  ]);

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

  useEffect(() => {
    loadCommentCounts();
  }, []);

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
        {/* Filters */}
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

        {/* Picked Projects */}
        <section className="picked-projects">
          <h2>Picked Out For You</h2>
          <div className="project-grid">
            {filteredPickedProjects.map(project => (
              <div key={project.id} className="project-wrapper">
                <div className="project-card">{project.title}</div>

                <div className="action-icons">
                  <div
                    className="upvote-wrapper"
                    onClick={() => {
                      if (!hasUpvoted[project.id]) {
                        setUpvotes(prev => ({ ...prev, [project.id]: (prev[project.id] || 0) + 1 }));
                        setHasUpvoted(prev => ({ ...prev, [project.id]: true }));
                      }
                    }}
                  >
                    <ArrowBigUp className={hasUpvoted[project.id] ? "upvoted" : ""} />
                    <span className="upvote-count">{upvotes[project.id] || 0}</span>
                  </div>

                  <MessageCircle
                    className="action-icon"
                    onClick={() => setSelectedProjectIdForComments(project.id)}
                  />
                  <span className="comment-count">{commentCounts[project.id] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Joined Projects */}
        <section className="joined-projects">
          <h2>Joined Projects</h2>
          <div className="project-grid">
            {filteredJoinedProjects.map(project => (
              <div key={project.id} className="project-wrapper">
                <div className="project-card">{project.title}</div>

                <div className="action-icons">
                  <div
                    className="upvote-wrapper"
                    onClick={() => {
                      if (!hasUpvoted[project.id]) {
                        setUpvotes(prev => ({ ...prev, [project.id]: (prev[project.id] || 0) + 1 }));
                        setHasUpvoted(prev => ({ ...prev, [project.id]: true }));
                      }
                    }}
                  >
                    <ArrowBigUp className={hasUpvoted[project.id] ? "upvoted" : ""} />
                    <span className="upvote-count">{upvotes[project.id] || 0}</span>
                  </div>

                  <MessageCircle
                    className="action-icon"
                    onClick={() => setSelectedProjectIdForComments(project.id)}
                  />
                  <span className="comment-count">{commentCounts[project.id] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Comments Modal */}
      {selectedProjectIdForComments !== null && projectForModal && (
        <ProjectCommentsModal
          projectId={selectedProjectIdForComments}
          projectTitle={projectForModal.title}
          projectDescription={projectForModal.description || "No description available."}
          onClose={() => {
            setSelectedProjectIdForComments(null);
            loadCommentCounts(); // ✅ refresh comment counts after modal closes
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
