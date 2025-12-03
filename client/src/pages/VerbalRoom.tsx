import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import Webcam from "react-webcam";
import "regenerator-runtime/runtime";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Sparkles, Loader2 } from "lucide-react";
import { generateQuestion, getFeedback } from "../api/code";
import toast, { Toaster } from "react-hot-toast";
import ReactMarkdown from "react-markdown";

export default function VerbalRoom() {
  const { id } = useParams();
  const location = useLocation();
  
  const [question, setQuestion] = useState("Loading interview question...");
  const [isRecording, setIsRecording] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Ref to prevent double-speaking on re-renders
  const hasSpokenRef = useRef(false);

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  // 1. TEXT TO SPEECH (With Stop Capability)
  const speakQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) {
        toast.error("Text-to-speech not supported.");
        return;
    }

    if (isSpeaking) {
        // STOP speaking
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    } else {
        // START speaking
        window.speechSynthesis.cancel(); // Clear queue
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    }
  };

  // Stop speaking when leaving page
  useEffect(() => {
    return () => {
        window.speechSynthesis.cancel();
    };
  }, []);

  // 2. GENERATE QUESTION & SPEAK ONCE
  useEffect(() => {
    const initSession = async () => {
        if (location.state?.role) {
            const { role, topic, experience } = location.state;
            try {
                // Only fetch if we haven't already (simple check)
                if (question === "Loading interview question...") {
                    const data = await generateQuestion(role, topic + " (Behavioral/Soft Skills)", experience);
                    if (data.question) {
                        setQuestion(data.question);
                        
                        // Speak ONLY if we haven't spoken this question yet
                        if (!hasSpokenRef.current) {
                            setTimeout(() => {
                                // Double check ref inside timeout to be safe
                                if (!hasSpokenRef.current) {
                                    speakQuestion(data.question);
                                    hasSpokenRef.current = true;
                                }
                            }, 1000);
                        }
                    }
                }
            } catch (err) {
                setQuestion("Tell me about a challenging project you worked on.");
            }
        } else {
            setQuestion("Tell me about a time you had to learn a new technology quickly.");
        }
    };
    
    initSession();
  }, [location.state]); // Dependency array protects against loops

  // 3. HANDLE RECORDING
  const toggleRecording = () => {
    if (isRecording) {
        SpeechRecognition.stopListening();
        toast.success("Answer Recorded!");
    } else {
        resetTranscript();
        SpeechRecognition.startListening({ continuous: true });
    }
    setIsRecording(!isRecording);
  };

  // 4. SUBMIT ANSWER
  const handleSubmitAnswer = async () => {
    if (!transcript) {
        toast.error("Please record an answer first!");
        return;
    }
    
    setAnalyzing(true);
    try {
        const data = await getFeedback(question, transcript);
        if (data.feedback) {
            setFeedback(data.feedback);
            toast.success("Feedback Generated!");
        }
    } catch (error) {
        toast.error("Failed to get feedback.");
    } finally {
        setAnalyzing(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <div className="text-white text-center mt-20">Browser doesn't support speech recognition. Please use Chrome.</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center p-8">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-8">
        <Link to="/dashboard">
            <Button variant="ghost" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="mr-2" size={20} /> Back to Dashboard
            </Button>
        </Link>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Behavioral Interview
        </h1>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6 flex flex-col h-full">
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl">
                <CardHeader className="flex flex-row justify-between items-center pb-2">
                    <CardTitle className="text-blue-400 text-lg">Interviewer Asks:</CardTitle>
                    <button 
                        onClick={() => speakQuestion(question)} 
                        className={`p-2 rounded-full transition-colors ${isSpeaking ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"}`}
                        title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                    >
                        {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-invert text-lg leading-relaxed whitespace-pre-wrap font-medium text-zinc-100">
                        {question}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 flex-1 flex flex-col min-h-[300px] shadow-xl">
                <CardHeader>
                    <CardTitle className="text-green-400 flex justify-between items-center text-lg">
                        Your Answer:
                        {listening && <span className="text-xs text-red-500 animate-pulse flex items-center gap-1">● Recording...</span>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="h-full bg-black/40 rounded-lg p-4 border border-zinc-800/50 overflow-y-auto min-h-[200px]">
                        <p className="text-zinc-300 whitespace-pre-wrap text-lg leading-relaxed">
                            {transcript || <span className="text-zinc-600 italic">Click the microphone to start speaking...</span>}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl group">
                {webcamEnabled ? (
                    <Webcam audio={false} mirrored={true} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                        <VideoOff size={48} />
                        <span className="text-sm">Camera Off</span>
                    </div>
                )}
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-lg transition-transform hover:scale-105">
                    <button onClick={() => setWebcamEnabled(!webcamEnabled)} className={`p-3 rounded-full transition-all ${!webcamEnabled ? "bg-red-500/20 text-red-500" : "bg-zinc-700 hover:bg-zinc-600 text-white"}`}>
                        {webcamEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                    </button>
                    <button onClick={toggleRecording} className={`p-4 rounded-full transition-all scale-110 shadow-lg ${isRecording ? "bg-red-600 text-white animate-pulse shadow-red-500/50" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"}`}>
                        {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                    </button>
                </div>
            </div>

            <Button 
                onClick={handleSubmitAnswer} 
                disabled={analyzing || !transcript}
                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {analyzing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" size={20} />}
                {analyzing ? "Analyzing Answer..." : "Submit Answer for AI Review"}
            </Button>

            {/* AI FEEDBACK CARD */}
            {/* AI FEEDBACK CARD */}
            {feedback && (
                <Card className="w-full bg-zinc-900 border-purple-500/30 animate-in fade-in slide-in-from-bottom-4 shadow-xl shadow-purple-900/10 mt-6">
                    <CardHeader>
                        <CardTitle className="text-purple-400 flex items-center gap-2">
                            <Sparkles size={20} /> AI Feedback Report
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[400px] overflow-y-auto bg-black/40 p-4 rounded-lg border border-white/5">
                            <ReactMarkdown 
                                className="prose prose-invert prose-sm max-w-none text-zinc-300"
                                components={{
                                    strong: ({node, ...props}) => <span className="text-purple-300 font-bold" {...props} />,
                                    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mb-2 mt-4" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mb-2 mt-4" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-md font-bold text-blue-300 mb-1 mt-2" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                                    li: ({node, ...props}) => <li className="text-zinc-400" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-2" {...props} />,
                                }}
                            >
                                {feedback}
                            </ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

      </div>
    </div>
  );
}