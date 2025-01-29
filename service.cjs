const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'thezombie123',
  database: 'show_my_grades'
});

connection.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Create email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'projectipt00@gmail.com',
    pass: 'vxbx lnmy dxiy znlp'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// New endpoint for sending emails
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    const mailOptions = {
      from: '"ECR Online Grade <projectipt00@gmail.com>',
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Continuing the login endpoint...
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const sanitizedInput = email.trim().toLowerCase();

    // First check students table
    connection.query(
      'SELECT * FROM students WHERE LOWER(username) = ? OR LOWER(email) = ?',
      [sanitizedInput, sanitizedInput],
      async (error, results) => {
        if (error) {
          console.error('Query Error:', error);
          return res.status(500).json({ success: false, message: 'Database query error' });
        }

        if (results.length > 0) {
          const student = results[0];
          try {
            const match = await bcrypt.compare(password, student.password);
            if (match) {
              return res.json({
                success: true,
                message: 'Login successful',
                user: {
                  id: student.id,
                  email: student.email,
                  student_id: student.student_id,
                  name: student.full_name,
                  role: 'student'
                }
              });
            }
          } catch (compareError) {
            console.error('Bcrypt Compare Error:', compareError);
          }
        }

        // If no student found or password doesn't match, check teachers table
        connection.query(
          'SELECT * FROM users WHERE LOWER(TRIM(email)) = ?',
          [sanitizedInput],
          async (teacherError, teacherResults) => {
            if (teacherError) {
              console.error('Query Error:', teacherError);
              return res.status(500).json({ success: false, message: 'Database query error' });
            }

            if (teacherResults.length > 0) {
              const teacher = teacherResults[0];
              try {
                const match = await bcrypt.compare(password, teacher.password);
                if (match) {
                  return res.json({
                    success: true,
                    message: 'Login successful',
                    user: {
                      id: teacher.id,
                      email: teacher.email,
                      name: teacher.teacher_name,
                      role: 'teacher'
                    }
                  });
                }
              } catch (compareError) {
                console.error('Bcrypt Compare Error:', compareError);
              }
            }

            // If no matching user found in either table
            return res.status(401).json({ 
              success: false, 
              message: 'Login failed. Please check your email and password then try again.' 
            });
          }
        );
      }
    );
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/upload-grades', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      const prelim = parseFloat(data.PRELIM_GRADE) || 0;
      const midterm = parseFloat(data.MIDTERM_GRADE) || 0;
      const final = parseFloat(data.FINAL_GRADE) || 0;
      
      const gwa = (prelim + midterm + final) / 3;
      
      let remark = 'INC';
      if (midterm && final) {
        const passingGrade = 3.00;
        remark = gwa <= passingGrade ? 'PASSED' : 'FAILED';
      }

      data.GWA = gwa.toFixed(2);
      data.REMARK = remark;
      
      results.push(data);
    })
    .on('end', async () => {
      try {
        for (const row of results) {
          const checkSql = `
            SELECT id FROM grades 
            WHERE student_num = ? 
            AND course_code = ? 
            AND academic_year = ? 
            AND trimester = ?
            AND faculty_id = ?
          `;

          const [existingRecords] = await connection.promise().query(checkSql, [
            row.STUDENT_NUM,
            row.COURSE_CODE,
            row.ACADEMIC_YEAR,
            row.TRIMESTER,
            row.FACULTY_ID
          ]);

          let sql;
          let values;

          if (existingRecords.length > 0) {
            sql = `
              UPDATE grades SET
                student_name = ?,
                section = ?,
                day = ?,
                time = ?,
                course_description = ?,
                email = ?,
                prelim_grade = COALESCE(?, prelim_grade),
                midterm_grade = COALESCE(?, midterm_grade),
                final_grade = COALESCE(?, final_grade),
                gwa = ?,
                remark = ?,
                credit_units = ?,
                faculty_name = ?,
                ecr_name = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE student_num = ?
                AND course_code = ?
                AND academic_year = ?
                AND trimester = ?
                AND faculty_id = ?
            `;

            values = [
              row.STUDENT_NAME,
              row.SECTION,
              row.DAY,
              row.TIME,
              row.COURSE_DESCRIPTION,
              row.EMAIL,
              row.PRELIM_GRADE || null,
              row.MIDTERM_GRADE || null,
              row.FINAL_GRADE || null,
              row.GWA,
              row.REMARK,
              row.CREDIT_UNITS,
              row.FACULTY_NAME,
              row.ECR_NAME,
              row.STUDENT_NUM,
              row.COURSE_CODE,
              row.ACADEMIC_YEAR,
              row.TRIMESTER,
              row.FACULTY_ID
            ];
          } else {
            sql = `
              INSERT INTO grades (
                student_num, student_name, academic_year, trimester, section,
                day, time, course_code, course_description, email,
                prelim_grade, midterm_grade, final_grade, gwa, remark,
                credit_units, faculty_name, faculty_id, ecr_name
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            values = [
              row.STUDENT_NUM,
              row.STUDENT_NAME,
              row.ACADEMIC_YEAR,
              row.TRIMESTER,
              row.SECTION,
              row.DAY,
              row.TIME,
              row.COURSE_CODE,
              row.COURSE_DESCRIPTION,
              row.EMAIL,
              row.PRELIM_GRADE || null,
              row.MIDTERM_GRADE || null,
              row.FINAL_GRADE || null,
              row.GWA,
              row.REMARK,
              row.CREDIT_UNITS,
              row.FACULTY_NAME,
              row.FACULTY_ID,
              row.ECR_NAME
            ];
          }

          await connection.promise().query(sql, values);
        }

        fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          message: 'Grades uploaded and updated successfully',
          rowsAffected: results.length
        });
      } catch (error) {
        console.error('Upload Error:', error);
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
          success: false,
          message: 'Error uploading grades'
        });
      }
    });
});

app.get('/teacher-grades', (req, res) => {
  const teacherId = req.query.teacher_id;

  connection.query(
    'SELECT * FROM grades WHERE faculty_id = ? ORDER BY student_num, course_code',
    [teacherId],
    (error, results) => {
      if (error) {
        console.error('Query Error:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching grades' 
        });
      }

      res.json({ 
        success: true, 
        grades: results 
      });
    }
  );
});

app.get('/student-grades/:studentNum', (req, res) => {
  const { studentNum } = req.params;
  
  connection.query(
    'SELECT * FROM grades WHERE student_num = ?',
    [studentNum],
    (error, results) => {
      if (error) {
        console.error('Query Error:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching grades' 
        });
      }

      res.json({ 
        success: true, 
        grades: results 
      });
    }
  );
});

app.get('/student/:studentId', (req, res) => {
  const { studentId } = req.params;
  
  const query = `
    SELECT s.*, g.trimester as current_trimester 
    FROM students s
    LEFT JOIN grades g ON s.student_id = g.student_num
    WHERE s.student_id = ?
    ORDER BY g.created_at DESC
    LIMIT 1
  `;
  
  connection.query(query, [studentId], (error, results) => {
    if (error) {
      console.error('Query Error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching student data' 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const studentData = {
      id: results[0].id,
      studentId: results[0].student_id,
      name: results[0].full_name,
      email: results[0].email,
      course: results[0].course,
      section: results[0].section,
      trimester: results[0].current_trimester || results[0].trimester
    };

    res.json({
      success: true,
      student: studentData
    });
  });
});

// Create students table SQL
const createStudentsTable = `
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50),
  last_name VARCHAR(50) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  course VARCHAR(50) NOT NULL,
  section VARCHAR(20) NOT NULL,
  trimester ENUM('1st', '2nd', '3rd') NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

// Execute table creation
connection.query(createStudentsTable, (err) => {
  if (err) {
    console.error('Error creating students table:', err);
    return;
  }
  console.log('Students table created or already exists');
});

// Generate username function
function generateUsername(firstName, lastName, studentId) {
  const firstPart = firstName.toLowerCase().substring(0, 2);
  const lastPart = lastName.toLowerCase().substring(0, 2);
  const idPart = studentId.slice(-4);
  return `${firstPart}${lastPart}${idPart}`;
}

// Generate password function
function generatePassword() {
  const length = 10;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

app.post('/register-student', async (req, res) => {
  try {
    const {
      studentId,
      firstName,
      middleName,
      lastName,
      course,
      section,
      trimester,
      email
    } = req.body;

    // Create full name
    const fullName = middleName 
      ? `${firstName} ${middleName} ${lastName}`
      : `${firstName} ${lastName}`;

    // Generate username and password
    const username = generateUsername(firstName, lastName, studentId);
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Check if student ID or email already exists
    const checkExisting = 'SELECT * FROM students WHERE student_id = ? OR email = ?';
    connection.query(checkExisting, [studentId, email], async (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Student ID or email already registered' 
        });
      }

      // Insert new student
      const insertQuery = `
        INSERT INTO students (
          student_id, first_name, middle_name, last_name, full_name,
          course, section, trimester, email, username, password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      connection.query(
        insertQuery,
        [
          studentId, firstName, middleName, lastName, fullName,
          course, section, trimester, email, username, hashedPassword
        ],
        async (insertError) => {
          if (insertError) {
            console.error('Insert error:', insertError);
            return res.status(500).json({ 
              success: false, 
              message: 'Error creating account' 
            });
          }

          // Prepare email content
          const emailContent = `
          <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
              <!-- Header -->
              <div style="background-color: #003366; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0;">Welcome to ECR Online Grade</h1>
              </div>
              
              <!-- Main Content -->
              <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
                  <!-- Greeting -->
                  <p style="font-size: 16px; margin: 0 0 24px 0;">
                      Dear ${firstName} ${lastName},
                  </p>
                  
                  <p style="font-size: 16px; margin: 0 0 24px 0;">
                      Your account has been successfully created. Below are your account details and login credentials:
                  </p>
                  
                  <!-- Student Information -->
                  <div style="background-color: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
                      <div style="display: grid; grid-gap: 16px;">
                          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                              <span style="color: #4b5563; font-weight: 500;">Student ID: </span>
                              <span style="font-weight: 600;">${studentId}</span>
                          </div>
                          
                          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                              <span style="color: #4b5563; font-weight: 500;">Full Name: </span>
                              <span style="font-weight: 600;">${fullName}</span>
                          </div>
                          
                          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                              <span style="color: #4b5563; font-weight: 500;">Course: </span>
                              <span style="font-weight: 600;">${course}</span>
                          </div>
                          
                          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                              <span style="color: #4b5563; font-weight: 500;">Section: </span>
                              <span style="font-weight: 600;">${section}</span>
                          </div>
                          
                          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                              <span style="color: #4b5563; font-weight: 500;">Trimester: </span>
                              <span style="font-weight: 600;">${trimester}</span>
                          </div>
                          
                          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                              <span style="color: #4b5563; font-weight: 500;">Email: </span>
                              <span style="font-weight: 600;">${email}</span>
                          </div>
                      </div>
                      
                      <!-- Login Credentials Section -->
                      <div style="margin-top: 24px;">
                          <h2 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">Login Credentials</h2>
                          <div style="display: grid; grid-gap: 12px;">
                              <div style="display: flex; justify-content: space-between;">
                                  <span style="color: #4b5563;">Username: </span>
                                  <span style="font-weight: 600;">${username}</span>
                              </div>
                              <div style="display: flex; justify-content: space-between;">
                                  <span style="color: #4b5563;">Password: </span>
                                  <span style="font-weight: 600;">${plainPassword}</span>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <!-- Security Notice -->
                  <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                      <p style="margin: 0; color: #9a3412; font-weight: 500;">Important Security Notice:</p>
                      <p style="margin: 8px 0 0 0; color: #9a3412;">Please change your password after your first login to ensure account security.</p>
                  </div>
                  
                  <!-- Footer Note -->
                  <p style="font-size: 16px; margin: 0 0 24px 0;">
                      Welcome to our academic community! You can now access your grades and academic information through our online portal.
                  </p>
                  
                  <!-- Signature -->
                  <div style="text-align: left; color: #4b5563;">
                      <p style="margin: 0;">Best regards,</p>
                      <p style="margin: 8px 0 0 0; font-weight: 600;">ECR Online Grade System</p>
                  </div>
              </div>
          </div>`;

          try {
            // Send email directly using the transporter
            await transporter.sendMail({
              from: '"ECR Online Grade" <projectipt00@gmail.com>',
              to: email,
              subject: 'Welcome to ECR Online Grade - Account Registration Successful',
              html: emailContent
            });

            res.json({
              success: true,
              message: 'Registration successful',
              credentials: { username, password: plainPassword }
            });
          } catch (emailError) {
            console.error('Email error:', emailError);
            // Still return success even if email fails
            res.json({
              success: true,
              message: 'Registration successful but email delivery failed',
              credentials: { username, password: plainPassword }
            });
          }
        }
      );
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add this endpoint to your Express server code

app.post('/update-student', async (req, res) => {
  try {
    const { studentId, currentPassword, newPassword, section, trimester } = req.body;

    // First, verify the current password
    const [student] = await connection.promise().query(
      'SELECT password FROM students WHERE student_id = ?',
      [studentId]
    );

    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // If current password is provided, verify it
    if (currentPassword) {
      const passwordMatch = await bcrypt.compare(currentPassword, student[0].password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Prepare update query
    let updateQuery = 'UPDATE students SET';
    const updateValues = [];
    const updates = [];

    if (section) {
      updates.push(' section = ?');
      updateValues.push(section);
    }

    if (trimester) {
      updates.push(' trimester = ?');
      updateValues.push(trimester);
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.push(' password = ?');
      updateValues.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }

    updateQuery += updates.join(',') + ' WHERE student_id = ?';
    updateValues.push(studentId);

    await connection.promise().query(updateQuery, updateValues);

    // Send email notification about the update
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Update Notification</h2>
        <p>Your account information has been updated successfully.</p>
        <p>Changes made:</p>
        <ul>
          ${section ? `<li>Section updated to: ${section}</li>` : ''}
          ${trimester ? `<li>Trimester updated to: ${trimester}</li>` : ''}
          ${newPassword ? '<li>Password has been changed</li>' : ''}
        </ul>
        <p>If you did not make these changes, please contact support immediately.</p>
      </div>
    `;

    // Fetch student email
    const [studentData] = await connection.promise().query(
      'SELECT email FROM students WHERE student_id = ?',
      [studentId]
    );

    await transporter.sendMail({
      from: '"ECR Online Grade" <projectipt00@gmail.com>',
      to: studentData[0].email,
      subject: 'Account Settings Updated',
      html: emailContent
    });

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});