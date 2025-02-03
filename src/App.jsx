import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/loginpage/login';
import RegistrationPage from './components/RegistrationStudent/Studentregistration';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import TeacherDashboard from './components/Dashboard/TeacherDashboard';
import AdminDashboard from './components/Dashboard/adminDashboard';
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
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
  
    const checkAuth = async () => {
      try {
        const studentInfo = localStorage.getItem('studentInfo');
        const teacherInfo = localStorage.getItem('teacherInfo');
        const adminInfo = localStorage.getItem('adminInfo');
  
        // Add a small delay to prevent flash of loading state
        await new Promise(resolve => setTimeout(resolve, 100));
  
        if (!mounted) return;
  
        if (studentInfo) {
          setIsAuthenticated(true);
          setUserType('student');
        } else if (teacherInfo) {
          setIsAuthenticated(true);
          setUserType('teacher');
        } else if (adminInfo) {
          setIsAuthenticated(true);
          setUserType('admin');
        } else {
          setIsAuthenticated(false);
          setUserType(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setUserType(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
  
    checkAuth();
  
    return () => {
      mounted = false;
    };
  }, []); 

  const handleLogin = (success, type = null) => {
    setIsAuthenticated(success);
    setUserType(type);
  };

  const handleLogout = () => {
    localStorage.removeItem('studentInfo');
    localStorage.removeItem('teacherInfo');
    localStorage.removeItem('adminInfo');
    setIsAuthenticated(false);
    setUserType(null);
  };

  const getDashboardComponent = () => {
    switch (userType) {
      case 'student':
        return <StudentDashboard onLogout={handleLogout} />;
      case 'teacher':
        return <TeacherDashboard onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard onLogout={handleLogout} />;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  return (
    <Router 
      basename="/" 
      future={{
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route 
          path="login" 
          element={
            isLoading ? (
              <div className="h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : isAuthenticated ? (
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
              {getDashboardComponent()}
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