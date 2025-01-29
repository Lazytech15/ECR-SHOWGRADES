// LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';

const LOCAL_API_URL = 'http://localhost:5000';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${LOCAL_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: username, // The backend will check both username and email
          password: password 
        })
      });

      const data = await response.json();

      if (data.success) {
        const userInfo = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          ...(data.user.student_id && { studentId: data.user.student_id })
        };

        // Store user info in appropriate storage key based on role
        if (data.user.role === 'student') {
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
        } else {
          localStorage.setItem('teacherInfo', JSON.stringify(userInfo));
        }

        onLogin(true, data.user.role);
        navigate('/dashboard');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: data.message || 'Login failed. Please check your email and password then try again.',
          confirmButtonColor: '#3B82F6'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: 'An error occurred while trying to log in. Please try again.',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome Back</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Username or Email" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
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
            <Link to="/register" className="ml-2 text-blue-500 hover:text-blue-600">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;