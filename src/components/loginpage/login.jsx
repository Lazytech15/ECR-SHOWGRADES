//login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = 'https://project-to-ipt01.netlify.app/.netlify/functions/api';
const LOCAL_API_URL = 'http://localhost:5000';

const LoginPage = ({ onLogin }) => {
  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [upass, setUpass] = useState('');
  const [dashboardType, setDashboardType] = useState(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // First, try external API (for student)
      const externalResponse = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          institutionalEmail, 
          upass 
        })
      });

      const externalData = await externalResponse.json();

      // If external API (student) is successful
      if (externalData && externalData.success) {
        // Store student information
        const studentInfo = {
          id: externalData.user.id,
          email: externalData.user.email,
          role: 'student',
          studentId: externalData.user.studentId
        };
        localStorage.setItem('userInfo', JSON.stringify(studentInfo));
        setDashboardType('student');
        onLogin(true, 'student');
        navigate('/dashboard');
        return;
      } else {
        console.error('Login error: External data is missing or invalid');
      }

      // If external API fails, try local MySQL endpoint (for teacher)
      const localResponse = await fetch(`${LOCAL_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: institutionalEmail, 
          password: upass 
        })
      });

      const localData = await localResponse.json();

      // If local API (teacher) is successful
      if (localData && localData.success) {
        const teacher_Info = {
          id: localData.user.id,
          email: localData.user.email,
          name: localData.user.teacher_name,
          role: 'teacher'
        };
        localStorage.setItem('teacherInfo', JSON.stringify(teacher_Info));
        setDashboardType('teacher');
        onLogin(true, 'teacher');
        navigate('/dashboard');
        return;
      }

      // If both attempts fail
      Swal.fire({
        icon: 'error',
        title: 'User Not Found',
        text: 'Please check your email and password.',
        confirmButtonColor: '#3B82F6'
      });
      onLogin(false);

    } catch (error) {
      console.error('Login error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: 'An error occurred while trying to log in. Please try again.',
        confirmButtonColor: '#3B82F6'
      });
      onLogin(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome Back</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="username" 
              value={institutionalEmail} 
              onChange={(e) => setInstitutionalEmail(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={upass} 
              onChange={(e) => setUpass(e.target.value)} 
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 rounded text-blue-500 focus:ring-blue-400" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-blue-500 hover:text-blue-600 text-sm">Forgot password?</a>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account? 
            <a href="#" className="ml-2 text-blue-500 hover:text-blue-600">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;