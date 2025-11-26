import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { Search, ArrowBigUp, MessageCircle } from 'lucide-react';
import DashNavbar from './DashboardNavbar';
import ProjectCommentsModal from './ProjectCommentsModal';

interface Project {
  description: string | undefined;
  id: number;
  title: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // --- Comments modal state ---
  const [selectedProjectIdForComments, setSelectedProjectIdForComments] = useState<number | null>(null);
  const [upvotes, setUpvotes] = useState<{ [key: number]: number }>({});
  const [hasUpvoted, setHasUpvoted] = useState<{ [key: number]: boolean }>({});

  const departments = [
    'All Departments',
    'Senior High School',
    'College of Agriculture, Resources and Environmental Sciences',
    'College of Arts & Sciences',
    'College of Business & Accountancy',
    'College of Computer Studies',
    'College of Education',
    'College of Engineering',
    'College of Hospitality Management',
    'College of Medical Laboratory Science',
    'College of Nursing',
    'College of Pharmacy',
    'College of Law',
    'College of Medicine',
    'College of Theology',
  ];

  const filters = ['All', 'Recent', 'Popular', 'Trending'];

  const [pickedProjects] = useState<Project[]>([
    { id: 1, title: 'Build a Social Media App', course: 'Mobile Development', description: 'An app that allows users to connect and share content.' },
    { id: 2, title: 'E-commerce Website', course: 'Web Development', description: 'An online platform for buying and selling products.' },
    { id: 3, title: 'Data Visualization Dashboard', course: 'Data Science', description: 'Interactive dashboard to visualize complex datasets.' },
    { id: 4, title: 'Portfolio Website', course: 'Design', description: 'A personal website to showcase projects and skills.' },
  ]);

  const [joinedProjects, setJoinedProjects] = useState<JoinedProject[]>([
    { id: 1, title: 'Website Redesign', course: 'Web Development', progress: 65, description: 'Redesigning old website with modern UI.' },
    { id: 2, title: 'Mobile App', course: 'Mobile Development', progress: 30, description: 'Developing a cross-platform mobile app.' },
    { id: 3, title: 'Marketing Dashboard', course: 'Data Science', progress: 85, description: 'Dashboard for marketing KPIs.' },
    { id: 4, title: 'UI Design System', course: 'Design', progress: 50, description: 'Creating a reusable UI component library.' },
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredPickedProjects = pickedProjects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedDepartment === 'All Departments' || project.course === selectedDepartment)
  );

  const filteredJoinedProjects = joinedProjects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const projectForModal =
    pickedProjects.find(p => p.id === selectedProjectIdForComments) ||
    joinedProjects.find(p => p.id === selectedProjectIdForComments);

  return (
    <div className="dashboard">
      <DashNavbar
        onProfileClick={() => {}}
        onHomeClick={() => {}}
      />

      <div className="dashboard-content">
        <div className="dashboard-header-row">
          <div className="dashboard-actions" style={{ width: '100%', justifyContent: 'space-between' }}>
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
                <div className="project-card">
                  <div className="project-preview">{project.title}</div>
                  <button className="join-btn">JOIN</button>
                </div>

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
                    <ArrowBigUp className={hasUpvoted[project.id] ? 'upvoted' : ''} />
                    <span className="upvote-count">{upvotes[project.id] || 0}</span>
                  </div>

                  <MessageCircle
                    className="action-icon"
                    onClick={() => setSelectedProjectIdForComments(project.id)}
                  />
                  <span className="comment-count">0</span>
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
                <div className="project-card">
                  <div className="project-title">{project.title}</div>
                </div>

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
                    <ArrowBigUp className={hasUpvoted[project.id] ? 'upvoted' : ''} />
                    <span className="upvote-count">{upvotes[project.id] || 0}</span>
                  </div>

                  <MessageCircle
                    className="action-icon"
                    onClick={() => setSelectedProjectIdForComments(project.id)}
                  />
                  <span className="comment-count">0</span>
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
          projectDescription={projectForModal.description || 'No description available.'}
          onClose={() => setSelectedProjectIdForComments(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
