import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, RefreshCw, Search, Edit, GraduationCap, LogOut, Users, BookOpen } from 'lucide-react';
import axios from 'axios';
import sendEmail, { EmailTemplates } from '../Sendemail/Sendemail';
import { StudentEditModal, TeacherEditModal, GradeEditModal } from '../UpdateEditData/EditModal';

const AdminDashboard = ({ onLogout }) => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [newTeacher, setNewTeacher] = useState({
    teacher_id: '',
    teacher_name: '',
    personal_email: '',
  });
  const [operationStatus, setOperationStatus] = useState({
    type: null, // 'delete' | 'update' | null
    items: [], // array of items being processed
    completed: [], // array of completed items
    error: null
  });
  const [registrationResult, setRegistrationResult] = useState(null);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingGrade, setEditingGrade] = useState(null);

  const API_BASE_URL = 'https://ecr-api-connection-database.netlify.app/.netlify/functions/service-database';

  useEffect(() => {
    fetchAllData();
  }, []);

  const removeDuplicateGrades = (grades) => {
    // Create a map to store the latest entry for each student-course combination
    const latestGrades = new Map();
    
    // Sort grades by upload timestamp (assuming there's a timestamp field)
    // If no timestamp exists, we'll consider the order they appear in the array
    grades.forEach((grade) => {
      const key = `${grade.student_num}-${grade.course_code}`;
      
      if (!latestGrades.has(key) || 
          (grade.timestamp && latestGrades.get(key).timestamp < grade.timestamp)) {
        latestGrades.set(key, grade);
      }
    });
    
    // Convert map values back to array
    return Array.from(latestGrades.values());
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get-alldata'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Sort students by ID
        const sortedStudents = (data.students || []).sort((a, b) => 
          a.student_id.localeCompare(b.student_id)
        );
        
        // Sort teachers by ID
        const sortedTeachers = (data.teachers || []).sort((a, b) => 
          a.teacher_id.localeCompare(b.teacher_id)
        );
        
        // Remove duplicates and sort grades
        const uniqueGrades = removeDuplicateGrades(data.grades || []);
        const sortedGrades = uniqueGrades.sort((a, b) => {
          const compareStudent = a.student_num.localeCompare(b.student_num);
          if (compareStudent !== 0) return compareStudent;
          return a.course_code.localeCompare(b.course_code);
        });

        setStudents(sortedStudents);
        setTeachers(sortedTeachers);
        setGrades(sortedGrades);
      } else {
        console.error('Failed to fetch data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    setOperationStatus({
      type: 'delete',
      items: [studentId],
      completed: [],
      error: null
    });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete-student',
          studentId: studentId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setOperationStatus(prev => ({
          ...prev,
          completed: [...prev.completed, studentId]
        }));
        setStudents(prev => prev.filter(student => student.student_id !== studentId));
      }
    } catch (error) {
      setOperationStatus(prev => ({
        ...prev,
        error: `Failed to delete student: ${error.message}`
      }));
    } finally {
      setTimeout(() => {
        setOperationStatus({ type: null, items: [], completed: [], error: null });
      }, 2000);
    }
  };

  const handleBatchDeleteStudents = async () => {
    if (!selectedStudents.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedStudents.length} selected students?`)) return;
    
    setOperationStatus({
      type: 'delete',
      items: selectedStudents,
      completed: [],
      error: null
    });
    
    for (const studentId of selectedStudents) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'delete-student',
            studentId: studentId
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setOperationStatus(prev => ({
            ...prev,
            completed: [...prev.completed, studentId]
          }));
          setStudents(prev => prev.filter(student => student.student_id !== studentId));
        }
      } catch (error) {
        setOperationStatus(prev => ({
          ...prev,
          error: `Failed to delete some students: ${error.message}`
        }));
        break;
      }
    }
    
    setSelectedStudents([]);
    setTimeout(() => {
      setOperationStatus({ type: null, items: [], completed: [], error: null });
    }, 2000);
  };

  const handleSelectAllStudents = (e) => {
    if (e.target.checked) {
      setSelectedStudents(filteredStudents.map(student => student.student_id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete-teacher',
          teacherId: teacherId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchAllData();
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const handleBatchDeleteTeachers = async () => {
    if (!selectedTeachers.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedTeachers.length} selected teachers?`)) return;
    
    setLoading(true);
    try {
      const deletePromises = selectedTeachers.map(teacherId => 
        fetch(`${API_BASE_URL}/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'delete-teacher',
            teacherId: teacherId
          })
        }).then(res => res.json())
      );
      
      await Promise.all(deletePromises);
      setSelectedTeachers([]);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting multiple teachers:', error);
    }
    setLoading(false);
  };

    // Selection handlers for teachers
    const handleCheckTeacher = (teacherId) => {
      setSelectedTeachers(prev => 
        prev.includes(teacherId)
          ? prev.filter(id => id !== teacherId)
          : [...prev, teacherId]
      );
    };
  
    const handleSelectAllTeachers = (e) => {
      if (e.target.checked) {
        setSelectedTeachers(filteredTeachers.map(teacher => teacher.teacher_id));
      } else {
        setSelectedTeachers([]);
      }
    };

    const handleDeleteGrade = async (ecrName, studentNum, courseCode) => {
      if (!confirm('Are you sure you want to delete this grade entry?')) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'delete-grade',
            ecr_name: ecrName,
            student_num: studentNum,
            course_code: courseCode
          })
        });
        
        const data = await response.json();
        if (data.success) {
          fetchAllData();
        } else {
          console.error('Failed to delete grade:', data.message);
        }
      } catch (error) {
        console.error('Error deleting grade:', error);
      }
    };

    const handleDeleteMultipleGrades = async () => {
      if (!selectedGrades.length) return;
      if (!confirm(`Are you sure you want to delete ${selectedGrades.length} selected grades?`)) return;
    
      setLoading(true);
      setOperationStatus({
        type: 'delete',
        items: selectedGrades,
        completed: [],
        error: null
      });
    
      try {
        // Map the selected grade IDs to their full grade objects
        const gradesToDelete = selectedGrades.map(ecrName => {
          const gradeData = grades.find(g => g.ecr_name === ecrName);
          if (!gradeData) {
            throw new Error(`Could not find grade data for ${ecrName}`);
          }
          return {
            ecr_name: gradeData.ecr_name,
            student_num: gradeData.student_num,
            course_code: gradeData.course_code
          };
        });
    
        // Process in batches of 10
        const batchSize = 10;
        for (let i = 0; i < gradesToDelete.length; i += batchSize) {
          const batch = gradesToDelete.slice(i, i + batchSize);
          
          console.log('Sending batch for deletion:', batch); // Debug log
    
          const response = await fetch(`${API_BASE_URL}/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'delete-multiple-grades',
              grades: batch
            })
          });
    
          const data = await response.json();
          
          if (data.success) {
            // Mark successful deletions
            const deletedEcrNames = batch.map(g => g.ecr_name);
            setOperationStatus(prev => ({
              ...prev,
              completed: [...prev.completed, ...deletedEcrNames]
            }));
    
            // Remove deleted grades from state
            setGrades(prevGrades => 
              prevGrades.filter(grade => !deletedEcrNames.includes(grade.ecr_name))
            );
          } else {
            throw new Error(data.message || 'Failed to delete grades');
          }
        }
    
        // Clear selections after successful deletion
        setSelectedGrades([]);
    
      } catch (error) {
        console.error('Error in batch deletion:', error);
        setOperationStatus(prev => ({
          ...prev,
          error: `Failed to delete grades: ${error.message}`
        }));
      } finally {
        setLoading(false);
        await fetchAllData(); // Refresh data
        
        // Clear operation status after delay
        setTimeout(() => {
          setOperationStatus({ type: null, items: [], completed: [], error: null });
        }, 2000);
      }
    };   

    const handleCheckGrade = (ecrName) => {
      if (!ecrName) {
        console.warn('Attempted to check grade with null ecr_name');
        return;
      }
      
      setSelectedGrades(prev => 
        prev.includes(ecrName)
          ? prev.filter(name => name !== ecrName)
          : [...prev, ecrName]
      );
    };

    const handleSelectAllGrades = (e) => {
      if (e.target.checked) {
        const validGrades = filteredGrades
          .filter(grade => grade.ecr_name) // Only select grades with valid ecr_name
          .map(grade => grade.ecr_name);
        setSelectedGrades(validGrades);
      } else {
        setSelectedGrades([]);
      }
    };

    const handleCheckStudent = (studentId) => {
      setSelectedStudents(prev => 
        prev.includes(studentId)
          ? prev.filter(id => id !== studentId)
          : [...prev, studentId]
      );
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
  // Filter functions with sorting preserved
  const filteredStudents = students
    .filter(student => 
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id?.includes(searchTerm)
    );

  const filteredTeachers = teachers
    .filter(teacher =>
      teacher.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.personal_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredGrades = grades
    .filter(grade => {
      const matchesSection = !selectedSection || grade.section === selectedSection;
      const matchesSubject = !selectedSubject || grade.course_code === selectedSubject;
      const matchesSearch = !searchTerm || 
        grade.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.student_num?.includes(searchTerm);
      return matchesSection && matchesSubject && matchesSearch;
    });

    const renderStudentsTable = () => (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap />
            Students
          </h2>
          {selectedStudents.length > 0 && (
            <button
              onClick={handleBatchDeleteStudents}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mt-2"
            >
              <Trash2 size={20} />
              Delete Selected ({selectedStudents.length})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAllStudents}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trimester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student, index) => (
                <tr key={student.student_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.student_id)}
                      onChange={() => handleCheckStudent(student.student_id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.student_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.course}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.section}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.trimester}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.password}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.student_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  
    // Update the renderTeachersTable function to include checkboxes
    const renderTeachersTable = () => (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users />
            Teachers
          </h2>
          {selectedTeachers.length > 0 && (
            <button
              onClick={handleBatchDeleteTeachers}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mt-2"
            >
              <Trash2 size={20} />
              Delete Selected ({selectedTeachers.length})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <input
                    type="checkbox"
                    checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
                    onChange={handleSelectAllTeachers}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTeachers.map((teacher, index) => (
                <tr key={teacher.teacher_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTeachers.includes(teacher.teacher_id)}
                      onChange={() => handleCheckTeacher(teacher.teacher_id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.teacher_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.personal_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.password}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingTeacher(teacher)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher.teacher_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
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
          
          {/* Filters and Actions Section */}
          <div className="mt-4 flex flex-wrap gap-4">
            {/* Section Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                onChange={(e) => setSelectedSection(e.target.value)}
                value={selectedSection}
              >
                <option value="">All Sections</option>
                {Array.from(new Set(grades.map(grade => grade.section)))
                  .sort()
                  .map((section) => (
                    <option key={section} value={section}>{section}</option>
                  ))
                }
              </select>
            </div>
    
            {/* Subject Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                onChange={(e) => setSelectedSubject(e.target.value)}
                value={selectedSubject}
              >
                <option value="">All Subjects</option>
                {Array.from(new Set(grades.map(grade => grade.course_code)))
                  .sort()
                  .map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))
                }
              </select>
            </div>
    
            {/* Batch Delete Button */}
            {selectedGrades.length > 0 && !loading && (
              <div className="flex items-end">
                <button
                  onClick={handleDeleteMultipleGrades}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  disabled={loading}
                >
                  <Trash2 size={20} />
                  Delete Selected ({selectedGrades.length})
                </button>
              </div>
            )}
          </div>
        </div>
    
        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedGrades.length === filteredGrades.length && filteredGrades.length > 0}
                    onChange={handleSelectAllGrades}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Term</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prelim Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Midterm Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Units</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ECR Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="21" className="px-6 py-4 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="animate-spin mr-2" size={20} />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan="21" className="px-6 py-4 text-center text-gray-500">
                    No grades found
                  </td>
                </tr>
              ) : (
                filteredGrades.map((grade, index) => (
                  <tr 
                    key={`${grade.student_num}-${grade.course_code}-${grade.timestamp || index}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes(grade.ecr_name)}
                        onChange={() => handleCheckGrade(grade.ecr_name)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.student_num}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.student_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.academic_year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.academic_term}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.section}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.day}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.course_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.course_description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.prelim_grade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.midterm_grade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.final_grade}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      grade.remark === 'PASSED' ? 'text-green-600' : 
                      grade.remark === 'FAILED' ? 'text-red-600' : 
                      grade.remark === 'INCOMPLETE' ? 'text-yellow-600' :
                      'text-gray-900'
                    }`}>
                      {grade.remark}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.credit_units}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.faculty_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.faculty_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.ecr_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingGrade(grade)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit grade"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteGrade(grade.ecr_name, grade.student_num, grade.course_code)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete grade"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
    
        {/* Results Summary */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <p className="text-sm text-gray-600">
            Showing {filteredGrades.length} of {grades.length} grades
            {selectedSection && ` in section ${selectedSection}`}
            {selectedSubject && ` for ${selectedSubject}`}
          </p>
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

        {editingStudent && (
          <StudentEditModal
            student={editingStudent}
            onClose={() => setEditingStudent(null)}
            onUpdate={() => {
              fetchAllData();
              setEditingStudent(null);
            }}
          />
        )}

        {editingTeacher && (
          <TeacherEditModal
            teacher={editingTeacher}
            onClose={() => setEditingTeacher(null)}
            onUpdate={() => {
              fetchAllData();
              setEditingTeacher(null);
            }}
          />
        )}

        {editingGrade && (
          <GradeEditModal
            grade={editingGrade}
            onClose={() => setEditingGrade(null)}
            onUpdate={() => {
              fetchAllData();
              setEditingGrade(null);
            }}
          />
        )}

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