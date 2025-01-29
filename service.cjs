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

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const sanitizedEmail = email.trim().toLowerCase();

    connection.query(
      'SELECT * FROM users WHERE LOWER(TRIM(email)) = ?', 
      [sanitizedEmail], 
      async (error, results) => {
        if (error) {
          console.error('Query Error:', error);
          return res.status(500).json({ success: false, message: 'Database query error' });
        }
        
        if (results.length > 0) {
          const user = results[0];
          try {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
              return res.json({ 
                success: true, 
                message: 'Login successful',
                user: {
                  id: user.id,
                  email: user.email,
                  teacher_name: user.teacher_name,
                  role: user.role
                }
              });
            }
          } catch (compareError) {
            console.error('Bcrypt Compare Error:', compareError);
          }
        }
        
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
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

app.listen(5000, () => {
  console.log('Server running on port 5000');
});