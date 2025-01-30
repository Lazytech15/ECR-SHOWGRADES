import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Lock, User } from 'lucide-react';
import { useWebSocket } from '../WebSocketManager/Websocketmanager';

const API_URL = 'http://localhost:5000/api';

const StudentSettings = ({ studentData }) => {
  const { isConnected } = useWebSocket();
  const [formData, setFormData] = useState({
    studentId: studentData?.studentId || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    section: studentData?.section || '',
    trimester: studentData?.trimester || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const handleWebSocketMessage = (event) => {
      const data = event.detail;
      if (data.type === 'database_update' && 
          data.changes?.students_update?.includes(studentData?.studentId)) {
        fetchStudentData();
      }
    };

    window.addEventListener('websocket-message', handleWebSocketMessage);
    return () => {
      window.removeEventListener('websocket-message', handleWebSocketMessage);
    };
  }, [studentData?.studentId]);

  const fetchStudentData = async () => {
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-alldata',
          studentId: studentData?.studentId
        }),
      });

      const data = await response.json();
      if (data.success && data.student) {
        setFormData(prev => ({
          ...prev,
          section: data.student.section || '',
          trimester: data.student.trimester || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          studentId: formData.studentId,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          newSection: formData.section,
          newTrimester: formData.trimester
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Settings updated successfully');
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.message || 'Failed to update settings');
      }
    } catch (err) {
      setError('Failed to update settings. Please try again.');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <User size={20} />
            <h2 className="text-xl font-semibold">Account Settings</h2>
          </div>
        </div>
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Trimester</label>
                  <select
                    name="trimester"
                    value={formData.trimester}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select Trimester</option>
                    <option value="1st">1st Trimester</option>
                    <option value="2nd">2nd Trimester</option>
                    <option value="3rd">3rd Trimester</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lock size={20} />
                Change Password
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-700 border rounded-md flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-100 text-green-700 border rounded-md flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentSettings;