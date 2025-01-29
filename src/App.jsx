import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/loginpage/login';
import RegistrationPage from './components/RegistrationStudent/Studentregistration';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import TeacherDashboard from './components/Dashboard/TeacherDashboard';
import LoadingSpinner from './components/Loadinganimation/Loading';

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated, isLoading }) => {
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboardType, setDashboardType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const studentInfo = localStorage.getItem('userInfo');
      const teacherInfo = localStorage.getItem('teacherInfo');

      if (studentInfo) {
        setIsAuthenticated(true);
        setDashboardType('student');
      } else if (teacherInfo) {
        setIsAuthenticated(true);
        setDashboardType('teacher');
      } else {
        setIsAuthenticated(false);
        setDashboardType(null);
      }
      setIsLoading(false);
    };

    checkAuth();
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

  return (
    <Router basename="/">
      <Routes>
        <Route 
          path="login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          } 
        />
        
        <Route 
          path="register" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <RegistrationPage />
            )
          } 
        />

        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
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
          element={
            isLoading ? (
              <div className="h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <Navigate to={isAuthenticated ? "dashboard" : "login"} replace />
            )
          }
        />

        <Route 
          path="*" 
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;