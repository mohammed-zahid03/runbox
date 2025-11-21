import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-4 mb-8 animate-pulse">
        <Code2 size={64} className="text-blue-500" />
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Runbox
        </h1>
      </div>
      <p className="text-xl text-gray-400 mb-8 max-w-md text-center">
        The ultimate real-time interview platform for developers.
      </p>
      <Link 
        to="/dashboard" 
        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/50"
      >
        Try Dashboard
      </Link>
    </div>
  );
}