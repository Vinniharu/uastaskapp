import Link from "next/link";

export default function NotFound() {
  return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-6xl font-bold text-gray-900 mb-4">404</h2>
        <h3 className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h3>
        <p className="text-gray-500 mb-8 max-w-md">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="px-6 py-3 bg-[#111827] text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
  );
}
