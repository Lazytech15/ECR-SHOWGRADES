import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, RefreshCw, Search, UserX, GraduationCap, LogOut, Users, BookOpen } from 'lucide-react';
import axios from 'axios';
import sendEmail, { EmailTemplates } from '../Sendemail/Sendemail';

const AdminDashboard = ({ onLogout }) => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [newTeacher, setNewTeacher] = useState({
    teacher_id: '',
    teacher_name: '',
    personal_email: '',
  });
  const [registrationResult, setRegistrationResult] = useState(null);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const API_BASE_URL = 'https://ecr-api-connection-database.netlify.app/.netlify/functions/service-database';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Use handleGetAllData endpoint for fetching all data
      const response = await axios.post(`${API_BASE_URL}/auth`, {
        action: 'get-alldata'
      });

      if (response.data.success) {
        setStudents(response.data.students || []);
        setTeachers(response.data.teachers || []);
        setGrades(response.data.grades || []);
      } else {
        console.error('Failed to fetch data:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth`, {
        action: 'delete-student',
        studentId
      });
      
      if (response.data.success) {
        fetchAllData(); // Refresh all data after deletion
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth`, {
        action: 'delete-teacher',
        teacherId
      });
      
      if (response.data.success) {
        fetchAllData(); // Refresh all data after deletion
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const handleDeleteGrade = async (ecrName) => {
    if (!confirm('Are you sure you want to delete this grade entry?')) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth`, {
        action: 'delete-grade',
        ecr_name: ecrName
      });
      
      if (response.data.success) {
        fetchAllData(); // Refresh all data after deletion
      }
    } catch (error) {
      console.error('Error deleting grade:', error);
    }
  };
  
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'register-teacher',
          ...newTeacher
        })
      });
  
      const data = await response.json();
      
      if (data.success) {
        // Send welcome email to the teacher
        try {
          await sendEmail({
            template: EmailTemplates.TEACHER_REGISTRATION,
            data: {
              teacherId: newTeacher.teacher_id,
              teacherName: newTeacher.teacher_name,
              email: newTeacher.personal_email,
              username: data.credentials.username,
              password: data.credentials.password
            },
            onProgress: (progress) => {
              console.log('Email sending progress:', progress);
            },
            onError: (error) => {
              console.error('Email sending error:', error);
            }
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }
        
        fetchAllData();
      }
  
      setRegistrationResult({
        success: data.success,
        message: data.message,
        credentials: data.credentials
      });
  
    } catch (error) {
      setRegistrationResult({
        success: false,
        message: 'Error registering teacher'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddTeacher(false);
    setRegistrationResult(null);
    setNewTeacher({
      teacher_id: '',
      teacher_name: '',
      personal_email: '',
    });
  };

  // Handle logout
  const handleLogoutClick = () => {
    onLogout();
  };
  
  // Filter functions
  const filteredGrades = grades.filter(grade => {
    const matchesSection = !selectedSection || grade.section === selectedSection;
    const matchesSubject = !selectedSubject || grade.course_code === selectedSubject;
    const matchesSearch = !searchTerm || 
      grade.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.student_num?.includes(searchTerm);
    return matchesSection && matchesSubject && matchesSearch;
  });

  const filteredStudents = students.filter(student => 
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id?.includes(searchTerm)
  );

  const filteredTeachers = teachers.filter(teacher =>
    teacher.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.personal_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStudentsTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap />
          Students
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.student_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.student_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.course}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleDeleteStudent(student.student_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeachersTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users />
          Teachers
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTeachers.map((teacher) => (
              <tr key={teacher.teacher_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.teacher_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.personal_email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleDeleteTeacher(teacher.teacher_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGradesTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen />
          Grades
        </h2>
        <div className="mt-2 flex gap-4">
          <select
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSelectedSection(e.target.value)}
            value={selectedSection}
          >
            <option value="">All Sections</option>
            {Array.from(new Set(grades.map(grade => grade.section))).map((section, index) => (
              <option key={index} value={section}>{section}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSelectedSubject(e.target.value)}
            value={selectedSubject}
          >
            <option value="">All Subjects</option>
            {Array.from(new Set(grades.map(grade => grade.course_code))).map((subject, index) => (
              <option key={index} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">COURSE CODE</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prelim</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Midterm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GWA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredGrades.map((grade) => (
              <tr key={`${grade.student_num}-${grade.course_code}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.student_num}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.student_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.section}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.course_code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.prelim_grade}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.midterm_grade}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.final_grade}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.gwa}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                  grade.remark === 'PASSED' ? 'text-green-600' : 
                  grade.remark === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {grade.remark}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleDeleteGrade(grade.ecr_name)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'students':
        return renderStudentsTable();
      case 'teachers':
        return renderTeachersTable();
      case 'grades':
        return renderGradesTable();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16 md:pb-4">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="hidden md:flex gap-4">
              <button
                onClick={() => setShowAddTeacher(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                <UserPlus size={20} />
                Add Teacher
              </button>
              <button
                onClick={fetchAllData}
                className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                <RefreshCw size={20} />
                Refresh
              </button>
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:flex space-x-4 bg-white p-4 rounded-lg shadow">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === 'students' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <GraduationCap size={20} />
            Students
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === 'teachers' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users size={20} />
            Teachers
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === 'grades' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen size={20} />
            Grades
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Main Content */}
        {renderContent()}

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
          <div className="grid grid-cols-5 gap-1">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex flex-col items-center justify-center p-2 ${
                activeTab === 'students' ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <GraduationCap size={20} />
              <span className="text-xs">Students</span>
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`flex flex-col items-center justify-center p-2 ${
                activeTab === 'teachers' ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <Users size={20} />
              <span className="text-xs">Teachers</span>
            </button>
            <button
              onClick={() => setActiveTab('grades')}
              className={`flex flex-col items-center justify-center p-2 ${
                activeTab === 'grades' ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <BookOpen size={20} />
              <span className="text-xs">Grades</span>
            </button>
            <button
              onClick={() => setShowAddTeacher(true)}
              className="flex flex-col items-center justify-center p-2 text-gray-500"
            >
              <UserPlus size={20} />
              <span className="text-xs">Add</span>
            </button>
            <button
              onClick={handleLogoutClick}
              className="flex flex-col items-center justify-center p-2 text-red-500"
            >
              <LogOut size={20} />
              <span className="text-xs">Logout</span>
            </button>
          </div>
        </div>

        {/* Add Teacher Modal */}
        {showAddTeacher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add New Teacher</h2>
              
              {registrationResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded ${registrationResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <p>{registrationResult.message}</p>
                    {registrationResult.success && (
                      <div className="mt-4 p-4 bg-gray-50 rounded">
                        <p className="font-semibold">Generated Credentials:</p>
                        <p>Username: {registrationResult.credentials.username}</p>
                        <p>Password: {registrationResult.credentials.password}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddTeacher} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teacher ID</label>
                    <input
                      type="text"
                      required
                      value={newTeacher.teacher_id}
                      onChange={(e) => setNewTeacher({...newTeacher, teacher_id: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newTeacher.teacher_name}
                      onChange={(e) => setNewTeacher({...newTeacher, teacher_name: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      required
                      value={newTeacher.personal_email}
                      onChange={(e) => setNewTeacher({...newTeacher, personal_email: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Add Teacher
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

//admin user
//admin.antipolo@icct.edu.com
//admin pass
//ssd5usBHHa