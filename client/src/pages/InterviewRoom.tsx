import { useState } from "react";
import CodeEditor from "../components/CodeEditor";
import { ArrowLeft, Loader2, Play, Save } from "lucide-react"; 
import { Link } from "react-router-dom";
import { executeCode, saveCode } from "../api/code"; // Importing from new file
import { useUser } from "@clerk/clerk-react"; 
import toast, { Toaster } from "react-hot-toast"; // Notification tool

export default function InterviewRoom() {
  const { user } = useUser();
  const [code, setCode] = useState("// Write your solution here\nconsole.log('Hello from Runbox!');");
  const [output, setOutput] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Run Code Logic
  const runCode = async () => {
    setIsLoading(true);
    setOutput(null);
    try {
      const result = await executeCode("javascript", code);
      const logs = result.run.stdout ? result.run.stdout.split("\n") : [];
      const errors = result.run.stderr ? result.run.stderr.split("\n") : [];
      setOutput([...logs, ...errors]);
    } catch (error) {
      setOutput(["Error executing code."]);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Code Logic
  const handleSave = async () => {
    if (!user) {
        toast.error("Please log in to save!");
        return;
    }
    setIsSaving(true);
    try {
      await saveCode(user.id, code);
      toast.success("Code saved to Cloud!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Toaster position="top-center" /> {/* This is the popup container */}
      
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center px-6 bg-gray-900">
        <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors mr-4">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-lg">Interview Room: <span className="text-blue-400">Two Sum</span></h1>
        
        {/* Buttons */}
        <div className="ml-auto flex gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-md font-medium transition-all flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save"}
          </button>

          <button 
            onClick={runCode}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-5 py-2 rounded-md font-medium transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            {isLoading ? "Running..." : "Run Code"}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-gray-800 flex flex-col bg-gray-900/50">
          <div className="p-6 overflow-y-auto flex-1 border-b border-gray-800">
            <h2 className="text-2xl font-bold mb-4">Problem Description</h2>
            <p className="text-gray-400 leading-relaxed mb-4">Write a function that prints "Hello World".</p>
          </div>
          <div className="h-1/2 p-4 bg-black font-mono text-sm overflow-y-auto">
            <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Terminal Output</h3>
            {output ? output.map((line, i) => <div key={i} className="text-green-400">{line || " "}</div>) : <span className="text-gray-600 italic">Click 'Run Code' to see output...</span>}
          </div>
        </div>
        <div className="w-2/3 bg-[#1e1e1e]">
          <CodeEditor code={code} onChange={(value) => setCode(value || "")} />
        </div>
      </div>
    </div>
  );
}