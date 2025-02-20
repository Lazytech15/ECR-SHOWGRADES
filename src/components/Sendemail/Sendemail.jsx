import React from 'react';

const API_URL = 'https://ecr-api-connection-database.netlify.app/.netlify/functions/service-database';

export const EmailTemplates = {
  GRADE_NOTIFICATION: 'grade-notification',
  WELCOME_EMAIL: 'welcome-email',
  TEACHER_REGISTRATION: 'teacher-registration'
};

export const sendEmail = async ({ template, data, onProgress, onError }) => {
  try {
    let emailContent;
    let subject;

    switch (template) {
      case EmailTemplates.GRADE_NOTIFICATION:
        ({ content: emailContent, subject } = createGradeNotificationEmail(data));
        break;
      case EmailTemplates.WELCOME_EMAIL:
        ({ content: emailContent, subject } = createWelcomeEmail(data));
        break;
      case EmailTemplates.TEACHER_REGISTRATION:
        ({ content: emailContent, subject } = createTeacherRegistrationEmail(data));
        break;
      default:
        throw new Error('Invalid email template');
    }

    if (onProgress) {
      onProgress({
        teacherId: data.teacherId,
        name: data.teacherName,
        status: 'sending'
      });
    }

    const response = await fetch(`${API_URL}/communicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'email',
        data: {
          to: data.email,
          subject,
          content: emailContent
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || response.statusText);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error('Email sending failed');
    }

    if (onProgress) {
      onProgress({
        teacherId: data.teacherId,
        name: data.teacherName,
        status: 'sent'
      });
    }

    return result;
  } catch (error) {
    if (onError) {
      onError({
        teacherId: data.teacherId,
        name: data.teacherName,
        error: error.message
      });
    }
    throw error;
  }
};

const createGradeNotificationEmail = (data) => {
  const content = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
        <!-- Header -->
        <div style="background-color: #003366; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0;">Academic Performance Update</h1>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
            <!-- Greeting -->
            <p style="font-size: 16px; margin: 0 0 24px 0;">
                Dear ${data.studentName},
            </p>
            
            <p style="font-size: 16px; margin: 0 0 24px 0;">
                We are writing to inform you that your academic records have been updated for the following course:
            </p>
            
            <!-- Course Information -->
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
                <div style="display: grid; grid-gap: 16px;">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                        <span style="color: #4b5563; font-weight: 500;">Course: </span>
                        <span style="font-weight: 600;">${data.courseCode} - (${data.courseDescription})</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                        <span style="color: #4b5563; font-weight: 500;">Academic Year: </span>
                        <span style="font-weight: 600;">${data.academicYear}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                        <span style="color: #4b5563; font-weight: 500;">Academic Term: </span>
                        <span style="font-weight: 600;">${data.academic_term}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                        <span style="color: #4b5563; font-weight: 500;">Section: </span>
                        <span style="font-weight: 600;">${data.section}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                        <span style="color: #4b5563; font-weight: 500;">Faculty: </span>
                        <span style="font-weight: 600;">${data.facultyName}</span>
                    </div>
                </div>
                
                <!-- Grades Section -->
                <div style="margin-top: 24px;">
                    <h2 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">Grade Summary</h2>
                    <div style="display: grid; grid-gap: 12px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #4b5563;">Prelim: </span>
                            <span style="font-weight: 600;">${data.prelimGrade || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #4b5563;">Midterm: </span>
                            <span style="font-weight: 600;">${(data.midtermGrade === 0.00 || data.midtermGrade === '0.00' || data.midtermGrade === 0 || data.midtermGrade === '0') ? '-' : data.midtermGrade}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #4b5563;">Final: </span>
                            <span style="font-weight: 600;">${(data.finalGrade === 0.00 || data.finalGrade ==='0.00' || data.finalGrade === 0 || data.finalGrade ==='0') ? '-' : data.finalGrade}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 8px;">
                            <span style="color: #4b5563;">GWA: </span>
                            <span style="font-weight: 600;">${(data.finalGrade === 0.00 || data.finalGrade ==='0.00' || data.finalGrade === 0 || data.finalGrade ==='0') ? '-' : data.gwa}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #4b5563;">Remark: </span>
                            <span style="font-weight: 600;">${(data.finalGrade === 0.00 || data.finalGrade ==='0.00' || data.finalGrade === 0 || data.finalGrade ==='0') ? '-' : data.remark}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer Note -->
            <p style="font-size: 16px; margin: 0 0 24px 0;">
                For a comprehensive view of your academic performance, please access your complete grade records through the student portal.
            </p>
            
            <!-- Signature -->
            <div style="text-align: left; color: #4b5563;">
                <p style="margin: 0;">Best regards,</p>
                <p style="margin: 8px 0 0 0; font-weight: 600;">ECR Online Grade Team</p>
            </div>
        </div>
    </div>`;

  return {
    content,
    subject: `ECR Online Grade Update Notification - ${data.courseCode}`
  };
};


const createTeacherRegistrationEmail = (data) => {
  const content = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
      <!-- Header -->
      <div style="background-color: #003366; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0;">Welcome to ECR Online Grade System</h1>
      </div>
  
      <!-- Main Content -->
      <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
        <!-- Greeting -->
        <p style="font-size: 16px; margin: 0 0 24px 0;">
          Dear ${data.teacherName},
        </p>
        
        <p style="font-size: 16px; margin: 0 0 24px 0;">
          Welcome to ECR Online Grade System! You have been registered as a teacher. Here are your account details:
        </p>
        
        <!-- Registration Details -->
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Account Information</h2>
          <div style="display: grid; grid-gap: 16px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Teacher ID:</span>
              <span style="font-weight: 600;">${data.teacherId}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Full Name:</span>
              <span style="font-weight: 600;">${data.teacherName}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Email:</span>
              <span style="font-weight: 600;">${data.email}</span>
            </div>
          </div>
        </div>
  
        <!-- Login Credentials -->
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Login Credentials</h2>
          <div style="display: grid; grid-gap: 16px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Username:</span>
              <span style="font-weight: 600;">${data.username}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Password:</span>
              <span style="font-weight: 600;">${data.password}</span>
            </div>
          </div>
          
          <div style="margin-top: 16px; padding: 12px; background-color: #fff4e5; border-radius: 4px;">
            <p style="margin: 0; color: #b45309; font-size: 14px;">
              For security reasons, please change your password after your first login.
            </p>
          </div>
        </div>
        
        <!-- Next Steps -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Next Steps:</h3>
          <ol style="margin: 0; padding-left: 24px; color: #4b5563;">
            <li style="margin-bottom: 8px;">Visit the ECR Online Grade Portal at <a href="https://mailer.cyberdyne.top/" style="color: #2563eb;">ECR PORTAL</a></li>
            <li style="margin-bottom: 8px;">Log in using your username and password provided above</li>
            <li style="margin-bottom: 8px;">Change your password to ensure account security</li>
            <li>Set up your teacher profile if required</li>
          </ol>
        </div>
        
        <!-- Footer Note -->
        <p style="font-size: 16px; margin: 0 0 24px 0; color: #4b5563;">
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>
        
        <!-- Signature -->
        <div style="text-align: left; color: #4b5563;">
          <p style="margin: 0;">Best regards,</p>
          <p style="margin: 8px 0 0 0; font-weight: 600;">ECR Online Grade Team</p>
        </div>
      </div>
    </div>
  `;

  return {
    content,
    subject: 'Welcome to ECR Online Grade System - Teacher Registration'
  };
};

const createWelcomeEmail = (data) => {
  const content = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
      <!-- Header -->
      <div style="background-color: #003366; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0;">Welcome to ECR Online Grade</h1>
      </div>
  
      <!-- Main Content -->
      <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
        <!-- Greeting -->
        <p style="font-size: 16px; margin: 0 0 24px 0;">
          Dear ${data.fullName},
        </p>
        
        <p style="font-size: 16px; margin: 0 0 24px 0;">
          Welcome to ECR Online Grade! Here are your account details and registration information:
        </p>
        
        <!-- Registration Details -->
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Account Information</h2>
          <div style="display: grid; grid-gap: 16px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Student ID:</span>
              <span style="font-weight: 600;">${data.studentId}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Full Name:</span>
              <span style="font-weight: 600;">${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Course:</span>
              <span style="font-weight: 600;">${data.course}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Section:</span>
              <span style="font-weight: 600;">${data.section}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Academic Term:</span>
              <span style="font-weight: 600;">${data.academic_term}</span>
            </div>
          </div>
        </div>
  
        <!-- Login Credentials -->
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Login Credentials</h2>
          <div style="display: grid; grid-gap: 16px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Username:</span>
              <span style="font-weight: 600;">${data.username}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
              <span style="color: #4b5563; font-weight: 500;">Password:</span>
              <span style="font-weight: 600;">${data.password}</span>
            </div>
          </div>
          
          <div style="margin-top: 16px; padding: 12px; background-color: #fff4e5; border-radius: 4px;">
            <p style="margin: 0; color: #b45309; font-size: 14px;">
              For security reasons, please change your password after your first login.
            </p>
          </div>
        </div>
        
        <!-- Next Steps -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Next Steps:</h3>
          <ol style="margin: 0; padding-left: 24px; color: #4b5563;">
            <li style="margin-bottom: 8px;">Visit the ECR Online Grade Portal at <a href="https://mailer.cyberdyne.top/" style="color: #2563eb;">ECR PORTAL</a></li>
            <li style="margin-bottom: 8px;">Log in using your username and password provided above</li>
            <li style="margin-bottom: 8px;">Change your password to ensure account security</li>
            <li>Complete your student profile if required</li>
          </ol>
        </div>
        
        <!-- Footer Note -->
        <p style="font-size: 16px; margin: 0 0 24px 0; color: #4b5563;">
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>
        
        <!-- Signature -->
        <div style="text-align: left; color: #4b5563;">
          <p style="margin: 0;">Best regards,</p>
          <p style="margin: 8px 0 0 0; font-weight: 600;">ECR Online Grade Team</p>
        </div>
      </div>
    </div>
  `;

  return {
    content,
    subject: 'Welcome to ECR Online Grade - Your Account Details'
  };
};

export default sendEmail;