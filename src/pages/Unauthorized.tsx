import { Link } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';

const Unauthorized = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
        
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        
        {user && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Current Role:</span> {user.role}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <Link
            to={getDashboardRoute(user?.role)}
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </Link>
          
          <Link
            to="/"
            className="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

// Helper to get dashboard route based on role
const getDashboardRoute = (role?: string): string => {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'OPS_MANAGER':
      return '/ops';
    case 'ANNOTATOR':
      return '/annotator';
    case 'REVIEWER':
      return '/reviewer';
    case 'CUSTOMER':
      return '/customer';
    default:
      return '/';
  }
};

export default Unauthorized;
