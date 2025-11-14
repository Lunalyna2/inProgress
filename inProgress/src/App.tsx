import React, { useState } from 'react'; 
import SignUpPage from './SignUpPage'; 
import LoginPage from './LoginPage'; 
import flipBookProfile from './flipBookProfile';

// Define a union type for the pages
type Page = 'signup' | 'login';

// Define interfaces for the props expected by each page component
export interface LoginPageProps {
    switchToSignup: () => void;
}

export interface SignUpPageProps {
    switchToLogin: () => void;
}

const App: React.FC = () => {
  // State to track the current page being displayed
  const [currentPage, setCurrentPage] = useState<Page>('signup');

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
      // TypeScript now ensures LoginPage receives a function that matches LoginPageProps
      return <LoginPage switchToSignup={switchToSignup} />;
    } else {
      // TypeScript now ensures SignUpPage receives a function that matches SignUpPageProps
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
