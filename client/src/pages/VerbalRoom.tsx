import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import Webcam from "react-webcam";
import "regenerator-runtime/runtime";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mic, MicOff, Video, VideoOff, Volume2 } from "lucide-react";
import { generateQuestion } from "../api/code";
import toast, { Toaster } from "react-hot-toast";

export default function VerbalRoom() {
  const { id } = useParams();
  const location = useLocation();
  
  const [question, setQuestion] = useState("Loading interview question...");
  const [isRecording, setIsRecording] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  // 1. GENERATE QUESTION
  useEffect(() => {
    const initSession = async () => {
        if (location.state?.role) {
            const { role, topic, experience } = location.state;
            try {
                // Request a Behavioral Question specifically
                const data = await generateQuestion(role, topic + " (Behavioral/Soft Skills)", experience);
                if (data.question) {
                    setQuestion(data.question);
                    // Speak it automatically (optional)
                    speakQuestion(data.question); 
                }
            } catch (err) {
                setQuestion("Tell me about a challenging project you worked on.");
            }
        } else {
            setQuestion("Tell me about a time you had to learn a new technology quickly.");
        }
    };
    initSession();
  }, []);

  // 2. TEXT TO SPEECH (AI Voice)
  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
  };

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

  if (!browserSupportsSpeechRecognition) {
    return <div className="text-white text-center mt-20">Browser doesn't support speech recognition. Use Chrome.</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center p-8">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-8">
        <Link to="/dashboard">
            <Button variant="ghost" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="mr-2" size={20} /> Back to Dashboard
            </Button>
        </Link>
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Behavioral Interview
        </h1>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT: QUESTION & TRANSCRIPT */}
        <div className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="text-blue-400">Interviewer Asks:</CardTitle>
                    <button onClick={() => speakQuestion(question)} className="p-2 bg-blue-500/10 rounded-full hover:bg-blue-500/20 text-blue-400">
                        <Volume2 size={20} />
                    </button>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-invert text-lg leading-relaxed whitespace-pre-wrap">
                        {question}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 h-[300px] flex flex-col">
                <CardHeader>
                    <CardTitle className="text-green-400 flex justify-between items-center">
                        Your Answer:
                        {listening && <span className="text-xs text-red-500 animate-pulse">● Recording...</span>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto bg-black/40 rounded-md m-4 p-4 border border-zinc-800/50">
                    <p className="text-zinc-300 whitespace-pre-wrap">
                        {transcript || "Click the microphone to start speaking..."}
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* RIGHT: WEBCAM & CONTROLS */}
        <div className="flex flex-col items-center space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl">
                {webcamEnabled ? (
                    <Webcam audio={false} mirrored={true} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">Camera Off</div>
                )}
                
                {/* Overlay Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10">
                    <button onClick={() => setWebcamEnabled(!webcamEnabled)} className={`p-3 rounded-full transition-all ${!webcamEnabled ? "bg-red-500/20 text-red-500" : "bg-zinc-700 hover:bg-zinc-600 text-white"}`}>
                        {webcamEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>
                    <button onClick={toggleRecording} className={`p-4 rounded-full transition-all scale-110 ${isRecording ? "bg-red-600 text-white animate-pulse shadow-red-500/50 shadow-lg" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                </div>
            </div>

            <Button className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20">
                Submit Answer for AI Review
            </Button>
        </div>

      </div>
    </div>
  );
}