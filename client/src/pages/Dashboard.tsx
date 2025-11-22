import { UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Code2, LogOut } from "lucide-react";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Header */}
      <nav className="border-b border-gray-800 p-4 flex justify-between items-center bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:text-blue-400 transition-colors">
          <Code2 className="text-blue-500" />
          Runbox
        </Link>
        
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden md:block">
            Welcome, {user?.firstName}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400 mb-8">Select a room to interview or practice.</p>

        {/* Example Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/room/123" className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all cursor-pointer group">
                <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/20">
                    <Code2 className="text-blue-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">New Interview</h3>
                <p className="text-sm text-gray-400">Start a fresh coding session.</p>
            </Link>
        </div>
      </div>
    </div>
  );
}