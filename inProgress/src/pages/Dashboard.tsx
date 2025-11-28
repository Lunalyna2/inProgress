// src/pages/Dashboard.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { Search, ArrowBigUp, MessageCircle, Plus, Users, Building2 } from "lucide-react";
import DashNavbar from "./DashboardNavbar";
import ProjectCommentsModal from "./ProjectCommentsModal";
import { getComments } from "../api/comments";

interface Project {
  id: number;
  title: string;
  description?: string;
  college: string;
  creator_id: number;
  creator_username?: string;
  collaborators?: { userId: number; approved?: boolean }[];
  upvotes?: number;
  upvoted_by?: number[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedProjectIdForComments, setSelectedProjectIdForComments] = useState<number | null>(null);

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvotingInProgress, setUpvotingInProgress] = useState<Set<number>>(new Set());

  const token = localStorage.getItem("userToken");
  const currentUserId = Number(localStorage.getItem("userId"));

  const departments = [
    "All Departments", "Senior High School", "College of Arts & Sciences",
    "College of Business & Accountancy", "College of Computer Studies",
    "College of Education", "College of Engineering", "College of Hospitality Management",
    "College of Nursing", "College of Pharmacy", "College of Law", "College of Medicine",
  ];

  const filters = ["All", "Recent", "Popular", "Trending"];

  // FETCH ONLY OTHER PEOPLE'S PROJECTS (NOT YOUR OWN)
const fetchAllProjects = async () => {
  if (!token) { setLoading(false); return; }
  try {
    const res = await fetch("http://localhost:5000/api/projects/public", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const data: Project[] = await res.json();
    const normalized = data.map(p => ({
      ...p,
      collaborators: p.collaborators ?? [],
      upvotes: p.upvotes ?? 0,
      upvoted_by: [], // we don't use this anymore
    }));
    setAllProjects(normalized);
  } catch (err: any) {
    console.error("Failed to fetch public projects:", err);
    postMessage({ text: "Failed to load projects. Please refresh.", type: "error" });
  } finally {
    setLoading(false);
  }
};

  // UPVOTE
  const handleUpvote = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (upvotingInProgress.has(projectId)) return;
    setUpvotingInProgress(prev => new Set(prev).add(projectId));

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        const updated = await res.json();
        setAllProjects(prev =>
          prev.map(p => p.id === projectId ? { ...p, upvotes: updated.upvotes, upvoted_by: updated.upvoted_by } : p)
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpvotingInProgress(prev => { const n = new Set(prev); n.delete(projectId); return n; });
    }
  };

  // COMMENT COUNTS
  const [commentCounts, setCommentCounts] = useState<{ [key: number]: number }>({});
  const loadCommentCounts = useCallback(async () => {
    if (!allProjects.length) return;
    const counts: { [key: number]: number } = {};
    const results = await Promise.all(allProjects.map(p => getComments(p.id).catch(() => [])));
    allProjects.forEach((p, i) => counts[p.id] = results[i]?.length || 0);
    setCommentCounts(counts);
  }, [allProjects]);

  useEffect(() => { fetchAllProjects(); }, [token]);
  useEffect(() => { if (allProjects.length) loadCommentCounts(); }, [allProjects, loadCommentCounts]);

  // FILTERED PROJECTS
  const pickedProjects = useMemo(() => {
    let list = allProjects
      .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(p => selectedDepartment === "All Departments" || p.college === selectedDepartment);

    switch (selectedFilter) {
      case "Recent": return [...list].sort((a, b) => b.id - a.id);
      case "Popular": return [...list].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      case "Trending": return [...list].sort((a, b) => ((b.upvotes || 0) * 2 + (commentCounts[b.id] || 0)) - ((a.upvotes || 0) * 2 + (commentCounts[a.id] || 0)));
      default: return list;
    }
  }, [allProjects, searchQuery, selectedDepartment, selectedFilter, commentCounts]);

  const joinedProjects = useMemo(() => {
    return allProjects
      .filter(p => Array.isArray(p.collaborators) && p.collaborators.some(c => c.userId === currentUserId && c.approved))
      .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allProjects, searchQuery, currentUserId]);

  const modalProject = allProjects.find(p => p.id === selectedProjectIdForComments);

  const goToProject = (projectId: number, isCollaborator: boolean = false) => {
    navigate(`/joined-collaborator-folder/${projectId}`, { state: { isCollaborator } });
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

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
            <button className="create-btn" onClick={() => navigate("/create-project-form")}>
              <Plus size={20} /> CREATE PROJECT
            </button>
          </div>
        </div>
      </div>

      <main className="dashboard-main">
        <div className="dashboard-filters-top">
          <div className="dropdown">
            <button onClick={() => { setShowDepartmentDropdown(!showDepartmentDropdown); setShowFilterDropdown(false); }}>
              {selectedDepartment} ▼
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
              {selectedFilter} ▼
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

        {/* Picked Out For You */}
        <section className="project-section">
          <h2>Picked Out For You</h2>
          <div className="horizontal-scroll">
            {pickedProjects.length === 0 ? (
              <p className="no-data">No projects match your filters.</p>
            ) : (
              pickedProjects.map(project => (
                <div
                  key={project.id}
                  className="project-card-modern"
                  onClick={() => goToProject(project.id)}
                >
                  <div className="card-gradient" />
                  <div className="card-content">
                    <h3 className="card-title">{project.title}</h3>
                    <div className="card-college">
                      <Building2 size={14} />
                      <span>{project.college}</span>
                    </div>
                    <div className="card-actions">
                      <div className="action-item" onClick={e => { e.stopPropagation(); handleUpvote(project.id, e); }}>
                        <ArrowBigUp className={project.upvoted_by?.includes(currentUserId) ? "upvoted" : ""} size={18} />
                        <span>{project.upvotes || 0}</span>
                      </div>
                      <div className="action-item" onClick={e => { e.stopPropagation(); setSelectedProjectIdForComments(project.id); }}>
                        <MessageCircle size={18} />
                        <span>{commentCounts[project.id] || 0}</span>
                      </div>
                      <div className="action-item">
                        <Users size={18} />
                        <span>{project.collaborators?.filter(c => c.approved).length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Joined Projects */}
        <section className="project-section">
          <h2>Joined Projects</h2>
          <div className="horizontal-scroll">
            {joinedProjects.length === 0 ? (
              <p className="no-data">You haven't joined any projects yet.</p>
            ) : (
              joinedProjects.map(project => (
                <div
                  key={project.id}
                  className="project-card-modern joined"
                  onClick={() => goToProject(project.id, true)}
                >
                  <div className="card-gradient joined" />
                  <div className="card-content">
                    <div className="joined-badge">Joined</div>
                    <h3 className="card-title">{project.title}</h3>
                    <div className="card-college">
                      <Building2 size={14} />
                      <span>{project.college}</span>
                    </div>
                    <div className="card-actions">
                      <div className="action-item" onClick={e => { e.stopPropagation(); handleUpvote(project.id, e); }}>
                        <ArrowBigUp className={project.upvoted_by?.includes(currentUserId) ? "upvoted" : ""} size={18} />
                        <span>{project.upvotes || 0}</span>
                      </div>
                      <div className="action-item" onClick={e => { e.stopPropagation(); setSelectedProjectIdForComments(project.id); }}>
                        <MessageCircle size={18} />
                        <span>{commentCounts[project.id] || 0}</span>
                      </div>
                      <div className="action-item">
                        <Users size={18} />
                        <span>{project.collaborators?.filter(c => c.approved).length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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