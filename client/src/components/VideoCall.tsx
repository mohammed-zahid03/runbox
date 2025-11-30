import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, X, GripHorizontal } from "lucide-react";

export default function VideoCall() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // Store stream separately

  // 1. GET CAMERA ACCESS
  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream; // Save to memory
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("Camera Error:", err));
    } else {
        // Cleanup when widget closes
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }
  }, [isOpen]);

  // Re-attach stream when toggling video back ON
  useEffect(() => {
    if (!isVideoOff && videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
    }
  }, [isVideoOff]);

  // 2. TOGGLE CONTROLS
  const toggleMute = () => {
    if (streamRef.current) {
        const audioTrack = streamRef.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
        }
    }
  };

  if (!isOpen) return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 p-4 rounded-full shadow-xl hover:bg-blue-700 transition-all z-50 animate-bounce"
      >
        <Video className="text-white" />
      </button>
  );

  return (
    <motion.div 
      drag 
      dragMomentum={false} // Stops it from sliding like ice
      className="fixed bottom-4 right-4 w-64 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl z-50"
    >
      {/* HEADER (Drag Handle) */}
      <div className="flex justify-between items-center p-2 bg-zinc-800 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2 text-zinc-400">
            <GripHorizontal size={16} />
            <span className="text-xs font-medium">My Camera</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-red-500/20 p-1 rounded-md transition-colors">
            <X size={14} className="text-zinc-400 hover:text-red-400" />
        </button>
      </div>

      {/* VIDEO AREA */}
      <div className="relative h-40 bg-black flex items-center justify-center overflow-hidden">
        {!isVideoOff ? (
            <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover transform scale-x-[-1]" 
            /> 
        ) : (
            <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
                <VideoOff size={24} />
                <span className="text-xs">Camera Off</span>
            </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="flex justify-center gap-4 p-3 bg-zinc-900">
        <button 
            onClick={toggleMute} 
            className={`p-2 rounded-full transition-all ${isMuted ? "bg-red-500/20 text-red-500" : "bg-zinc-800 hover:bg-zinc-700 text-white"}`}
        >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button 
            onClick={toggleVideo} 
            className={`p-2 rounded-full transition-all ${isVideoOff ? "bg-red-500/20 text-red-500" : "bg-zinc-800 hover:bg-zinc-700 text-white"}`}
        >
            {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
        </button>
      </div>
    </motion.div>
  );
}