//teacherdashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  Home, 
  GraduationCap, 
  Upload,
  LogOut,
  AlertCircle,
  ChevronLeft, 
  ChevronRight,
  Table,
  Search,
  Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import LoadingSpinner from '../Loadinganimation/Loading';
import sendEmail,{ EmailTemplates } from '../Sendemail/Sendemail';

const API_URL = 'https://ecr-api-connection-database.netlify.app/.netlify/functions/service-database';

const TeacherDashboard = ({ onLogout }) => {
  // State variables
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [csvData, setCsvData] = useState([]);
  const [uploadedGrades, setUploadedGrades] = useState([]);
  const [, setIsGradesFetching] = useState(true);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailErrors, setEmailErrors] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [batchSize] = useState(5); // Process 5 records at a time
  const [currentBatch, setCurrentBatch] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [failedUploads, setFailedUploads] = useState([]);
  // New state variables for enhanced features
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrimester, setSelectedTrimester] = useState('all');
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [analytics, setAnalytics] = useState({
    uploadsToday: 0,
    totalUploads: 0,
    incCount: 0,
    passedCount: 0,
    failedCount: 0,
    trimesterData: {},
    recentUploads: []
  });

  const [currentEmailProgress, setCurrentEmailProgress] = useState({
    studentNum: '',
    name: '',
    current: 0,
    total: 0
  });

  const [uploadProgress, setUploadProgress] = useState({
    studentNum: '',
    name: '',
    current: 0,
    total: 0
  });
  const [rowCount, setRowCount] = useState({
    original: 0,
    valid: 0,
    invalid: 0
  });

  const userInfo = JSON.parse(localStorage.getItem('teacherInfo'));
  const teacher_id = userInfo ? userInfo.id : null;
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Fetch uploaded grades when the dashboard view is active
  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchUploadedGrades();
    }
  }, [currentView]);

  // Process analytics and filter grades when uploaded grades change
  useEffect(() => {
    if (uploadedGrades.length > 0) {
      processAnalytics();
      filterGrades();
    }
  }, [uploadedGrades, searchQuery, selectedTrimester]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch uploaded grades from the server
  const fetchUploadedGrades = async () => {
    setLoading(true);
    if (teacher_id) {
      try {
        const response = await fetch(`${API_URL}/grades?teacherId=${encodeURIComponent(teacher_id)}`);
        const data = await response.json();
        if (data.success) {
          setUploadedGrades(data.grades);
          // Process analytics after updating grades
          processAnalytics();
          filterGrades();
        }
      } catch (error) {
        console.error('Error fetching grades:', error);
      } finally {
        setLoading(false);
        setIsGradesFetching(false);
      }
    }
  };

  // Send grade notification email to a student
  const sendGradeNotification = async (studentNum, gradeData) => {
    try {
      const responses = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'get-alldata', studentId: gradeData.STUDENT_NUM })
      });
      
      if (!responses.ok) {
        throw new Error('Failed to fetch student data');
      }
      
      const studentData = await responses.json();
      if (!studentData.success) {
        throw new Error('Failed to fetch student data: ' + studentData.message);
      }
  
      await sendEmail({
        template: EmailTemplates.GRADE_NOTIFICATION,
        data: {
          email: studentData.student.email,
          studentId: gradeData.STUDENT_NUM,
          studentName: studentData.student.full_name,
          courseCode: gradeData.COURSE_CODE,
          courseDescription: gradeData.COURSE_DESCRIPTION,
          academicYear: gradeData.ACADEMIC_YEAR,
          academic_term: gradeData.ACADEMIC_TERM,
          section: gradeData.SECTION,
          facultyName: gradeData.FACULTY_NAME,
          prelimGrade: gradeData.PRELIM_GRADE,
          midtermGrade: gradeData.MIDTERM_GRADE,
          finalGrade: gradeData.FINAL_GRADE,
          gwa: gradeData.GWA,
          remark: gradeData.REMARK
        },
        onProgress: (progress) => {
          setCurrentEmailProgress(prev => ({
            ...prev,
            studentNum: progress.studentNum,
            name: progress.name,
            current: prev.current + (progress.status === 'sent' ? 1 : 0)
          }));
        },
        onError: (error) => {
          setEmailErrors(prev => [...prev, error]);
        }
      });
    } catch (error) {
      console.error('Error sending grade notification:', error);
      throw error;
    }
  };

  // Function to process analytics data
  const processAnalytics = () => {
    const today = new Date().toISOString().split('T')[0];

    // Calculate uploads today
    const uploadsToday = uploadedGrades.filter(grade =>
      grade.created_at.split('T')[0] === today
    ).length;

    // Calculate counts for INC, PASSED, and FAILED records
    const incCount = uploadedGrades.filter(grade =>
      grade.remark?.toUpperCase() === 'INC'
    ).length;

    const passedCount = uploadedGrades.filter(grade =>
      grade.remark?.toUpperCase() === 'PASSED'
    ).length;

    const failedCount = uploadedGrades.filter(grade =>
      grade.remark?.toUpperCase() === 'FAILED'
    ).length;

    // Process trimester data
    const trimesterData = uploadedGrades.reduce((acc, grade) => {
      const key = `${grade.academic_year}-${grade.academic_term}`;
      if (!acc[key]) {
        acc[key] = {
          name: `${grade.academic_year} - ${grade.academic_term}`,
          count: 0,
          incCount: 0,
          passedCount: 0,
          failedCount: 0
        };
      }
      acc[key].count++;
      if (grade.remark?.toUpperCase() === 'INC') acc[key].incCount++;
      if (grade.remark?.toUpperCase() === 'PASSED') acc[key].passedCount++;
      if (grade.remark?.toUpperCase() === 'FAILED') acc[key].failedCount++;
      return acc;
    }, {});

    // Get recent uploads
    const recentUploads = [...uploadedGrades]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    // Set analytics state
    setAnalytics({
      uploadsToday,
      totalUploads: uploadedGrades.length,
      incCount,
      passedCount,
      failedCount,
      trimesterData,
      recentUploads
    });
  };

  // Function to filter grades based on search query and selected trimester
  const filterGrades = () => {
    let filtered = [...uploadedGrades];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(grade =>
        grade.student_num.toLowerCase().includes(query) ||
        grade.course_code.toLowerCase().includes(query) ||
        grade.student_name.toLowerCase().includes(query)
      );
    }

    // Apply trimester filter
    if (selectedTrimester !== 'all') {
      filtered = filtered.filter(grade =>
        `${grade.academic_year}-${grade.academic_term}` === selectedTrimester
      );
    }

    // Sort by created_at
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Set filtered grades state
    setFilteredGrades(filtered);
  };

  // Function to compute grades and determine remarks
  const computeGrades = (rawData) => {
    return rawData.map(row => {
      const prelim = parseFloat(row.PRELIM_GRADE) || 0;
      const midterm = parseFloat(row.MIDTERM_GRADE) || 0;
      const final = parseFloat(row.FINAL_GRADE) || 0;

      // Calculate GWA
      const gwa = (prelim + midterm + final) / 3;

      // Determine remark
      let remark = 'INC';
      if (midterm && final) { // Only proceed if both midterm and final grades exist
        const passingGrade = 3.00; // Example passing threshold on a 1.00 to 5.00 scale
        remark = gwa <= passingGrade ? 'PASSED' : 'FAILED';
      }

      return {
        ...row,
        GWA: gwa.toFixed(2),
        REMARK: remark
      };
    });
  };

  // Function to validate and process the uploaded CSV file
  const validateAndProcessFile = (file) => {
    if (!file) return;
  
    if (file.type !== 'text/csv') {
      setUploadStatus({
        success: false,
        message: 'Please upload a CSV file'
      });
      return;
    }
  
    setSelectedFile(file);
    setUploadStatus(null);
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const parsedData = parseCSV(text);
  
        if (parsedData.length < 2) {
          setUploadStatus({
            success: false,
            message: 'CSV file appears to be empty or invalid'
          });
          return;
        }
  
        const headers = parsedData[0].map(header => header.trim().toUpperCase());
        const requiredColumns = ['STUDENT_NUM', 'STUDENT_NAME'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  
        if (missingColumns.length > 0) {
          setUploadStatus({
            success: false,
            message: `Missing required columns: ${missingColumns.join(', ')}`
          });
          return;
        }
  
        // Initialize counters
        let validRows = 0;
        let invalidRows = 0;
        const processedRows = [];
        const invalidRowDetails = [];
  
        // Process each row after headers
        parsedData.slice(1).forEach((row, index) => {
          // Create object mapping headers to values
          const rowData = {};
          let isValid = true;
          let invalidReason = [];
  
          headers.forEach((header, colIndex) => {
            rowData[header] = (row[colIndex] || '').trim();
          });
  
          // Validate required fields
          if (!rowData.STUDENT_NUM || rowData.STUDENT_NUM.length === 0) {
            isValid = false;
            invalidReason.push('Missing student number');
          }
  
          if (!rowData.STUDENT_NAME || rowData.STUDENT_NAME.length === 0) {
            isValid = false;
            invalidReason.push('Missing student name');
          }
  
          // Check if row is completely empty
          const hasAnyValue = Object.values(rowData).some(value => value.length > 0);
          if (!hasAnyValue) {
            isValid = false;
            invalidReason.push('Empty row');
          }
  
          if (isValid) {
            processedRows.push(rowData);
            validRows++;
          } else {
            invalidRows++;
            invalidRowDetails.push({
              rowNumber: index + 2, // +2 because we start after header and want 1-based index
              reasons: invalidReason,
              data: rowData
            });
          }
        });
  
        // Update row count state
        setRowCount({
          original: parsedData.length - 1, // Subtract header row
          valid: validRows,
          invalid: invalidRows
        });
  
        if (validRows === 0) {
          setUploadStatus({
            success: false,
            message: 'No valid rows found in the CSV file'
          });
          return;
        }
  
        // Show validation results
        setUploadStatus({
          success: true,
          message: `CSV validation complete`,
          validationDetails: {
            totalRows: parsedData.length - 1,
            validRows,
            invalidRows,
            invalidRowDetails
          }
        });
  
        // Process valid rows only
        const processedData = computeGrades(processedRows);
        setCsvData(processedData);
  
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setUploadStatus({
          success: false,
          message: 'Error parsing CSV file: ' + error.message
        });
      }
    };
    reader.readAsText(file);
  };

  const renderValidationSummary = () => {
    if (!uploadStatus || !uploadStatus.validationDetails) return null;
  
    const { validationDetails } = uploadStatus;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-lg font-semibold mb-2">CSV Validation Summary</h4>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">Total Rows</p>
            <p className="text-xl font-bold">{validationDetails.totalRows}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">Valid Rows</p>
            <p className="text-xl font-bold text-green-600">{validationDetails.validRows}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-600">Invalid Rows</p>
            <p className="text-xl font-bold text-red-600">{validationDetails.invalidRows}</p>
          </div>
        </div>
        
        {validationDetails.invalidRows > 0 && (
          <div className="mt-4">
            <h5 className="font-semibold mb-2">Invalid Rows Details:</h5>
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {validationDetails.invalidRowDetails.map((detail, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap">{detail.rowNumber}</td>
                      <td className="px-4 py-2">{detail.reasons.join(', ')}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {`Student #: ${detail.data.STUDENT_NUM || 'N/A'}, Name: ${detail.data.STUDENT_NAME || 'N/A'}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const sendRegistrationEmail = async (student) => {
    try {
      await sendEmail({
        template: EmailTemplates.WELCOME_EMAIL,
        data: {
          email: student.EMAIL,
          studentId: student.STUDENT_NUM,
          firstName: student.STUDENT_NAME.split(' ')[0],
          middleName: student.STUDENT_NAME.split(' ').slice(1, -1).join(' ') || null,
          lastName: student.STUDENT_NAME.split(' ').pop(),
          fullName: student.STUDENT_NAME,
          course: '-',
          section: student.SECTION,
          academic_term: student.ACADEMIC_TERM,
          username: student.credentials.username,
          password: student.credentials.password
        },
        onProgress: (progress) => {
          setCurrentEmailProgress(prev => ({
            ...prev,
            studentNum: student.STUDENT_NUM,
            name: student.STUDENT_NAME,
            current: prev.current + (progress.status === 'sent' ? 1 : 0)
          }));
        },
        onError: (error) => {
          setEmailErrors(prev => [...prev, {
            student: student.STUDENT_NUM,
            error: error.message
          }]);
        }
      });
    } catch (error) {
      console.error('Error sending registration email:', error);
      throw error;
    }
  };

// Update the renderUploadStatus function to show new student registrations
const renderUploadStatus = () => {
  if (!uploadStatus) return null;

  return (
    <div className={`p-4 rounded-md ${
      uploadStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      <div className="flex items-center">
        <AlertCircle className="mr-2" size={20} />
        <div>
          <p>{uploadStatus.message}</p>
          {uploadStatus.success && uploadStatus.rowsAffected && (
            <p className="mt-2">Successfully uploaded {uploadStatus.rowsAffected} records.</p>
          )}
          {uploadStatus.newStudentsCount > 0 && (
            <p className="mt-2">Registration emails sent to {uploadStatus.newStudentsCount} new students.</p>
          )}
        </div>
      </div>
      
      {/* Skipped Rows Display */}
      {uploadStatus.skippedRows && uploadStatus.skippedRows.length > 0 && (
        <div className="mt-4 bg-yellow-50 p-4 rounded-md">
          <h4 className="font-semibold mb-2">Skipped Records:</h4>
          <ul className="list-disc pl-4">
            {uploadStatus.skippedRows.map((row, index) => (
              <li key={index} className="text-sm">
                Student {row.studentNum}: {row.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Email Error Messages */}
      {emailErrors.length > 0 && (
        <div className="mt-4 bg-yellow-50 p-4 rounded-md">
          <h4 className="font-semibold mb-2">Email Notification Errors:</h4>
          <ul className="list-disc pl-4">
            {emailErrors.map((error, index) => (
              <li key={index} className="text-sm">
                Student {error.student}: {error.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

  // Function to parse CSV text into an array of arrays
  const parseCSV = (text) => {
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const lines = text.split('\n').filter(line => line.trim());
    const result = [];

    for (let line of lines) {
      const row = [];
      let matches;

      while ((matches = regex.exec(line)) !== null) {
        let value = matches[1];

        if (value.startsWith(',')) {
          value = value.substring(1);
        }

        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1).replace(/""/g, '"');
        }

        row.push(value);
      }

      if (row.length > 0) {
        result.push(row);
      }
    }

    return result;
  };

  // Handle file drop event
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    validateAndProcessFile(file);
  };

  // Handle drag over event
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Handle file upload via input
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    validateAndProcessFile(file);
  };

  // Process CSV file and send notifications
  const processCSV = async () => {
    if (!selectedFile || csvData.length === 0) return;

    setIsUploading(true);
    setEmailErrors([]);
    setFailedUploads([]);
    setProcessedCount(0);
    setCurrentBatch(0);

    try {
      const totalBatches = Math.ceil(csvData.length / batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        setCurrentBatch(batchIndex + 1);
        
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, csvData.length);
        const currentBatchData = csvData.slice(start, end);

        // Update progress
        setUploadProgress({
          phase: `Processing batch ${batchIndex + 1} of ${totalBatches}`,
          current: processedCount,
          total: csvData.length
        });

        // Process current batch
        const { results, errors } = await processBatch(currentBatchData);

        // Update progress and errors
        setProcessedCount(prev => prev + results.length);
        setFailedUploads(prev => [...prev, ...errors]);
      }

      // Final status update
      setUploadStatus({
        success: true,
        message: `Upload completed. ${processedCount} records processed successfully.`,
        failedCount: failedUploads.length
      });

    } catch (error) {
      console.error('Upload Error:', error);
      setUploadStatus({
        success: false,
        message: error.message || 'Error during upload process'
      });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setCsvData([]);
      await fetchUploadedGrades();
    }
  };

   // Process grades in batches
   const processBatch = async (batch) => {
    const results = [];
    const errors = [];

    for (const row of batch) {
      try {
        // Step 1: Register or verify student
        const studentResponse = await fetch(`${API_URL}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            studentId: row.STUDENT_NUM,
            firstName: row.STUDENT_NAME.split(' ')[0],
            middleName: row.STUDENT_NAME.split(' ').slice(1, -1).join(' ') || null,
            lastName: row.STUDENT_NAME.split(' ').pop(),
            email: row.EMAIL,
            section: row.SECTION,
            academic_term: row.ACADEMIC_TERM,
            course: '-'
          })
        });

        const studentData = await studentResponse.json();
        
        // Step 2: Upload grade
        const gradeData = new FormData();
        Object.entries(row).forEach(([key, value]) => {
          gradeData.append(key.toLowerCase(), value);
        });

        const gradeResponse = await fetch(`${API_URL}/grades`, {
          method: 'POST',
          body: gradeData
        });

        const gradeResult = await gradeResponse.json();

        if (!gradeResult.success) {
          throw new Error(gradeResult.message || 'Grade upload failed');
        }

        // Step 3: Send email notification
        await sendGradeNotification(row.STUDENT_NUM, row);

        // Handle new student registration email
        if (studentData.success && !studentData.message?.includes('Already registered')) {
          await sendRegistrationEmail({
            ...row,
            credentials: studentData.credentials
          });
        }

        results.push({
          studentNum: row.STUDENT_NUM,
          status: 'success'
        });

      } catch (error) {
        console.error('Error processing record:', error);
        errors.push({
          studentNum: row.STUDENT_NUM,
          studentName: row.STUDENT_NAME,
          courseCode: row.COURSE_CODE,
          section: row.SECTION,
          academicYear: row.ACADEMIC_YEAR,
          academicTerm: row.ACADEMIC_TERM,
          error: error.message || 'Processing failed',
          rowData: row // Store the complete row data
        });
      }
    }

    return { results, errors };
  };

  const renderErrorDetails = () => {
    if (!showErrorDetails || failedUploads.length === 0) return null;

    return (
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-red-600">Failed Uploads Details</h3>
          <button
            onClick={() => setShowErrorDetails(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {failedUploads.map((error, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{error.studentNum}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{error.studentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{error.courseCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{error.section}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{`${error.academicTerm} ${error.academicYear}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-600">{error.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Handle logout
  const handleLogout = () => {
    onLogout();
  };

  // Sidebar item component
  const SidebarItem = ({ icon: Icon, label, active, onClick, iconSize }) => (
    <div className={`flex items-center p-2 rounded-lg cursor-pointer ${active ? 'bg-gray-200' : 'hover:bg-gray-100'}`} onClick={onClick}>
      <Icon size={iconSize} className="mr-3" />
      {isSidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </div>
  );

  const NavigationItem = ({ icon: Icon, label, active, onClick }) => {
    if (isMobile) {
      return (
        <button 
          onClick={onClick}
          className={`flex flex-col items-center justify-center flex-1 py-2 ${
            active ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <Icon size={24} className="mb-1" />
          <span className="text-xs">{label}</span>
        </button>
      );
    }

    return (
      <div 
        className={`flex items-center p-2 rounded-lg cursor-pointer ${
          active ? 'bg-gray-200' : 'hover:bg-gray-100'
        }`} 
        onClick={onClick}
      >
        <Icon size={24} className="mr-3" />
        {isSidebarOpen && <span className="text-sm font-medium">{label}</span>}
      </div>
    );
  };  

  // Function to render analytic cards
  const renderAnalyticCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Uploads Today */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Uploads Today</h3>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-2xl font-bold">{analytics.uploadsToday}</div>
      </div>

      {/* Card 2: Total Records */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Total Records</h3>
          <Table className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-2xl font-bold">{analytics.totalUploads}</div>
      </div>

      {/* Card 3: INC Records */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">INC Records</h3>
          <AlertCircle className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-2xl font-bold">{analytics.incCount}</div>
      </div>

      {/* Card 4: Pass Rate */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Pass Rate</h3>
          <GraduationCap className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-2xl font-bold">
          {((analytics.passedCount / analytics.totalUploads) * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );

  // Function to render charts for analytics
  const renderCharts = () => {
    const trimesterChartData = Object.values(analytics.trimesterData);
    const remarkChartData = [
      { name: 'PASSED', value: analytics.passedCount, color: '#10B981' },
      { name: 'FAILED', value: analytics.failedCount, color: '#EF4444' },
      { name: 'INC', value: analytics.incCount, color: '#F59E0B' }
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart Card 1: Grade Distribution by Trimester */}
        <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Grade Distribution by each Terms</h3>
          </div>
          <div className="p-4">
            <BarChart width={500} height={300} data={trimesterChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="passedCount" fill="#10B981" name="Passed" />
              <Bar dataKey="failedCount" fill="#EF4444" name="Failed" />
              <Bar dataKey="incCount" fill="#F59E0B" name="Incomplete" />
            </BarChart>
          </div>
        </div>

        {/* Chart Card 2: Overall Grade Status */}
        <div className="bg-white p-6 rounded-lg shadow-md overflow-hidden">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Overall Grade Status</h3>
          </div>
          <div className="p-4">
            <PieChart width={400} height={300}>
              <Pie
                data={remarkChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {remarkChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>
      </div>
    );
  };
  

  // Function to render search and filter options
  const renderSearchAndFilters = () => (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by student number, name, or course code..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {/* Trimester Filter */}
      <select
        className="p-2 border rounded-lg"
        value={selectedTrimester}
        onChange={(e) => setSelectedTrimester(e.target.value)}
      >
        <option value="all">All Terms</option>
        {Object.keys(analytics.trimesterData).map(key => (
          <option key={key} value={key}>{analytics.trimesterData[key].name}</option>
        ))}
      </select>
    </div>
  );

  // Function to render recent uploads
  const renderRecentUploads = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Recent Uploads</h3>
      </div>
      <div className="space-y-4">
        {analytics.recentUploads.map((grade, index) => (
          <div key={index} className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="font-medium">{grade.student_name}</p>
              <p className="text-sm text-gray-500">{grade.course_code} - {grade.course_description}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{grade.gwa}</p>
              <p className="text-sm text-gray-500">
                {new Date(grade.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

const renderDashboard = () => {
  // Function to group grades by course and upload date
  const groupByCourseAndDate = (grades) => {
    return grades.reduce((acc, grade) => {
      const course = grade.course_code;
      const uploadDate = new Date(grade.created_at).toLocaleDateString();
      if (!acc[course]) acc[course] = {};
      if (!acc[course][uploadDate]) acc[course][uploadDate] = [];
      acc[course][uploadDate].push(grade);
      return acc;
    }, {});
  };

  const groupedGrades = groupByCourseAndDate(filteredGrades);

  return (
    <div className="space-y-6">
      {/* Render analytic cards */}
      {renderAnalyticCards()}

      {/* Render charts */}
      {renderCharts()}

      {/* Render search and filters */}
      {renderSearchAndFilters()}

      {/* Render recent uploads */}
      {renderRecentUploads()}

      {/* Render grouped grades */}
      <div className="overflow-x-auto">
        {Object.keys(groupedGrades).map((course) =>
          Object.keys(groupedGrades[course]).map((uploadDate) => (
            <div key={`${course}-${uploadDate}`} className="p-4 bg-white shadow rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-4 border-b pb-2">{`Grade Records for ${course} - Uploaded on ${uploadDate}`}</h2>
              <div className="overflow-x-auto">
                <table className="w-full table-auto min-w-max">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-2 text-left whitespace-nowrap">Student ID</th>
                      <th className="p-2 text-center whitespace-nowrap">Name</th>
                      <th className="p-2 text-center whitespace-nowrap">Course</th>
                      <th className="p-2 text-center whitespace-nowrap">Prelim</th>
                      <th className="p-2 text-center whitespace-nowrap">Midterm</th>
                      <th className="p-2 text-center whitespace-nowrap">Final</th>
                      <th className="p-2 text-center whitespace-nowrap">Academic Year</th>
                      <th className="p-2 text-center whitespace-nowrap">Academic Term</th>
                      <th className="p-2 text-center whitespace-nowrap">Section</th>
                      <th className="p-2 text-center whitespace-nowrap">Remark</th>
                      <th className="p-2 text-center whitespace-nowrap">GWA</th>
                      <th className="p-2 text-center whitespace-nowrap">Upload Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedGrades[course][uploadDate].map((grade, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 whitespace-nowrap">{grade.student_num}</td>
                        <td className="p-2 whitespace-nowrap">{grade.student_name}</td>
                        <td className="p-2 text-center whitespace-nowrap">{grade.course_code}</td>
                        <td className="p-2 text-center whitespace-nowrap">{grade.prelim_grade}</td>
                        <td className="p-2 text-center whitespace-nowrap">{grade.midterm_grade}</td>
                        <td className="p-2 text-center whitespace-nowrap">{grade.final_grade}</td>
                        <td className="p-2 text-center whitespace-nowrap">{grade.academic_year}</td>
                        <td className="p-2 text-center whitespace-nowrap">{grade.academic_term}</td>
                        <td className="p-2 text-center whitespace-nowrap">{grade.section}</td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            grade.remark?.toUpperCase() === 'PASSED' ? 'bg-green-100 text-green-800' :
                            grade.remark?.toUpperCase() === 'FAILED' ? 'bg-red-100 text-red-800' :
                            grade.remark?.toUpperCase() === 'INC' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {grade.remark}
                          </span>
                        </td>
                        <td className="p-2 text-center whitespace-nowrap">{grade.gwa}</td>
                        <td className="p-2 text-center whitespace-nowrap">
                          {new Date(grade.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const renderUploadView = () => {
  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div 
          className="flex items-center justify-center w-full h-[20vh]"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">CSV files only</p>
            </div>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* CSV Preview */}
      {selectedFile && csvData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">CSV Preview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 bg-gray-50 sticky left-0 z-10" style={{ minWidth: '120px' }}>
                    Student Number
                  </th>
                  {Object.keys(csvData[0]).filter(header => header !== 'STUDENT_NUM').map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 bg-gray-50"
                      style={{ minWidth: '120px' }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap text-center sticky left-0 bg-white z-10">
                      {row.STUDENT_NUM}
                    </td>
                    {Object.entries(row).filter(([key]) => key !== 'STUDENT_NUM').map(([, value], colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap text-center"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {renderValidationSummary()}

          {/* Upload Button */}
          <div className="mt-4">
            <button 
              onClick={processCSV}
              disabled={isUploading || isEmailSending}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : isEmailSending ? 'Sending Notifications...' : 'Confirm Upload'}
            </button>
          </div>

          {/* Loading States */}
          {(isUploading || isEmailSending) && renderLoadingStates()}
        </div>
      )}

      {/* Upload Status Messages */}
      {uploadStatus && (
        <div className={`p-4 rounded-md ${
          uploadStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <div className="flex items-center">
            <AlertCircle className="mr-2" size={20} />
            <div>
              <p>{uploadStatus.message}</p>
              {uploadStatus.success && uploadStatus.rowsAffected && (
                <p className="mt-2">Successfully uploaded {uploadStatus.rowsAffected} records.</p>
              )}
            </div>
          </div>
          
          {/* Email Error Messages */}
          {emailErrors.length > 0 && (
            <div className="mt-4 bg-yellow-50 p-4 rounded-md">
              <h4 className="font-semibold mb-2">Email Notification Errors:</h4>
              <ul className="list-disc pl-4">
                {emailErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    Student {error.student}: {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Function to render loading states during file upload and email sending
const renderLoadingStates = () => (
  <div className="flex flex-col items-center justify-center mt-4 space-y-4">
    <div className="flex items-center">
      <LoadingSpinner />
      <span className="ml-2">
        <div className="space-y-1">
          <p className="font-medium">{uploadProgress.phase}</p>
          <p className="text-sm text-gray-600">
            Overall Progress: {processedCount}/{csvData.length} records
          </p>
          <p className="text-sm text-gray-600">
            Current Batch: {currentBatch} of {Math.ceil(csvData.length / batchSize)}
          </p>
          {failedUploads.length > 0 && (
            <button
              onClick={() => setShowErrorDetails(true)}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Failed Uploads: {failedUploads.length} - Click to view details
            </button>
          )}
        </div>
      </span>
    </div>
    <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${(processedCount / csvData.length) * 100}%` }}
      ></div>
    </div>
    {renderErrorDetails()}
  </div>
);

// Display loading spinner if data is loading
if (loading) {
  return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="md" /></div>;
}

return (
  <div className="flex flex-col h-screen bg-gray-100 md:flex-row">
    {/* Sidebar for desktop */}
    {!isMobile && (
      <div className={`hidden md:flex ${
        isSidebarOpen ? 'w-64' : 'w-20'
      } bg-white shadow-md transition-all duration-300 ease-in-out flex-col`}>
        <div className="flex justify-between items-center p-4 border-b">
          {isSidebarOpen && <h2 className="text-xl font-bold">Teacher Portal</h2>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="ml-auto"
          >
            {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>

        <nav className="mt-4 space-y-2 px-4 flex-grow">
          <NavigationItem 
            icon={Home} 
            label="Dashboard" 
            active={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
          />
          <NavigationItem 
            icon={Upload} 
            label="Upload CSV" 
            active={currentView === 'upload'}
            onClick={() => setCurrentView('upload')}
          />
        </nav>
        
        <div className="px-4 pb-4">
          <NavigationItem 
            icon={LogOut} 
            label="Logout" 
            onClick={handleLogout}
          />
        </div>
      </div>
    )}

    {/* Main Content */}
    <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
        {currentView === 'dashboard' ? 'Teacher Dashboard' : 'Upload Grades'}
      </h1>
      
      {currentView === 'dashboard' && (
        <h2 className="text-lg md:text-xl font-semibold mb-4">
          {`Welcome, ${userInfo ? userInfo.name : 'Teacher'}  (${userInfo.id})`}
        </h2>
      )}
      
      {currentView === 'dashboard' ? renderDashboard() : renderUploadView()}
    </div>

    {/* Bottom Navigation for Mobile */}
    {isMobile && (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around shadow-lg">
        <NavigationItem 
          icon={Home} 
          label="Dashboard" 
          active={currentView === 'dashboard'}
          onClick={() => setCurrentView('dashboard')}
        />
        <NavigationItem 
          icon={Upload} 
          label="Upload" 
          active={currentView === 'upload'}
          onClick={() => setCurrentView('upload')}
        />
        <NavigationItem 
          icon={LogOut} 
          label="Logout" 
          onClick={handleLogout}
        />
      </nav>
    )}
  </div>
);
};

export default TeacherDashboard;