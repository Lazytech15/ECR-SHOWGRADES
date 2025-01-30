//studentdashboard.jsx
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
import StudentSettings from '../Studentsettings/Studentsettings';

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
    const fetchData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.studentId) {
          navigate('/login');
          return;
        }
  
        // Fetch grades using new API endpoint
        const gradesResponse = await fetch(`${LOCAL_API_URL}/api/grades?studentId=${userInfo.studentId}`);
        if (!gradesResponse.ok) {
          throw new Error('Failed to fetch grades');
        }
        
        // Get student data
        const getstudentdata = await fetch(`${LOCAL_API_URL}/api/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'get-alldata', studentId: userInfo.studentId })
        });
        
        if (!getstudentdata.ok) {
          throw new Error('Failed to fetch student data');
        }
        
        const newstudentData = await getstudentdata.json();
        if (!newstudentData.success) {
          throw new Error('Failed to fetch student data: ' + newstudentData.message);
        }
  
        const gradesData = await gradesResponse.json();
        if (gradesData.success) {
          const organizedGrades = organizeGradesByTrimester(gradesData.grades);
          setGrades(organizedGrades);
          
          // Extract student data from the first grade entry
          if (gradesData.grades.length > 0) {
            const firstGrade = gradesData.grades[0];
            setStudentData({
              name: userInfo.name,
              studentId: userInfo.studentId,
              course: newstudentData.student.course,
              section: newstudentData.student.section,
              trimester: newstudentData.student.trimester
            });
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
  
    fetchData();
  
    // Initialize WebSocket connection
    const socket = new WebSocket('ws://localhost:5000');
  
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };
  
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'database_update') {
        // Check which tables were updated
        const changes = data.changes;
        
        // Refresh data if relevant tables were updated
        if (changes.students_update || changes.grades_update) {
          fetchData();
        }
      }
    };
  
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  
    return () => {
      socket.close();
    };
  }, [navigate]);
  
  // Organize grades by trimester
  const organizeGradesByTrimester = (gradesData) => {
    return gradesData.reduce((acc, grade) => {
      const trimester = `Trimester ${grade.trimester}`;
      if (!acc[trimester]) {
        acc[trimester] = [];
      }
      
      const courseGrades = {
        subject: grade.course_description,
        courseCode: grade.course_code,
        section: grade.section,
        prelimGrade: grade.prelim_grade,
        midtermGrade: grade.midterm_grade,
        finalGrade: grade.final_grade,
        remark: grade.remark,
        teacher: grade.faculty_name,
        created: grade.created_at,
        updated: grade.updated_at
      };
      
      acc[trimester].push(courseGrades);
      return acc;
    }, {});
  };  
  
  // Updated communication function for the mailbox feature
  const sendCommunication = async (type, data) => {
    try {
      const response = await fetch(`${LOCAL_API_URL}/api/communicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, data })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return result;
    } catch (error) {
      console.error('Communication error:', error);
      throw error;
    }
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
              {'Semester: ' + (studentData.trimester || 'N/A')}
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

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeView === 'dashboard' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <Home size={20} />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button
          onClick={() => {
            setIsGradesMenuOpen(!isGradesMenuOpen);
            setActiveView('grades');
          }}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeView === 'grades' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <GraduationCap size={20} />
          <span className="text-xs mt-1">Grades</span>
        </button>
        <button
          onClick={() => setActiveView('mailbox')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeView === 'mailbox' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <Mail size={20} />
          <span className="text-xs mt-1">Mail</span>
        </button>
        <button
          onClick={() => setActiveView('settings')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeView === 'settings' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <Settings size={20} />
          <span className="text-xs mt-1">Settings</span>
        </button>
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center w-full h-full text-red-600"
        >
          <LogOut size={20} />
          <span className="text-xs mt-1">Logout</span>
        </button>
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
        // return (
        //   <div className="bg-white p-6 rounded-lg shadow-md">
        //     <h2 className="text-2xl font-bold mb-4">Settings</h2>
        //     <p className="text-gray-600">Settings feature coming soon...</p>
        //   </div>
        // );
        return <StudentSettings studentData={studentData} />;
      default:
        return <DashboardContent />;
    }
  };

  const MobileGradesMenu = () => (
    isGradesMenuOpen && activeView === 'grades' && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
        <div className="bg-white rounded-t-xl p-4 absolute bottom-16 left-0 right-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Select Semester</h3>
            <button onClick={() => setIsGradesMenuOpen(false)} className="text-gray-500">
              ✕
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.keys(grades).map((semester) => (
              <button
                key={semester}
                onClick={() => {
                  setSelectedSemester(semester);
                  setIsGradesMenuOpen(false);
                }}
                className={`w-full p-3 text-left rounded-md ${
                  selectedSemester === semester ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                {semester}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  );

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
      {/* Desktop Sidebar - hidden on mobile */}
      <div className={`hidden md:block ${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-md transition-all duration-300 ease-in-out relative`}>
        <div className="flex justify-between items-center p-4 border-b">
          {isSidebarOpen && <h2 className="text-xl font-bold">Student Portal</h2>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="ml-auto">
            {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>

        <nav className="mt-4 space-y-2 px-2">
          {/* Desktop navigation items */}
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
              onClick={onLogout}
            />
          </div>
        </nav>
      </div>

      {/* Main content area - adjusted padding for mobile */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            {studentData && (
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">{studentData.name}</h1>
                <p className="text-sm md:text-base text-gray-600">Student ID: {studentData.studentId}</p>
                <p className="text-sm md:text-base text-gray-600">Course: {studentData.course}</p>
                <p className="text-sm md:text-base text-gray-600">Section: {studentData.section}</p>
              </div>
            )}
          </div>
          {renderContent()}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Mobile Grades Menu */}
      <MobileGradesMenu />

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-20 md:bottom-4 right-4 bg-red-100 border-l-4 border-red-500 p-4 rounded shadow-lg">
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
