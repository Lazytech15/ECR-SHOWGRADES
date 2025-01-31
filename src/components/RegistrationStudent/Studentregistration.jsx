import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, BookOpen, Users } from 'lucide-react';
import Swal from 'sweetalert2';
import { sendEmail, EmailTemplates } from '../Sendemail/Sendemail';

const LOCAL_API_URL = 'http://localhost:5000/api';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    course: '',
    section: '',
    trimester: '',
    email: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // First, send the registration data
      const response = await fetch(`${LOCAL_API_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'register',
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        // Send welcome email using the sendEmail utility
        await sendEmail({
          template: EmailTemplates.WELCOME_EMAIL,
          data: {
            ...formData,
            username: data.credentials.username,
            password: data.credentials.password
          }
        });

        Swal.fire({
          icon: 'success',
          title: 'Registration Successful',
          html: `
            Your account has been created!<br>
            Username: <strong>${data.credentials.username}</strong><br>
            Password: <strong>${data.credentials.password}</strong><br><br>
            These credentials have been sent to your email.
          `,
          confirmButtonColor: '#3B82F6'
        }).then(() => {
          navigate('/login');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: data.message || 'Registration failed. Please try again.',
          confirmButtonColor: '#3B82F6'
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: 'An error occurred during registration. Please try again.',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Student Registration</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              name="studentId"
              placeholder="Student ID"
              value={formData.studentId}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input 
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="relative">
              <input 
                type="text"
                name="middleName"
                placeholder="Middle Name (Optional)"
                value={formData.middleName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="relative">
              <input 
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              name="course"
              placeholder="Course"
              value={formData.course}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              name="section"
              placeholder="Section"
              value={formData.section}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="relative">
            <select
              name="trimester"
              value={formData.trimester}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Trimester</option>
              <option value="1st">1st Trimester</option>
              <option value="2nd">2nd Trimester</option>
              <option value="3rd">3rd Trimester</option>
            </select>
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Register
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?
            <Link to="/login" className="ml-2 text-blue-500 hover:text-blue-600">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;