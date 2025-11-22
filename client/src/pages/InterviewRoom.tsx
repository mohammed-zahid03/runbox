import CodeEditor from "../components/CodeEditor";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function InterviewRoom() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center px-6 bg-gray-900">
        <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors mr-4">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-lg">Interview Room: <span className="text-blue-400">Two Sum</span></h1>
        <div className="ml-auto">
          <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md font-medium transition-all">
            Run Code
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Problem Description */}
        <div className="w-1/3 border-r border-gray-800 p-6 overflow-y-auto bg-gray-900/50">
          <h2 className="text-2xl font-bold mb-4">Problem Description</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.
          </p>
          <p className="text-gray-400 leading-relaxed">
            You may assume that each input would have exactly one solution, and you may not use the same element twice.
          </p>
        </div>

        {/* Right Side: Code Editor */}
        <div className="w-2/3 bg-[#1e1e1e]">
          <CodeEditor />
        </div>
      </div>
    </div>
  );
}