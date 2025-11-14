import React from 'react';
import SignUpPage from './signup'; // Import your new component
import LandingPage from './LandingPage';

const App = () => {
  return (
    <div className="App">
      <LandingPage /> {/* Render SignUp Page */}
    </div>
  );
};

export default App;