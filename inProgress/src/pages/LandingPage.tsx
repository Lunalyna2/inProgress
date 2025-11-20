import React, { useRef } from 'react';
import './LandingPage.css';
import Navbar from './Navbar';
import { Users, Lightbulb, Target } from 'lucide-react';
import { useNavigate } from "react-router-dom";


const LandingPage: React.FC = () => {
  const aboutRef = useRef<HTMLDivElement>(null);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <Navbar onAboutClick={scrollToAbout} onHomeClick={scrollToTop} />

      {/* Hero Section */}
      <div className="landing-container">
        <div className="landing-text">
          <h1>Finish What You Start.</h1>
          <div className="sub-title">
            <h1>Collaborate, Refine, Succeed</h1>
          </div>
          <p>
            inProgress is a platform where student ideas grow from concept to incubator-ready projects
            through the power of peer collaboration and feedback.
          </p>
          <button className="join-btn" onClick={() => navigate("/auth")}>
            Join Now
          </button>
        </div>
        <img src="./cute.png" alt="Cute" className="landing-img" />
      </div>

      {/* About Section */}
      <section ref={aboutRef} className="about-section">
        <div className="about-inner">
          <h2>About</h2>
          <div className="about-text">
            <p>
              InProgress is a <span className="highlight-indigo">CPU-exclusive collaboration platform</span> designed for students who want to turn their unfinished ideas into completed projects. 
              Our platform empowers students to <span className="highlight-pink"> transform incomplete projects into successful achievements </span>through peer connection, structured teamwork, and meaningful feedback. 
              InProgress serves as a collaborative hub where students across different colleges and disciplines can share their work-in-progress, refine ideas through peer input, and complete their projects with support. 
              Before advancing your project for institutional recognition or innovation incubation, InProgress provides the <span className="highlight-purple">structured environment</span> needed to polish your work and join the <span className="highlight-pink">community of innovators at CPU</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><Users size={32} /></div>
            <h3>Connect & Collaborate</h3>
            <p>Find like-minded students across different colleges and disciplines to work on shared projects and ideas.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><Lightbulb size={32} /></div>
            <h3>Share & Refine</h3>
            <p>Get structured feedback on your ideas and iterate with peer support to strengthen your project foundation.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><Target size={32} /></div>
            <h3>Complete & Advance</h3>
            <p>Transform unfinished ideas into completed projects ready for institutional recognition or innovation incubation.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <p className="footer-title">InProgress</p>
          <p className="footer-sub">A CPU-Exclusive Collaboration Platform</p>
          <p className="footer-small">© 2025 InProgress. Empowering students to complete what they start.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
