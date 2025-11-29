import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import { ArrowLeft, Loader2, Play, Save, Sparkles, Lightbulb, AlertTriangle, FileDown, MessageSquare, Terminal } from "lucide-react";
import { Link } from "react-router-dom";
import { executeCode, saveCode, getSnippetById, getAIHint } from "../api/code";
import { useUser } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";
import { socket } from "../socket";
import jsPDF from "jspdf";
import { LANGUAGE_VERSIONS, CODE_SNIPPETS } from "../constants";

interface Message {
  sender: string;
  message: string;
  isMe: boolean;
}

export default function InterviewRoom() {
  const { user } = useUser();
  const { id } = useParams();
  
  const [code, setCode] = useState("// Loading...");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [gettingHint, setGettingHint] = useState(false);

  // Chat State
  const [activeTab, setActiveTab] = useState<"output" | "chat">("output");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- SOCKET LOGIC ---
  useEffect(() => {
    if (!id) return;

    socket.emit("join-room", id);

    const handleCodeUpdate = (newCode: string) => setCode(newCode);
    const handleWarning = (msg: string) => toast(msg, { icon: '⚠️', style: { borderRadius: '10px', background: '#333', color: '#fff', border: '1px solid red' }, duration: 4000 });
    
    const handleMessage = (data: any) => {
        setMessages((prev) => {
            // Prevent adding the same message if it already exists (Simple Deduplication)
            // We check if the last message is identical to the incoming one
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.message === data.message && lastMsg.sender === data.sender) {
                return prev;
            }
            
            const isMe = data.sender === (user?.firstName || "Guest");
            return [...prev, { sender: data.sender, message: data.message, isMe }];
        });
        
        // Notify if chat is hidden
        const isMe = data.sender === (user?.firstName || "Guest");
        if (activeTab !== "chat" && !isMe) toast("New message in chat!", { icon: "💬" });
    };

    // NUCLEAR CLEANUP: Remove ANY existing listeners first
    socket.off("code-update");
    socket.off("receive-warning");
    socket.off("receive-message");

    // Attach Listeners
    socket.on("code-update", handleCodeUpdate);
    socket.on("receive-warning", handleWarning);
    socket.on("receive-message", handleMessage);

    return () => {
        socket.off("code-update");
        socket.off("receive-warning");
        socket.off("receive-message");
    };
  }, [id, activeTab, user]);

  // --- PROCTOR LOGIC ---
  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.hidden && id) socket.emit("signal-warning", id);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [id]);

  // --- AUTO SCROLL ---
  useEffect(() => {
    if (activeTab === "chat") {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // --- HANDLERS ---
  const onSelectLanguage = (lang: string) => {
    setLanguage(lang);
    const snippet = CODE_SNIPPETS[lang as keyof typeof CODE_SNIPPETS];
    setCode(snippet);
    if (id) socket.emit("code-change", { roomId: id, code: snippet });
  };

  const handleCodeChange = (newCode: string | undefined) => {
    const value = newCode || "";
    setCode(value);
    if (id) socket.emit("code-change", { roomId: id, code: value });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msgData = { sender: user?.firstName || "Guest", message: newMessage };
    
    // IMPORTANT: DO NOT add to local state here.
    // Wait for server to send it back via 'receive-message'
    
    if (id) socket.emit("send-message", { roomId: id, ...msgData });
    setNewMessage("");
  };

  const runCode = async () => {
    setIsLoading(true);
    setOutput(null);
    setActiveTab("output");
    try {
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
    doc.setFontSize(20); doc.text("Runbox Interview Report", 20, 20);
    doc.setFontSize(12); doc.text(`Candidate: ${user?.firstName || "Guest"}`, 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 38);
    doc.text(`Language: ${language.toUpperCase()}`, 20, 46);
    doc.setFontSize(14); doc.text("Final Code:", 20, 60);
    doc.setFontSize(10); doc.setFont("courier");
    const splitCode = doc.splitTextToSize(code, 170);
    doc.text(splitCode, 20, 70);
    if (hint) { doc.setFont("helvetica", "italic"); doc.setTextColor(100); doc.text("Note: AI Hints used.", 20, 280); }
    doc.save("Interview-Report.pdf");
    toast.success("Report Downloaded!");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Toaster position="top-center" />
      <header className="h-16 border-b border-gray-800 flex items-center px-6 bg-gray-900 justify-between">
        <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors"><ArrowLeft size={20} /></Link>
            <div className="relative group z-50">
                <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-mono border border-gray-700 hover:border-blue-500 transition-all uppercase flex items-center gap-2">
                    {language} <span className="text-gray-500 text-xs">▼</span>
                </button>
                <div className="absolute top-full left-0 mt-1 w-32 bg-[#1e1e1e] border border-gray-800 rounded-md shadow-xl overflow-hidden hidden group-hover:block">
                    {Object.keys(LANGUAGE_VERSIONS).map((lang) => (
                        <button key={lang} onClick={() => onSelectLanguage(lang)} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-blue-600 hover:text-white capitalize transition-colors">{lang}</button>
                    ))}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={generatePDF} className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-600/50 px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm"><FileDown size={16} /><span className="hidden md:inline">Report</span></button>
          <button onClick={handleGetHint} disabled={gettingHint} className="bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-600/50 px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm">{gettingHint ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}<span className="hidden md:inline">Hint</span></button>
          <button onClick={handleSave} disabled={isSaving} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm border border-gray-700"><Save size={16} /><span className="hidden md:inline">Save</span></button>
          <button onClick={runCode} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-bold transition-all flex items-center gap-2 shadow-lg shadow-green-900/20">{isLoading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />} Run</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-gray-800 flex flex-col bg-gray-900/50">
          <div className="p-6 overflow-y-auto flex-1 border-b border-gray-800">
            <h2 className="text-2xl font-bold mb-4">Output</h2>
            {hint && (
                <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg animate-in fade-in slide-in-from-top-2 mb-6">
                    <div className="flex items-center gap-2 mb-2 text-purple-300 font-bold"><Lightbulb size={18} /> AI Coach says:</div>
                    <p className="text-gray-300 text-sm leading-relaxed">{hint}</p>
                </div>
            )}
            <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 font-bold mb-1"><AlertTriangle size={16} /> Proctor Active</div>
                <p className="text-xs text-red-300/70">Tab switching is monitored.</p>
            </div>
          </div>

          <div className="h-1/2 flex flex-col bg-black border-t border-gray-800">
            <div className="flex border-b border-gray-800">
                <button onClick={() => setActiveTab("output")} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === "output" ? "text-blue-400 border-b-2 border-blue-400 bg-gray-900/50" : "text-gray-500 hover:text-gray-300"}`}><Terminal size={16} /> Output</button>
                <button onClick={() => setActiveTab("chat")} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === "chat" ? "text-green-400 border-b-2 border-green-400 bg-gray-900/50" : "text-gray-500 hover:text-gray-300"}`}><MessageSquare size={16} /> Chat</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm relative">
                {activeTab === "output" && (
                    <div className="h-full">
                       {output ? output.map((line, i) => <div key={i} className="text-green-400 mb-1">{line || " "}</div>) : <span className="text-gray-600 italic">// Run code to see output...</span>}
                    </div>
                )}
                {activeTab === "chat" && (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2">
                            {messages.length === 0 && <div className="text-gray-600 italic text-center mt-10">No messages yet.</div>}
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
                                    <span className="text-[10px] text-gray-500 mb-1">{msg.sender}</span>
                                    <div className={`px-3 py-2 rounded-lg max-w-[85%] break-words text-sm ${msg.isMe ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200"}`}>{msg.message}</div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} placeholder="Type a message..." className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                            <button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors"><ArrowLeft size={16} className="rotate-180" /></button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
        <div className="w-2/3 bg-[#1e1e1e]">
          <CodeEditor code={code} onChange={handleCodeChange} />
        </div>
      </div>
    </div>
  );
}