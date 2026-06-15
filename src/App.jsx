import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import TestRoom from './pages/TestRoom';
import TestResult from './pages/TestResult';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read custom session from localStorage
    const savedUser = localStorage.getItem('quiz_user');
    if (savedUser) {
      try {
        setSession(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('quiz_user');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="container flex items-center justify-center" style={{minHeight: '100vh'}}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={session ? <Navigate to="/dashboard" /> : <AuthPage setSession={setSession} />} 
        />
        <Route 
          path="/dashboard" 
          element={session ? <Dashboard session={session} setSession={setSession} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/test" 
          element={session ? <TestRoom session={session} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/result/:attemptId" 
          element={session ? <TestResult session={session} /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
