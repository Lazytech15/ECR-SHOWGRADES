import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import sendEmail,{ EmailTemplates } from '../Sendemail/Sendemail';

// Modal Backdrop Component
const ModalBackdrop = ({ onClose }) => (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
    onClick={onClose}
  />
);

// Student Edit Modal Component
const StudentEditModal = ({ student, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
      newPassword: '',
      newSection: student.section || '',
      newTrimester: student.trimester || '',
      newEmail: student.email || '',
      newCourse: student.course || ''
    });
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch('https://ecr-api-connection-database.netlify.app/.netlify/functions/service-database/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'update-student',
            studentId: student.student_id,
            ...formData
          })
        });
  
        const data = await response.json();
        if (data.success) {
          // Send email notification
          await sendEmail({
            template: EmailTemplates.STUDENT_UPDATE,
            data: {
              email: formData.newEmail || student.email,
              studentName: student.full_name,
              updates: {
                section: formData.newSection !== student.section ? formData.newSection : null,
                trimester: formData.newTrimester !== student.trimester ? formData.newTrimester : null,
                course: formData.newCourse !== student.course ? formData.newCourse : null,
                passwordChanged: !!formData.newPassword,
                newPassword: formData.newPassword
              }
            }
          });
          
          onUpdate();
          onClose();
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error('Error updating student:', error);
        alert('Failed to update student');
      }
    };
  
    return (
      <>
        <ModalBackdrop onClose={onClose} />
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Student: {student.full_name}</h2>
              <p className="text-sm text-gray-500 mt-1">Update student information below</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  placeholder="Leave blank to keep current password"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Other fields remain the same */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <input
                  type="text"
                  value={formData.newSection}
                  onChange={(e) => setFormData({...formData, newSection: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trimester</label>
                <input
                  type="text"
                  value={formData.newTrimester}
                  onChange={(e) => setFormData({...formData, newTrimester: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.newEmail}
                  onChange={(e) => setFormData({...formData, newEmail: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Course</label>
                <input
                  type="text"
                  value={formData.newCourse}
                  onChange={(e) => setFormData({...formData, newCourse: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  };

// Teacher Edit Modal Component
const TeacherEditModal = ({ teacher, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
      teacherName: teacher.teacher_name || '',
      personalEmail: teacher.personal_email || '',
      newPassword: ''
    });
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch('https://ecr-api-connection-database.netlify.app/.netlify/functions/service-database/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'update-teacher',
            teacherId: teacher.teacher_id,
            ...formData
          })
        });
  
        const data = await response.json();
        if (data.success) {
          // Send email notification
          await sendEmail({
            template: EmailTemplates.TEACHER_UPDATE,
            data: {
              personalEmail: formData.personalEmail,
              teacherName: formData.teacherName,
              updates: {
                nameChanged: formData.teacherName !== teacher.teacher_name,
                emailChanged: formData.personalEmail !== teacher.personal_email,
                passwordChanged: !!formData.newPassword,
                newPassword: formData.newPassword
              }
            }
          });
          
          onUpdate();
          onClose();
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error('Error updating teacher:', error);
        alert('Failed to update teacher');
      }
    };
  
    return (
      <>
        <ModalBackdrop onClose={onClose} />
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Teacher: {teacher.teacher_name}</h2>
              <p className="text-sm text-gray-500 mt-1">Update teacher information below</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.teacherName}
                  onChange={(e) => setFormData({...formData, teacherName: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => setFormData({...formData, personalEmail: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  placeholder="Leave blank to keep current password"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  };

// Grade Edit Modal Component
const GradeEditModal = ({ grade, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
      prelimGrade: grade.prelim_grade || '',
      midtermGrade: grade.midterm_grade || '',
      finalGrade: grade.final_grade || '',
      remark: grade.remark || '',
      email: grade.email || ''
    });
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch('https://ecr-api-connection-database.netlify.app/.netlify/functions/service-database/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'update-grade',
            ecrName: grade.ecr_name,
            studentNum: grade.student_num,
            courseCode: grade.course_code,
            ...formData
          })
        });
  
        const data = await response.json();
        if (data.success) {
          // Send email notification
          await sendEmail({
            template: EmailTemplates.GRADE_NOTIFICATION,
            data: {
              email: grade.email,
              studentName: grade.student_name,
              courseCode: grade.course_code,
              courseDescription: grade.course_description,
              academicYear: grade.academic_year,
              academic_term: grade.academic_term,
              section: grade.section,
              facultyName: grade.faculty_name,
              prelimGrade: formData.prelimGrade,
              midtermGrade: formData.midtermGrade,
              finalGrade: formData.finalGrade,
              gwa: calculateGWA(formData),
              remark: formData.remark
            }
          });
          
          onUpdate();
          onClose();
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error('Error updating grade:', error);
        alert('Failed to update grade');
      }
    };
  
    // Helper function to calculate GWA
    const calculateGWA = (grades) => {
      const validGrades = [
        parseFloat(grades.prelimGrade) || 0,
        parseFloat(grades.midtermGrade) || 0,
        parseFloat(grades.finalGrade) || 0
      ].filter(grade => grade > 0);
  
      if (validGrades.length === 0) return 0;
      return (validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length).toFixed(2);
    };

  return (
    <>
      <ModalBackdrop onClose={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Grade for {grade.student_name}</h2>
            <p className="text-sm text-gray-500 mt-1">Update grade information below</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prelim Grade</label>
              <input
                type="number"
                step="0.01"
                value={formData.prelimGrade}
                onChange={(e) => setFormData({...formData, prelimGrade: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Midterm Grade</label>
              <input
                type="number"
                step="0.01"
                value={formData.midtermGrade}
                onChange={(e) => setFormData({...formData, midtermGrade: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Final Grade</label>
              <input
                type="number"
                step="0.01"
                value={formData.finalGrade}
                onChange={(e) => setFormData({...formData, finalGrade: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Remark</label>
              <select
                value={formData.remark}
                onChange={(e) => setFormData({...formData, remark: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PASSED">PASSED</option>
                <option value="FAILED">FAILED</option>
                <option value="INCOMPLETE">INCOMPLETE</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export { StudentEditModal, TeacherEditModal, GradeEditModal };