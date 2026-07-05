// src/pages/NotFound.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function NotFound() {
  const { user, profile } = useAuth();

  // Determine the appropriate home link based on role
  const getHomeLink = () => {
    if (!user) return "/";
    if (profile?.role === "admin") return "/admin";
    if (profile?.role === "intern") return "/intern";
    return "/";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Large 404 graphic */}
        <div className="mb-8">
          <svg
            className="w-48 h-48 mx-auto text-[#0080c8]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-6xl font-extrabold text-gray-800 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>

        <Link
          to={getHomeLink()}
          className="inline-flex items-center px-6 py-3 bg-[#0080c8] text-white font-medium rounded-lg hover:bg-[#006fa8] transition-colors shadow-md hover:shadow-lg"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Go Home
        </Link>

        <div className="mt-6 text-sm text-gray-400">
          If you think this is a mistake, please contact support.
        </div>
      </div>
    </div>
  );
}