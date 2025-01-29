import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './components/loginpage/login';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import TeacherDashboard from './components/Dashboard/TeacherDashboard';
import LoadingSpinner from './components/Loadinganimation/Loading';

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboardType, setDashboardType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication
    const studentInfo = localStorage.getItem('userInfo');
    const teacherInfo = localStorage.getItem('teacherInfo');

    if (studentInfo) {
      setIsAuthenticated(true);
      setDashboardType('student');
    } else if (teacherInfo) {
      setIsAuthenticated(true);
      setDashboardType('teacher');
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (success, type = null) => {
    setIsAuthenticated(success);
    setDashboardType(type);
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('teacherInfo');
    setIsAuthenticated(false);
    setDashboardType(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <LoginPage onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              {dashboardType === 'student' ? (
                <StudentDashboard onLogout={handleLogout} />
              ) : dashboardType === 'teacher' ? (
                <TeacherDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )}
            </ProtectedRoute>
          }
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;