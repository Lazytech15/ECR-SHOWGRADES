import { useState, useRef, useEffect } from "react"
import { Eye, EyeOff, Lock, User, ChevronUp } from "lucide-react"
import LoadingSpinner from '../Loadinganimation/Loading';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const formRef = useRef(null)
  const [loading, setLoading] = useState(false);
  
  const API_URL = 'https://ecr-api-connection-database.netlify.app/.netlify/functions/service-database';

  useEffect(() => {
    function handleClickOutside(event) {
      if (window.innerWidth < 1024 && isFormOpen && formRef.current && !formRef.current.contains(event.target)) {
        const welcomeButton = document.querySelector('button[aria-label="toggle-login"]');
        if (!welcomeButton?.contains(event.target)) {
          setIsFormOpen(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isFormOpen])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await fetch(`${API_URL}/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "login",
                loginInput: username.trim(),
                loginType: username.includes('@') ? 'email' : 'username',
                password: password,
            }),
        });

        const data = await response.json();

        if (data.success) {
            let userInfo;

            // Determine the appropriate ID based on user role
            if (data.user.role === 'student') {
                userInfo = {
                    id: data.user.student_id,
                    email: data.user.email,
                    name: data.user.name,
                    role: data.user.role,
                };
            } else if (data.user.role === 'teacher') {
                userInfo = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    role: data.user.role,
                };
            } else if (data.user.role === 'admin') {
                userInfo = {
                    id: null, // Admin has no ID
                    email: data.user.email,
                    name: data.user.name,
                    role: data.user.role,
                };
            }

            // Clear any existing auth data
            localStorage.removeItem('studentInfo');
            localStorage.removeItem('teacherInfo');
            localStorage.removeItem('adminInfo');

            // Set the appropriate storage item based on role
            if (data.user.role === 'admin') {
                localStorage.setItem('adminInfo', JSON.stringify(userInfo));
            } else if (data.user.role === 'student') {
                localStorage.setItem('studentInfo', JSON.stringify(userInfo));
            } else if (data.user.role === 'teacher') {
                localStorage.setItem('teacherInfo', JSON.stringify(userInfo));
            }
            onLogin(true, data.user.role);
        } else {
            alert(data.message || "Login failed. Please check your credentials.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred while trying to log in. Please try again.");
    } finally {
        setLoading(false);
    }
};


  if (loading) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="md" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Desktop View */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[url('./src/assets/bg-log.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black opacity-80"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white h-full">
          <h1 className="text-5xl font-bold leading-tight mb-4">
            ECR Grade
            <br />
            Management System
          </h1>
          <p className="text-blue-100 text-lg">
            Access your academic records and track your progress with our
            comprehensive grading system
          </p>
        </div>
      </div>

      {/* Mobile View */}
      <div className="w-full lg:w-1/2 relative h-screen overflow-hidden">
        {/* Welcome Screen with Background Image */}
        <div className="lg:hidden flex flex-col items-center justify-center h-full px-6 text-center relative">
          {/* Background Image Container */}
          {/* https://marketplace.canva.com/EAE1N1HOFho/1/0/900w/canva-image-background-dark-green-phone-wallpaper-Ybf9RZciQtI.jpg */}
          <div className="absolute inset-0 bg-[url('./src/assets/bg-log.jpg')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black opacity-60"></div>
          </div>
          {/* Content */}
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-4 text-center">
              Welcome to ECR
            </h1>
            <p className="text-gray-200 mb-8">
              Your comprehensive student grade management
            </p>
            <button
              aria-label="toggle-login"
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-8 py-3 rounded-full hover:bg-blue-600 transition-all duration-300 mx-auto"
            >
              Login <ChevronUp className={`transform ${isFormOpen ? 'rotate-180' : ''} transition-transform duration-300`} />
            </button>
          </div>
        </div>

        {/* Sliding Login Form */}
        <div
          ref={formRef}
          className={`absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-lg transform transition-transform duration-500 ease-in-out ${
            isFormOpen ? "translate-y-0" : "translate-y-full"
          } lg:translate-y-0 lg:static lg:shadow-none lg:rounded-none flex items-center justify-center z-1000`}
        >
          <div className="relative w-full max-w-md mx-auto px-6 py-12 flex flex-col justify-center items-center h-[95vh] text-center lg:text-left lg:items-start">
            <div className="lg:hidden absolute left-1/2 -translate-x-1/2 -top-8 w-12 h-1.5 bg-gray-300 rounded-full mb-8" />

            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Welcome Back
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 w-full">
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Username or Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>

              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition duration-300 font-medium"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage