import { useState, useRef, useEffect } from "react"
import { Eye, EyeOff, Lock, User, ChevronUp } from "lucide-react"

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const formRef = useRef(null)

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
    e.preventDefault()
    try {
      const response = await fetch("http://localhost:5000/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          email: username,
          password: password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const userInfo = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          ...(data.user.student_id && { studentId: data.user.student_id }),
        }

        localStorage.setItem(
          data.user.role === "student" ? "userInfo" : "teacherInfo",
          JSON.stringify(userInfo)
        )
        onLogin(true, data.user.role)
      } else {
        alert(data.message || "Login failed. Please check your credentials.")
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("An error occurred while trying to log in. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Desktop View */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[url('/login-bg.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-blue-900/90" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white h-full">
          <h1 className="text-5xl font-bold leading-tight mb-4">
            Student Grade
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
        {/* Welcome Screen */}
        <div className="lg:hidden flex flex-col items-center justify-center h-full px-6 text-center">
          {/* Added plain image */}
          <img 
            src="https://marketplace.canva.com/EAE1N1HOFho/1/0/900w/canva-image-background-dark-green-phone-wallpaper-Ybf9RZciQtI.jpg" 
            alt="ECR Logo" 
            className="w-48 h-48 mb-8 object-contain"
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to ECR
          </h1>
          <p className="text-gray-600 mb-8">
            Your comprehensive student grade management
          </p>
          <button
            aria-label="toggle-login"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-8 py-3 rounded-full hover:bg-blue-600 transition-all duration-300"
          >
            Login <ChevronUp className={`transform ${isFormOpen ? 'rotate-180' : ''} transition-transform duration-300`} />
          </button>
        </div>

        {/* Sliding Login Form */}
        <div
          ref={formRef}
          className={`absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-lg transform transition-transform duration-500 ease-in-out ${
            isFormOpen ? "translate-y-0" : "translate-y-full"
          } lg:translate-y-0 lg:static lg:shadow-none lg:rounded-none flex items-center justify-center`}
        >
          <div className="relative w-full max-w-md mx-auto px-6 py-12 flex flex-col justify-center items-center h-[95vh] text-center lg:text-left lg:items-start">
            <div className="lg:hidden absolute left-1/2 -translate-x-1/2 -top-8 w-12 h-1.5 bg-gray-300 rounded-full mb-8" />

            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center ">
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

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Forgot password?
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