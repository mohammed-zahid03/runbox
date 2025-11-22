import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      
      {/* Top Right User Button (Shows when logged in) */}
      <div className="absolute top-5 right-5">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>

      <div className="flex items-center gap-4 mb-8 animate-pulse">
        <Code2 size={64} className="text-blue-500" />
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Runbox
        </h1>
      </div>
      
      <p className="text-xl text-gray-400 mb-8 max-w-md text-center">
        The ultimate real-time interview platform for developers.
      </p>

      {/* If User is LOGGED OUT, show Login Button */}
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/50">
            Get Started
          </button>
        </SignInButton>
      </SignedOut>

      {/* If User is LOGGED IN, show Dashboard Link */}
      <SignedIn>
        <Link 
          to="/dashboard" 
          className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-green-500/50"
        >
          Go to Dashboard
        </Link>
      </SignedIn>
      
    </div>
  );
}