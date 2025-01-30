import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, BookOpen, Users } from 'lucide-react';
import Swal from 'sweetalert2';

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

  const generateEmailTemplate = (userData, credentials) => {
    const fullName = userData.middleName 
      ? `${userData.firstName} ${userData.middleName} ${userData.lastName}`
      : `${userData.firstName} ${userData.lastName}`;

      return `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
        <!-- Header -->
        <div style="background-color: #003366; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0;">Welcome to ECR Online Grade</h1>
        </div>
    
        <!-- Main Content -->
        <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
          <!-- Greeting -->
          <p style="font-size: 16px; margin: 0 0 24px 0;">
            Dear ${userData.firstName} ${userData.lastName},
          </p>
          
          <p style="font-size: 16px; margin: 0 0 24px 0;">
            Welcome to ECR Online Grade! Below are your login credentials and registration details:
          </p>
          
          <!-- Registration Details -->
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Registration Details</h2>
            <div style="display: grid; grid-gap: 16px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                <span style="color: #4b5563; font-weight: 500;">Student ID:</span>
                <span style="font-weight: 600;">${userData.studentId}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                <span style="color: #4b5563; font-weight: 500;">Full Name:</span>
                <span style="font-weight: 600;">${fullName}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                <span style="color: #4b5563; font-weight: 500;">Course:</span>
                <span style="font-weight: 600;">${userData.course}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                <span style="color: #4b5563; font-weight: 500;">Section:</span>
                <span style="font-weight: 600;">${userData.section}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                <span style="color: #4b5563; font-weight: 500;">Trimester:</span>
                <span style="font-weight: 600;">${userData.trimester}</span>
              </div>
            </div>
          </div>
    
          <!-- Credentials -->
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Login Credentials</h2>
            <div style="display: grid; grid-gap: 16px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                <span style="color: #4b5563; font-weight: 500;">Username:</span>
                <span style="font-weight: 600;">${credentials.username}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                <span style="color: #4b5563; font-weight: 500;">Password:</span>
                <span style="font-weight: 600;">${credentials.password}</span>
              </div>
            </div>
          </div>
          
          <!-- Footer Note -->
          <p style="font-size: 16px; margin: 0 0 24px 0;">
            For a comprehensive view of your academic performance, please log in to the student portal.
          </p>
          
          <!-- Signature -->
          <div style="text-align: left; color: #4b5563;">
            <p style="margin: 0;">Best regards,</p>
            <p style="margin: 8px 0 0 0; font-weight: 600;">ECR Online Grade Team</p>
          </div>
        </div>
      </div>
    `;
    
  };

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
        // Generate the email template with the returned credentials
        const emailHtml = generateEmailTemplate(formData, data.credentials);
        
        // Send the welcome email using the communicate endpoint
        await fetch(`${LOCAL_API_URL}/communicate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'email',
            data: {
              to: formData.email,
              subject: 'Welcome to ECR Online Grade',
              content: emailHtml
            }
          })
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