import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  GraduationCap, 
  Mail,
  Settings,
  ChevronLeft, 
  ChevronRight,
  LogOut,
  AlertTriangle,
  ChevronDown 
} from 'lucide-react';
import LoadingSpinner from '../Loadinganimation/Loading';

const API_URL = 'https://project-to-ipt01.netlify.app/.netlify/functions/api';
const LOCAL_API_URL = 'http://localhost:5000';

const StudentDashboard = ({ onLogout }) => {
  // State variables
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [isGradesMenuOpen, setIsGradesMenuOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch user info from local storage
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Handle logout
  const handleLogout = () => {
    onLogout();
  };

  // Fetch student data and grades
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.id) {
          navigate('/login');
          return;
        }
  
        const studentId = userInfo.id;
  
        const studentResponse = await fetch(`${API_URL}/students/${studentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
  
        if (!studentResponse.ok) {
          throw new Error('Failed to fetch student data');
        }
  
        const studentData = await studentResponse.json();
        setStudentData(studentData);
  
        const gradesResponse = await fetch(`${LOCAL_API_URL}/student-grades/${studentData.studentId}`);
  
        if (!gradesResponse.ok) {
          throw new Error('Failed to fetch grades');
        }
  
        const gradesData = await gradesResponse.json();
        const organizedGrades = organizeGradesByTrimester(gradesData.grades);
        setGrades(organizedGrades);
        setLoading(false);
  
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
  
    fetchStudentData();
  }, [navigate]);

  // Organize grades by trimester
  const organizeGradesByTrimester = (gradesData) => {
    return gradesData.reduce((acc, grade) => {
      const trimester = `Trisemester ${grade.trimester}`;
      if (!acc[trimester]) {
        acc[trimester] = [];
      }
      acc[trimester].push({
        subject: grade.course_description,
        courseCode: grade.course_code,
        grade: grade.final_grade,
        credits: grade.credit_units,
        section: grade.section,
        prelimGrade: grade.prelim_grade,
        midtermGrade: grade.midterm_grade,
        finalGrade: grade.final_grade,
        remark: grade.remark,
        teacher: grade.faculty_name,
        created: grade.created_at,
        updated: grade.updated_at,
      });
      return acc;
    }, {});
  };

  // Calculate GWA for a course
  const calculateCourseGWA = (course) => {
    const prelim = parseFloat(course.prelimGrade) || 0;
    const midterm = parseFloat(course.midtermGrade) || 0;
    const final = parseFloat(course.finalGrade) || 0;
    const gwa = (prelim + midterm + final) / 3;
    return gwa.toFixed(2);
  };

  // Get color based on grade
  const getGradeColor = (gwa) => {
    const grade = parseFloat(gwa);
    if (grade <= 1.5) return 'text-green-600';
    if (grade <= 2.0) return 'text-blue-600';
    if (grade <= 2.5) return 'text-yellow-600';
    if (grade <= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get courses with low grades
  const getLowGradeCourses = () => {
    if (!grades || Object.keys(grades).length === 0) {
      return [];
    }
  
    const lowGradeCourses = [];
    Object.entries(grades).forEach(([semester, semesterGrades]) => {
      semesterGrades.forEach(course => {
        if (course.finalGrade && course.finalGrade !== '0.00') {
          return;
        }
  
        let mostRecentGrade = null;
        let termType = null;
  
        if (course.midtermGrade && course.midtermGrade !== '0.00') {
          mostRecentGrade = parseFloat(course.midtermGrade);
          termType = 'Midterm';
        } else if (course.prelimGrade && course.prelimGrade !== '0.00') {
          mostRecentGrade = parseFloat(course.prelimGrade);
          termType = 'Prelim';
        }
  
        if (mostRecentGrade !== null && !isNaN(mostRecentGrade) && mostRecentGrade >= 2.00) {
          lowGradeCourses.push({
            ...course,
            semester,
            termType,
            grade: mostRecentGrade.toFixed(2)
          });
        }
      });
    });
    
    return lowGradeCourses;
  };
  
  // Calculate overall GWA
  const calculateOverallGWA = () => {
    let totalGWA = 0;
    let totalCourses = 0;

    Object.values(grades).forEach(semesterGrades => {
      semesterGrades.forEach(course => {
        const gwa = parseFloat(calculateCourseGWA(course));
        if (gwa !== 5.0) {
          totalGWA += gwa;
          totalCourses++;
        }
      });
    });

    return totalCourses > 0 ? (totalGWA / totalCourses).toFixed(2) : 'N/A';
  };

  // Calculate total number of courses
  const calculateTotalCourses = () => {
    return Object.values(grades).reduce((total, semesterGrades) => total + semesterGrades.length, 0);
  };

  // Sidebar item component
  const SidebarItem = ({ icon: Icon, label, active, onClick, hasSubmenu, isOpen }) => (
    <div 
      onClick={onClick}
      className={`flex items-center p-3 ${active ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'} rounded-md cursor-pointer`}
    >
      <Icon className="mr-3" size={20} />
      {isSidebarOpen && (
        <div className="flex items-center justify-between flex-1">
          <span>{label}</span>
          {hasSubmenu && <ChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} size={16} />}
        </div>
      )}
    </div>
  );

  // Dashboard content component
  const DashboardContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Overall GWA</h3>
          <p className={`text-3xl font-bold ${getGradeColor(calculateOverallGWA())}`}>
            {calculateOverallGWA()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Courses</h3>
          <p className="text-3xl font-bold text-green-600">{calculateTotalCourses()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Current Trisemester</h3>
          <p className="text-3xl font-bold text-purple-600">
              {'Semester: ' + (studentData.trisemester || 'N/A')}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Courses Needing Attention (Grade ≥ 2.00)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left">Course</th>
                <th className="p-3 text-center">Semester</th>
                <th className="p-3 text-center">Latest Term</th>
                <th className="p-3 text-center">Current Grade</th>
              </tr>
            </thead>
            <tbody>
              {getLowGradeCourses().map((course, index) => (
                <tr key={index} className="border-b">
                  <td className="p-3">
                    <div>{course.courseCode}</div>
                    <div className="text-sm text-gray-600">{course.subject}</div>
                  </td>
                  <td className="p-3 text-center">{course.semester}</td>
                  <td className="p-3 text-center">{course.termType}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                      parseFloat(course.grade) >= 3.0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {course.grade}
                    </span>
                  </td>
                </tr>
              ))}
              {getLowGradeCourses().length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    No courses currently need attention
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Get remark color based on remark text
  const getRemarkColor = (remark) => {
    if (remark === "PASSED") return "text-green-500";
    if (remark === "INC") return "text-orange-500";
    return "text-red-500";
  };

  // Format date to a readable string
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardContent />;
      case 'grades':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{selectedSemester || 'Select a Semester'}</h1>
            </div>
            {selectedSemester && (
              <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 text-left">Course</th>
                      <th className="p-3 text-center">Section</th>
                      <th className="p-3 text-center">Prelim</th>
                      <th className="p-3 text-center">Midterm</th>
                      <th className="p-3 text-center">Final</th>
                      <th className="p-3 text-center">Remarks</th>
                      <th className="p-3 text-center">Faculty Name</th>
                      <th className="p-3 text-center">GWA</th>
                      <th className="p-3 text-center">Uploaded</th>
                      <th className="p-3 text-center">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades[selectedSemester]?.map((course, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3">
                          <div>{course.courseCode}</div>
                          <div className="text-sm text-gray-600">{course.subject}</div>
                        </td>
                        <td className="p-3 text-center">{course.section}</td>
                        <td className="p-3 text-center">{course.prelimGrade}</td>
                        <td className="p-3 text-center">{course.midtermGrade}</td>
                        <td className="p-3 text-center">{course.finalGrade}</td>
                        <td className={`p-3 text-center ${getRemarkColor(course.remark)}`}>{course.remark}</td>
                        <td className="p-3 text-center">{course.teacher}</td>
                        <td className={`p-3 text-center ${getGradeColor(calculateCourseGWA(course))}`}>
                          {calculateCourseGWA(course)}
                        </td>
                        <td className="p-3 text-center">{formatDate(course.created)}</td>
                        <td className="p-3 text-center">{formatDate(course.updated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'mailbox':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Mailbox</h2>
            <p className="text-gray-600">Mailbox feature coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-gray-600">Settings feature coming soon...</p>
          </div>
        );
      default:
        return <DashboardContent />;
    }
  };

  // Display loading spinner if data is loading
  if (loading) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="md" /></div>;
  }

  // Display error message if there is an error
  if (error) {
    return <div className="flex h-screen items-center justify-center text-red-500">Error: {error}</div>;
  }

  // Main component render
  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-md transition-all duration-300 ease-in-out relative`}>
        <div className="flex justify-between items-center p-4 border-b">
          {isSidebarOpen && <h2 className="text-xl font-bold">Student Portal</h2>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="ml-auto">
            {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>

        <nav className="mt-4 space-y-2 px-2">
          <SidebarItem 
            icon={Home}
            label="Dashboard"
            active={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
          />
          
          <div>
            <SidebarItem 
              icon={GraduationCap}
              label="Grades"
              active={activeView === 'grades'}
              hasSubmenu={true}
              isOpen={isGradesMenuOpen}
              onClick={() => setIsGradesMenuOpen(!isGradesMenuOpen)}
            />
            
            {isGradesMenuOpen && isSidebarOpen && (
              <div className="ml-8 mt-2 space-y-2">
                {Object.keys(grades).map((semester) => (
                  <div
                    key={semester}
                    onClick={() => {
                      setSelectedSemester(semester);
                      setActiveView('grades');
                    }}
                    className={`p-2 rounded-md cursor-pointer ${
                      selectedSemester === semester ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                    }`}
                  >
                    {semester}
                  </div>
                ))}
              </div>
            )}
          </div>

          <SidebarItem 
            icon={Mail}
            label="Mailbox"
            active={activeView === 'mailbox'}
            onClick={() => setActiveView('mailbox')}
          />

          <SidebarItem 
            icon={Settings}
            label="Settings"
            active={activeView === 'settings'}
            onClick={() => setActiveView('settings')}
          />

          <div className="absolute bottom-4 left-2 right-2">
            <SidebarItem 
              icon={LogOut} 
              label="Logout" 
              onClick={handleLogout}
            />
          </div>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            {studentData && (
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{studentData.name}</h1>
                <p className="text-gray-600">Student ID: {studentData.studentId}</p>
              </div>
            )}
          </div>
          {renderContent()}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 p-4 rounded shadow-lg">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
