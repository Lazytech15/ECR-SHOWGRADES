import React, { useState, useEffect } from 'react';
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
  Calendar,
  Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import LoadingSpinner from '../Loadinganimation/Loading';

const API_URL = 'https://project-to-ipt01.netlify.app/.netlify/functions/api';
const LOCAL_API_URL = 'http://localhost:5000';

const TeacherDashboard = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [csvData, setCsvData] = useState([]);
  const [uploadedGrades, setUploadedGrades] = useState([]);
  const [isGradesFetching, setIsGradesFetching] = useState(true);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailErrors, setEmailErrors] = useState([]);
  
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

  const userInfo = JSON.parse(localStorage.getItem('teacherInfo'));
  const teacher_id = userInfo ? userInfo.id : null;

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchUploadedGrades();
    }
  }, [currentView]);

  useEffect(() => {
    if (uploadedGrades.length > 0) {
      processAnalytics();
      filterGrades();
    }
  }, [uploadedGrades, searchQuery, selectedTrimester]);

  const fetchUploadedGrades = async () => {
    if (teacher_id) {
      try {
        const response = await fetch(`${LOCAL_API_URL}/teacher-grades?teacher_id=${encodeURIComponent(teacher_id)}`);
        const data = await response.json();
        if (data.success) {
          setUploadedGrades(data.grades);
        }
      } catch (error) {
        console.error('Error fetching grades:', error);
      } finally {
        setIsGradesFetching(false);
      }
    }
  };

  const sendGradeNotification = async (studentNum, gradeData) => {
    try {
      // Update the current progress
      setCurrentEmailProgress(prev => ({
        ...prev,
        studentNum: studentNum,
        name: gradeData.STUDENT_NAME || 'Unknown',
        current: prev.current + 1
      }));

      // Fetch student data
      const studentResponse = await fetch(`${API_URL}/students/${studentNum}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!studentResponse.ok) {
        throw new Error(`Failed to fetch student data for ${studentNum}`);
      }

      const studentData = await studentResponse.json();
      
      // Create email content
      const emailContent = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
          <!-- Header -->
          <div style="background-color: #003366; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0;">Academic Performance Update</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
              <!-- Greeting -->
              <p style="font-size: 16px; margin: 0 0 24px 0;">
                  Dear ${studentData.name},
              </p>
              
              <p style="font-size: 16px; margin: 0 0 24px 0;">
                  We are writing to inform you that your academic records have been updated for the following course:
              </p>
              
              <!-- Course Information -->
              <div style="background-color: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
                  <div style="display: grid; grid-gap: 16px;">
                      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                          <span style="color: #4b5563; font-weight: 500;">Course: </span>
                          <span style="font-weight: 600;">${gradeData.COURSE_CODE} - (${gradeData.COURSE_DESCRIPTION})</span>
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                          <span style="color: #4b5563; font-weight: 500;">Academic Year: </span>
                          <span style="font-weight: 600;">${gradeData.ACADEMIC_YEAR}</span>
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                          <span style="color: #4b5563; font-weight: 500;">Trimester: </span>
                          <span style="font-weight: 600;">${gradeData.TRIMESTER}</span>
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                          <span style="color: #4b5563; font-weight: 500;">Section: </span>
                          <span style="font-weight: 600;">${gradeData.SECTION}</span>
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                          <span style="color: #4b5563; font-weight: 500;">Faculty: </span>
                          <span style="font-weight: 600;">${gradeData.FACULTY_NAME}</span>
                      </div>
                  </div>
                  
                  <!-- Grades Section -->
                  <div style="margin-top: 24px;">
                      <h2 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">Grade Summary</h2>
                      <div style="display: grid; grid-gap: 12px;">
                          <div style="display: flex; justify-content: space-between;">
                              <span style="color: #4b5563;">Prelim: </span>
                              <span style="font-weight: 600;">${gradeData.PRELIM_GRADE || '-'}</span>
                          </div>
                          <div style="display: flex; justify-content: space-between;">
                              <span style="color: #4b5563;">Midterm: </span>
                              <span style="font-weight: 600;">${(gradeData.MIDTERM_GRADE === 0.00 || gradeData.MIDTERM_GRADE === '0.00') ? '-' : gradeData.MIDTERM_GRADE}</span>
                          </div>
                          <div style="display: flex; justify-content: space-between;">
                              <span style="color: #4b5563;">Final: </span>
                              <span style="font-weight: 600;">${(gradeData.FINAL_GRADE === 0.00 || gradeData.FINAL_GRADE === '0.00') ? '-' : gradeData.FINAL_GRADE}</span>
                          </div>
                          <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 8px;">
                              <span style="color: #4b5563;">GWA: </span>
                              <span style="font-weight: 600;">${(gradeData.MIDTERM_GRADE === 0.00 || gradeData.MIDTERM_GRADE === '0.00' || gradeData.FINAL_GRADE === 0.00 || gradeData.FINAL_GRADE === '0.00') ? '-' : gradeData.GWA}</span>
                          </div>
                          <div style="display: flex; justify-content: space-between;">
                              <span style="color: #4b5563;">Remark: </span>
                              <span style="font-weight: 600;">${(gradeData.MIDTERM_GRADE === 0.00 || gradeData.MIDTERM_GRADE === '0.00' || gradeData.FINAL_GRADE === 0.00 || gradeData.FINAL_GRADE === '0.00') ? '-' : gradeData.REMARK}</span>
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
                  <p style="margin: 8px 0 0 0; font-weight: 600;">Faculty Unofficial</p>
              </div>
          </div>
      </div>`;


      const emailResponse = await fetch(`${LOCAL_API_URL}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: studentData.personalEmail,
          subject: `Grade Update Notification - ${gradeData.COURSE_CODE}`,
          html: emailContent
        })
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(`Failed to send email to ${studentData.email}: ${errorData.message || emailResponse.statusText}`);
      }

    } catch (error) {
      console.error('Error sending grade notification:', error);
      throw error; // Propagate error to processCSV
    }
  };

  const processAnalytics = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const uploadsToday = uploadedGrades.filter(grade => 
      grade.created_at.split('T')[0] === today
    ).length;

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
      const key = `${grade.academic_year}-${grade.trimester}`;
      if (!acc[key]) {
        acc[key] = {
          name: `${grade.academic_year} - ${grade.trimester}`,
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
        `${grade.academic_year}-${grade.trimester}` === selectedTrimester
      );
    }

    // Sort by created_at
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setFilteredGrades(filtered);
  };

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
    reader.onload = (e) => {
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

        const headers = parsedData[0];
        const rows = parsedData.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header.trim()] = (row[index] || '').trim();
          });
          return obj;
        });

        // Filter out empty rows and compute grades before setting the state
        const validRows = rows.filter(row => Object.values(row).some(value => value));
        const processedData = computeGrades(validRows);
        setCsvData(processedData);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setUploadStatus({
          success: false,
          message: 'Error parsing CSV file'
        });
      }
    };
    reader.readAsText(file);
  };

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

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    validateAndProcessFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    validateAndProcessFile(file);
  };

  const processCSV = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setIsEmailSending(false);
    setEmailErrors([]);
    
    // Set initial upload progress
    setUploadProgress({
      studentNum: '',
      name: '',
      current: 0,
      total: csvData.length
    });

    // Create FormData and append the file
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Update progress for each record being processed
      for (let i = 0; i < csvData.length; i++) {
        const currentRecord = csvData[i];
        setUploadProgress(prev => ({
          ...prev,
          studentNum: currentRecord.STUDENT_NUM,
          name: currentRecord.STUDENT_NAME,
          current: i + 1
        }));

        // Simulate processing time for each record
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const response = await fetch(`${LOCAL_API_URL}/upload-grades`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setIsEmailSending(true);
        const emailErrors = [];
        
        // Reset email progress
        setCurrentEmailProgress({
          studentNum: '',
          name: '',
          current: 0,
          total: csvData.length
        });

        // Send email notifications to all students in the CSV
        for (let i = 0; i < csvData.length; i++) {
          const row = csvData[i];
          try {
            // Update current email progress
            setCurrentEmailProgress(prev => ({
              ...prev,
              studentNum: row.STUDENT_NUM,
              name: row.STUDENT_NAME,
              current: i + 1
            }));
            
            await sendGradeNotification(row.STUDENT_NUM, row);
          } catch (error) {
            emailErrors.push({
              student: row.STUDENT_NUM,
              error: error.message
            });
          }
        }

        setIsEmailSending(false);
        setEmailErrors(emailErrors);
        setCurrentEmailProgress({
          studentNum: '',
          name: '',
          current: 0,
          total: 0
        });

        setUploadStatus({
          success: data.success,
          message: `${data.message} ${emailErrors.length === 0 ? 'All notifications sent successfully.' 
            : `${csvData.length - emailErrors.length} out of ${csvData.length} notifications sent.`}`,
          rowsAffected: data.rowsAffected
        });

        setSelectedFile(null);
        setCsvData([]);
        fetchUploadedGrades();
      } else {
        setUploadStatus({
          success: false,
          message: data.message
        });
      }
    } catch (error) {
      console.error('Upload Error:', error);
      setUploadStatus({
        success: false,
        message: 'Error uploading file and sending notifications'
      });
    } finally {
      setIsUploading(false);
      setIsEmailSending(false);
      setUploadProgress({
        studentNum: '',
        name: '',
        current: 0,
        total: 0
      });
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  const SidebarItem = ({ icon: Icon, label, active, onClick, iconSize }) => (
    <div className={`flex items-center p-2 rounded-lg cursor-pointer ${active ? 'bg-gray-200' : 'hover:bg-gray-100'}`} onClick={onClick}>
      <Icon size={iconSize} className="mr-3" />
      {isSidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
  

  const renderAnalyticCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Uploads Today</h3>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-2xl font-bold">{analytics.uploadsToday}</div>
      </div>
  
      {/* Card 2 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Total Records</h3>
          <Table className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-2xl font-bold">{analytics.totalUploads}</div>
      </div>
  
      {/* Card 3 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">INC Records</h3>
          <AlertCircle className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-2xl font-bold">{analytics.incCount}</div>
      </div>
  
      {/* Card 4 */}
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

  const renderCharts = () => {
    const trimesterChartData = Object.values(analytics.trimesterData);
    const remarkChartData = [
      { name: 'PASSED', value: analytics.passedCount, color: '#10B981' },
      { name: 'FAILED', value: analytics.failedCount, color: '#EF4444' },
      { name: 'INC', value: analytics.incCount, color: '#F59E0B' }
    ];
  
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart Card 1 */}
        <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Grade Distribution by Trimester</h3>
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
  
        {/* Chart Card 2 */}
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
  

  const renderSearchAndFilters = () => (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
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
      <select
className="p-2 border rounded-lg"
value={selectedTrimester}
onChange={(e) => setSelectedTrimester(e.target.value)}
>
<option value="all">All Trimesters</option>
{Object.keys(analytics.trimesterData).map(key => (
  <option key={key} value={key}>{analytics.trimesterData[key].name}</option>
))}
</select>
</div>
);

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
      {renderAnalyticCards()}
      {renderCharts()}
      {renderSearchAndFilters()}
      {renderRecentUploads()}

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
                      <th className="p-2 text-center whitespace-nowrap">Trimester</th>
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
                        <td className="p-2 text-center whitespace-nowrap">{grade.trimester}</td>
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
                    {Object.entries(row).filter(([key]) => key !== 'STUDENT_NUM').map(([key, value], colIndex) => (
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

const renderLoadingStates = () => (
  <div className="flex flex-col items-center justify-center mt-4 space-y-2">
    <div className="flex items-center">
      <LoadingSpinner />
      <span className="ml-2">
        {isUploading ? (
          <span>
            Uploading grades... ({uploadProgress.current}/{uploadProgress.total})
            {uploadProgress.studentNum && (
              <span className="block text-sm text-gray-600">
                Currently processing: {uploadProgress.studentNum} - {uploadProgress.name}
              </span>
            )}
          </span>
        ) : (
          <span>
            Sending email notifications... ({currentEmailProgress.current}/{currentEmailProgress.total})
            {currentEmailProgress.studentNum && (
              <span className="block text-sm text-gray-600">
                Currently processing: {currentEmailProgress.studentNum} - {currentEmailProgress.name}
              </span>
            )}
          </span>
        )}
      </span>
    </div>
    <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ 
          width: `${(isUploading ? 
            (uploadProgress.current / uploadProgress.total) : 
            (currentEmailProgress.current / currentEmailProgress.total)
          ) * 100}%` 
        }}
      ></div>
    </div>
  </div>
);


return (
  <div className="flex h-screen bg-gray-100">
{/* Sidebar */}
<div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-md transition-all duration-300 ease-in-out flex flex-col`}>
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
    <SidebarItem 
      icon={Home} 
      label="Dashboard" 
      active={currentView === 'dashboard'}
      onClick={() => setCurrentView('dashboard')}
      iconSize={24}
    />
    <SidebarItem 
      icon={Upload} 
      label="Upload CSV" 
      active={currentView === 'upload'}
      onClick={() => setCurrentView('upload')}
      iconSize={24}
    />
  </nav>
  
  <div className="px-4 pb-4">
    <SidebarItem 
      icon={LogOut} 
      label="Logout" 
      onClick={handleLogout}
      iconSize={24}
    />
  </div>
</div>



    {/* Main Content */}
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        {currentView === 'dashboard' ? 'Teacher Dashboard' : 'Upload Grades'}
      </h1>
      
      {currentView === 'dashboard' && (
        <h2 className="text-xl font-semibold mb-4">
          {`Welcome, ${userInfo ? userInfo.name : 'Teacher'}  (${userInfo.id})`}
        </h2>
      )}
      
      {currentView === 'dashboard' ? renderDashboard() : renderUploadView()}
    </div>
  </div>
);
};

export default TeacherDashboard;