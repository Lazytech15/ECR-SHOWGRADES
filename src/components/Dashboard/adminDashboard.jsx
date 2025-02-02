import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, RefreshCw, Search, UserX, GraduationCap, LogOut } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = ({onLogout}) => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    teacher_id: '',
    teacher_name: '',
    personal_email: '',
  });
  const [registrationResult, setRegistrationResult] = useState(null);

  const API_BASE_URL = 'https://ecr-api-connection-database.netlify.app/.netlify/functions/service-database';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [studentsRes, teachersRes, gradesRes] = await Promise.all([
        axios.post(`${API_BASE_URL}/auth`, { action: 'get-alldata' }),
        axios.get(`${API_BASE_URL}/teachers`),
        axios.get(`${API_BASE_URL}/grades`)
      ]);

      setStudents(studentsRes.data.students || []);
      setTeachers(teachersRes.data.teachers || []);
      setGrades(gradesRes.data.grades || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await axios.post(`${API_BASE_URL}/auth`, {
        action: 'delete-student',
        studentId
      });
      fetchAllData();
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleDeleteGrade = async (ecrName) => {
    if (!confirm('Are you sure you want to delete this grade entry?')) return;
    
    try {
      await axios.post(`${API_BASE_URL}/auth`, {
        action: 'delete-grade',
        ecr_name: ecrName
      });
      fetchAllData();
    } catch (error) {
      console.error('Error deleting grade:', error);
    }
  };

  const generateCredentials = (teacherName, teacherId) => {
    // Generate username from teacher name (first 2 letters of each word) + last 4 digits of ID
    const username = teacherName
      .toLowerCase()
      .split(' ')
      .map(part => part.substring(0, 2))
      .join('') + teacherId.slice(-4);

    // Generate random password
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const password = Array.from({ length: 10 }, () => 
      charset[Math.floor(Math.random() * charset.length)]
    ).join('');

    return { username, password };
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const credentials = generateCredentials(newTeacher.teacher_name, newTeacher.teacher_id);
      const created_at = new Date().toISOString();
      
      const response = await axios.post(`${API_BASE_URL}/teachers`, {
        ...newTeacher,
        ...credentials,
        created_at
      });

      if (response.data.success) {
        setRegistrationResult({
          success: true,
          message: 'Teacher registered successfully',
          credentials
        });
        fetchAllData();
      }
    } catch (error) {
      setRegistrationResult({
        success: false,
        message: error.response?.data?.message || 'Error registering teacher'
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

  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.includes(searchTerm)
  );

  const filteredTeachers = teachers.filter(teacher =>
    teacher.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.personal_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex gap-4">
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

        {/* Add Teacher Modal */}
        {showAddTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students Table */}
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

          {/* Teachers Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UserX />
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
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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