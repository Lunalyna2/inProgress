import React, { useState } from 'react'; // Import useState
import SignUpPage from './signup';
import LoginPage from './login'; // Import the Login component

const App = () => {
  // State to track the current page being displayed
  const [currentPage, setCurrentPage] = useState('signup'); // Start on signup

  // Function to switch the view
  const switchToLogin = () => {
    setCurrentPage('login');
  };
  
  const switchToSignup = () => {
    setCurrentPage('signup');
  };

  // Conditional Rendering Logic
  const renderPage = () => {
    if (currentPage === 'login') {
      // Pass the switch function so the login page can switch back if needed
      return <LoginPage switchToSignup={switchToSignup} />;
    } else {
      // Pass the switch function to the signup page
      return <SignUpPage switchToLogin={switchToLogin} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
};

export default App;