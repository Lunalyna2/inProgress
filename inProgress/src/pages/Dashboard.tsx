import * as React from 'react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { Search, ArrowBigUp, MessageCircle, Send } from 'lucide-react';
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
}

interface ProjectComment {
    username: string;
    text: string;
    timestamp: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate(); // Added for navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // --- REPLACED/MODIFIED STATES ---
  // Replaced: showCommentBox, showCommentsList, comments, commentInput
  // New state to manage the Project ID whose comments are open in the modal
  const [selectedProjectIdForComments, setSelectedProjectIdForComments] = useState<number | null>(null);

  // Remaining states for upvotes/etc.
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
    { id: 1, title: 'Website Redesign', course: 'Web Development', progress: 65 },
    { id: 2, title: 'Mobile App', course: 'Mobile Development', progress: 30 },
    { id: 3, title: 'Marketing Dashboard', course: 'Data Science', progress: 85 },
    { id: 4, title: 'UI Design System', course: 'Design', progress: 50 },
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
  
  // Find the project object that corresponds to the open modal ID
  const projectForModal = pickedProjects.find(p => p.id === selectedProjectIdForComments);

  return (
    <div className="dashboard">
      <DashNavbar onProfileClick={function (): void {
        throw new Error('Function not implemented.');
      } } onHomeClick={function (): void {
        throw new Error('Function not implemented.');
      } } />
      
      
      <DashNavbar
        onProfileClick={function (): void { throw new Error('Function not implemented.'); }}
        onHomeClick={function (): void { throw new Error('Function not implemented.'); }}
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

            {/* Changed MAKE PROJECT button to navigate to /create-project */}
            <button className="create-btn" onClick={() => navigate("/create-project")}>
              MAKE<br />PROJECT
            </button>
          </div>
        </div>
      </div>

      <main className="dashboard-main">
        <div className="dashboard-filters-top">
          <div className="dropdown">
            <button
              onClick={() => {
                setShowDepartmentDropdown(!showDepartmentDropdown);
                setShowFilterDropdown(false);
              }}
            >
              DEPARTMENT
            </button>
            {showDepartmentDropdown && (
              <div className="dropdown-menu">
                {departments.map((department) => (
                  <button
                    key={department}
                    onClick={() => {
                      setSelectedDepartment(department);
                      setShowDepartmentDropdown(false);
                    }}
                  >
                    {department}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="dropdown">
            <button
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowDepartmentDropdown(false);
              }}
            >
              FILTER
            </button>
            {showFilterDropdown && (
              <div className="dropdown-menu">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setSelectedFilter(filter);
                      setShowFilterDropdown(false);
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="picked-projects">
          <h2>Picked Out For You</h2>
          <div className="project-grid">
            {filteredPickedProjects.map((project) => (
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
                        setUpvotes(prev => ({
                          ...prev,
                          [project.id]: (prev[project.id] || 0) + 1
                        }));
                        setHasUpvoted(prev => ({
                          ...prev,
                          [project.id]: true
                        }));
                      }
                    }}
                  >
                    <ArrowBigUp className={hasUpvoted[project.id] ? 'upvoted' : ''} />
                    <span className="upvote-count">{upvotes[project.id] || 0}</span>
                  </div>

                  {/* --- MODIFIED CLICK HANDLER --- */}
                  <MessageCircle
                    className="action-icon"
                    // Clicking the icon now opens the full-screen comment modal
                    onClick={() => setSelectedProjectIdForComments(project.id)}
                  />
                    {/* The comment count here is now just placeholder or needs separate fetching */}
                    <span className="comment-count">
                        {/* You'll need to update this logic if you still want a real-time count */}
                        0 
                    </span>
                </div>

                {/* --- REMOVED: Comment Input Pop-Up and Comment List Pop-Up --- */}

              </div>
            ))}
          </div>
        </section>

        <section className="joined-projects">
          <h2>Joined Projects</h2>
          <div className="project-grid">
            {filteredJoinedProjects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-row">
                  <span className="project-title">{project.title}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* --- NEW PROJECT COMMENTS MODAL --- */}
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