import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import { ArrowLeft, Loader2, Play, Save, Sparkles, Lightbulb, AlertTriangle, FileDown } from "lucide-react"; // Added FileDown Icon
import { Link } from "react-router-dom";
import { executeCode, saveCode, getSnippetById, getAIHint } from "../api/code";
import { useUser } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";
import { socket } from "../socket";
import jsPDF from "jspdf"; // Import PDF Generator

export default function InterviewRoom() {
  const { user } = useUser();
  const { id } = useParams();
  
  const [code, setCode] = useState("// Loading...");
  const [output, setOutput] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [gettingHint, setGettingHint] = useState(false);

  // --- 1. SOCKET & PROCTORING LOGIC ---
  useEffect(() => {
    if (id) {
      socket.emit("join-room", id);
      socket.on("code-update", (newCode) => setCode(newCode));
      socket.on("receive-warning", (msg) => {
        toast(msg, {
            icon: '⚠️',
            style: { borderRadius: '10px', background: '#333', color: '#fff', border: '1px solid red' },
            duration: 4000
        });
      });
    }

    const handleVisibilityChange = () => {
        if (document.hidden) {
            if (id) socket.emit("signal-warning", id);
        }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      socket.off("code-update");
      socket.off("receive-warning");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id]);

  // --- 2. LOAD CODE ---
  useEffect(() => {
    const loadSnippet = async () => {
      if (id && id !== "new") {
        try {
          const data = await getSnippetById(id);
          if (data.code) setCode(data.code);
        } catch (error) {
          toast.error("Could not load code");
        }
      } else {
        setCode("// Write your solution here\nconsole.log('Hello from Runbox!');");
      }
    };
    loadSnippet();
  }, [id]);

  // --- 3. LOGIC HANDLERS ---
  const handleCodeChange = (newCode: string | undefined) => {
    const value = newCode || "";
    setCode(value);
    if (id) socket.emit("code-change", { roomId: id, code: value });
  };

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

  const handleSave = async () => {
    if (!user) { toast.error("Please log in!"); return; }
    setIsSaving(true);
    try {
      await saveCode(user.id, code);
      toast.success("Code saved!");
    } catch (error) {
      toast.error("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetHint = async () => {
    setGettingHint(true);
    setHint(null);
    try {
        const data = await getAIHint(code);
        
        if (data.hint) {
            setHint(data.hint);
            toast.success("AI Hint Generated!", { icon: "💡" });
        } else {
            // If the backend sent an error, show it nicely
            toast.error("AI Error: " + (data.details || "Unknown error"));
        }
    } catch (error) {
        toast.error("AI is busy right now.");
    } finally {
        setGettingHint(false);
    }
  };

  // --- NEW: GENERATE PDF REPORT ---
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Runbox Interview Report", 20, 20);
    
    // Candidate Info
    doc.setFontSize(12);
    doc.text(`Candidate: ${user?.firstName || "Guest User"}`, 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 38);

    // Code Section
    doc.setFontSize(14);
    doc.text("Final Code:", 20, 50);
    doc.setFontSize(10);
    doc.setFont("courier"); // Monospace font for code
    
    // Split code into lines that fit the page
    const splitCode = doc.splitTextToSize(code, 170);
    doc.text(splitCode, 20, 60);

    // AI Hints Used
    if (hint) {
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        doc.text("Note: Candidate used AI Hints during this session.", 20, 280);
    }

    doc.save("Interview-Report.pdf");
    toast.success("Report Downloaded!");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Toaster position="top-center" />
      <header className="h-16 border-b border-gray-800 flex items-center px-6 bg-gray-900">
        <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors mr-4"><ArrowLeft size={20} /></Link>
        <h1 className="font-bold text-lg">Interview Room</h1>
        <div className="ml-auto flex gap-3">
          
          {/* PDF BUTTON */}
          <button onClick={generatePDF} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2">
            <FileDown size={18} />
            End Interview
          </button>

          <button onClick={handleGetHint} disabled={gettingHint} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2">
            {gettingHint ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            hint
          </button>
          <button onClick={handleSave} disabled={isSaving} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2">
            <Save size={18} />
            save
          </button>
          <button onClick={runCode} disabled={isLoading} className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            run
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-gray-800 flex flex-col bg-gray-900/50">
          <div className="p-6 overflow-y-auto flex-1 border-b border-gray-800">
            <h2 className="text-2xl font-bold mb-4">Problem Description</h2>
            <p className="text-gray-400 leading-relaxed mb-6">Write a function that prints "Hello World".</p>
            {hint && (
                <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2 text-purple-300 font-bold"><Lightbulb size={18} /> AI Coach says:</div>
                    <p className="text-gray-300 text-sm leading-relaxed">{hint}</p>
                </div>
            )}
            
            <div className="mt-8 bg-red-900/10 border border-red-500/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                    <AlertTriangle size={16} />
                    Proctor Mode Active
                </div>
                <p className="text-xs text-red-300/70">
                    Switching tabs will trigger a warning.
                </p>
            </div>

          </div>
          <div className="h-1/2 p-4 bg-black font-mono text-sm overflow-y-auto">
            <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Terminal Output</h3>
            {output ? output.map((line, i) => <div key={i} className="text-green-400">{line || " "}</div>) : <span className="text-gray-600 italic">Click 'Run Code' to see output...</span>}
          </div>
        </div>
        
        <div className="w-2/3 bg-[#1e1e1e]">
          <CodeEditor code={code} onChange={handleCodeChange} />
        </div>
      </div>
    </div>
  );
}