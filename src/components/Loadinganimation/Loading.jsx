const LoadingSpinner = ({ size = "md" }) => {
    const sizeClasses = {
      sm: "w-6 h-6",
      md: "w-8 h-8",
      lg: "w-12 h-12"
    };
  
    return (
      <div className="flex items-center justify-center">
        <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin`}></div>
      </div>
    );
  };
  
  export default LoadingSpinner;


//   import LoadingSpinner from './components/LoadingSpinner';

// // Use it with default size (medium)
// <LoadingSpinner />

// // Or specify a size
// <LoadingSpinner size="sm" />
// <LoadingSpinner size="md" />
// <LoadingSpinner size="lg" />