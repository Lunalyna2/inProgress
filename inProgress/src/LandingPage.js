import React from 'react';
import './LandingPage.css';
import Navbar from './Navbar'; 

const LandingPage = () => {
  return (
    <div>
      <Navbar />  
      
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

          <button className="join-btn">Join Now</button>
        </div>
        
        <img src="./cute.png" alt="Cute" className="landing-img" />
        
      </div>
    </div>
  );
};

export default LandingPage;
