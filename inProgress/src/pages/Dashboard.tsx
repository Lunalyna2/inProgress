import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { Search, ArrowBigUp, MessageCircle, Plus } from "lucide-react";
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
  const [commentCounts, setCommentCounts] = useState<{ [key: number]: number }>({});

  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [pickedProjects, setPickedProjects] = useState<Project[]>([]);

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

  // Fetch my projects
  const fetchMyProjects = async () => {
    const token = localStorage.getItem("userToken");
    try {
      const res = await fetch("http://localhost:5000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMyProjects(data.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          course: p.college || "Unknown",
        })));
      }
    } catch (err) {
      console.error("Failed to load my projects");
    }
  };

  // Fetch picked projects (simulate or use real API later)
  const fetchPickedProjects = async () => {
    const mock = [
      { id: 1, title: "Build a Social Media App", course: "Mobile Development", description: "..." },
      { id: 2, title: "E-commerce Website", course: "Web Development", description: "..." },
    ];
    setPickedProjects(mock);
  };

  const loadCommentCounts = async () => {
    const all = [...myProjects, ...pickedProjects];
    const counts: { [key: number]: number } = {};
    await Promise.all(
      all.map(async (p) => {
        try {
          const c = await getComments(p.id);
          counts[p.id] = c.length;
        } catch {
          counts[p.id] = 0;
        }
      })
    );
    setCommentCounts(counts);
  };

  useEffect(() => {
    fetchMyProjects();
    fetchPickedProjects();
  }, []);

  useEffect(() => {
    if (myProjects.length || pickedProjects.length) loadCommentCounts();
  }, [myProjects, pickedProjects]);

  const filteredPicked = pickedProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedDepartment === "All Departments" || p.course === selectedDepartment)
  );

  const filteredMy = myProjects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allProjects = [...pickedProjects, ...myProjects];
  const modalProject = allProjects.find(p => p.id === selectedProjectIdForComments);

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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="search-icon" />
            </div>
            <button className="create-btn" onClick={() => navigate("/create-project")}>
              <Plus size={20} /> MAKE PROJECT
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
            {filteredPicked.map(project => (
              <div
                key={project.id}
                className="project-wrapper clickable"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <div className="project-card">{project.title}</div>
                <div className="action-icons">
                  <div className="upvote-wrapper" onClick={(e) => e.stopPropagation()}>
                    <ArrowBigUp
                      className={hasUpvoted[project.id] ? "upvoted" : ""}
                      onClick={() => {
                        if (!hasUpvoted[project.id]) {
                          setUpvotes(prev => ({ ...prev, [project.id]: (prev[project.id] || 0) + 1 }));
                          setHasUpvoted(prev => ({ ...prev, [project.id]: true }));
                        }
                      }}
                    />
                    <span className="upvote-count">{upvotes[project.id] || 0}</span>
                  </div>
                  <MessageCircle
                    className="action-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProjectIdForComments(project.id);
                    }}
                  />
                  <span className="comment-count">{commentCounts[project.id] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="joined-projects">
          <h2>My Projects</h2>
          <div className="project-grid">
            {filteredMy.map(project => (
              <div
                key={project.id}
                className="project-wrapper clickable"
                onClick={() => navigate(`/project-owner-folder/${project.id}`)}
              >
                <div className="project-card">{project.title}</div>
                <div className="action-icons">
                  <div className="upvote-wrapper" onClick={e => e.stopPropagation()}>
                    <ArrowBigUp
                      className={hasUpvoted[project.id] ? "upvoted" : ""}
                      onClick={() => {
                        if (!hasUpvoted[project.id]) {
                          setUpvotes(prev => ({ ...prev, [project.id]: (prev[project.id] || 0) + 1 }));
                          setHasUpvoted(prev => ({ ...prev, [project.id]: true }));
                        }
                      }}
                    />
                    <span className="upvote-count">{upvotes[project.id] || 0}</span>
                  </div>
                  <MessageCircle
                    className="action-icon"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedProjectIdForComments(project.id);
                    }}
                  />
                  <span className="comment-count">{commentCounts[project.id] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </section>



      </main>

      {selectedProjectIdForComments && modalProject && (
        <ProjectCommentsModal
          projectId={selectedProjectIdForComments}
          projectTitle={modalProject.title}
          projectDescription={modalProject.description || "No description"}
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