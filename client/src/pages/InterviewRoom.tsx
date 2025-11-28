import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import { ArrowLeft, Loader2, Play, Save, Sparkles, Lightbulb, AlertTriangle, FileDown } from "lucide-react";
import { Link } from "react-router-dom";
import { executeCode, saveCode, getSnippetById, getAIHint } from "../api/code";
import { useUser } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";
import { socket } from "../socket";
import jsPDF from "jspdf";
import { LANGUAGE_VERSIONS, CODE_SNIPPETS } from "../constants"; // Import constants

export default function InterviewRoom() {
  const { user } = useUser();
  const { id } = useParams();
  
  const [code, setCode] = useState("// Loading...");
  const [language, setLanguage] = useState("javascript"); // Language State
  const [output, setOutput] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [gettingHint, setGettingHint] = useState(false);

  // --- LANGUAGE HANDLER ---
  const onSelectLanguage = (lang: string) => {
    setLanguage(lang);
    // Update code to the starter snippet for that language
    const snippet = CODE_SNIPPETS[lang as keyof typeof CODE_SNIPPETS];
    setCode(snippet);
    
    // Sync language change via socket (Optional advanced feature)
    if (id) {
        socket.emit("code-change", { roomId: id, code: snippet });
    }
  };

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

  // --- 2. LOAD SAVED CODE ---
  useEffect(() => {
    const loadSnippet = async () => {
      if (id && id !== "new") {
        try {
          const data = await getSnippetById(id);
          if (data.code) {
              setCode(data.code);
              // Ideally, backend should save/return language too. 
              // For now, we default to JS or auto-detect if we added that field.
              if (data.language) setLanguage(data.language);
          }
        } catch (error) {
          toast.error("Could not load code");
        }
      } else {
        setCode(CODE_SNIPPETS["javascript"]); // Default to JS snippet
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
      // USE THE SELECTED LANGUAGE HERE
      const result = await executeCode(language, code);
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
      // Pass language to save function if backend supports it
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
            toast.error("AI Error: " + (data.details || "Unknown error"));
        }
    } catch (error) {
        toast.error("AI is busy right now.");
    } finally {
        setGettingHint(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Runbox Interview Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Candidate: ${user?.firstName || "Guest User"}`, 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 38);
    doc.text(`Language: ${language.toUpperCase()}`, 20, 46); // Add Language to PDF
    
    doc.setFontSize(14);
    doc.text("Final Code:", 20, 60);
    doc.setFontSize(10);
    doc.setFont("courier");
    const splitCode = doc.splitTextToSize(code, 170);
    doc.text(splitCode, 20, 70);

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
      
      {/* HEADER */}
      <header className="h-16 border-b border-gray-800 flex items-center px-6 bg-gray-900 justify-between">
        <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
            </Link>
            
            {/* LANGUAGE DROPDOWN */}
            <div className="relative group z-50">
                <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-mono border border-gray-700 hover:border-blue-500 transition-all uppercase flex items-center gap-2">
                    {language}
                    <span className="text-gray-500 text-xs">▼</span>
                </button>
                <div className="absolute top-full left-0 mt-1 w-32 bg-[#1e1e1e] border border-gray-800 rounded-md shadow-xl overflow-hidden hidden group-hover:block">
                    {Object.keys(LANGUAGE_VERSIONS).map((lang) => (
                        <button
                            key={lang}
                            onClick={() => onSelectLanguage(lang)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-blue-600 hover:text-white capitalize transition-colors"
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          <button onClick={generatePDF} className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-600/50 px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm">
            <FileDown size={16} />
            <span className="hidden md:inline">Report</span>
          </button>

          <button onClick={handleGetHint} disabled={gettingHint} className="bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-600/50 px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm">
            {gettingHint ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            <span className="hidden md:inline">Hint</span>
          </button>

          <button onClick={handleSave} disabled={isSaving} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm border border-gray-700">
            <Save size={16} />
            <span className="hidden md:inline">Save</span>
          </button>

          <button onClick={runCode} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-bold transition-all flex items-center gap-2 shadow-lg shadow-green-900/20">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            Run
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-1/3 border-r border-gray-800 flex flex-col bg-gray-900/50">
          <div className="p-6 overflow-y-auto flex-1 border-b border-gray-800">
            <h2 className="text-2xl font-bold mb-4">Output</h2>
            
            {/* HINT BOX */}
            {hint && (
                <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg animate-in fade-in slide-in-from-top-2 mb-6">
                    <div className="flex items-center gap-2 mb-2 text-purple-300 font-bold"><Lightbulb size={18} /> AI Coach says:</div>
                    <p className="text-gray-300 text-sm leading-relaxed">{hint}</p>
                </div>
            )}
            
            {/* PROCTOR BOX */}
            <div className="mt-4 bg-red-900/10 border border-red-500/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                    <AlertTriangle size={16} />
                    Proctor Active
                </div>
                <p className="text-xs text-red-300/70">
                    Tab switching is monitored.
                </p>
            </div>

            {/* TERMINAL */}
            <div className="mt-6 bg-black rounded-lg border border-gray-800 p-4 font-mono text-sm overflow-x-auto min-h-[200px]">
                <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                    <span className="text-gray-500 text-xs">CONSOLE</span>
                    <span className="text-gray-600 text-xs">Read-Only</span>
                </div>
                {output ? output.map((line, i) => <div key={i} className="text-green-400">{line || " "}</div>) : <span className="text-gray-600 italic">// Output will appear here...</span>}
            </div>
          </div>
        </div>
        
        {/* RIGHT PANEL (EDITOR) */}
        <div className="w-2/3 bg-[#1e1e1e]">
          <CodeEditor code={code} onChange={handleCodeChange} />
        </div>
      </div>
    </div>
  );
}