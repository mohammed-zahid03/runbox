import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function InterviewModal() {
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("");
  const [topic, setTopic] = useState("");
  const [experience, setExperience] = useState("");
  const [mode, setMode] = useState("technical"); // NEW: Mode State
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!role || !topic || !experience) {
        toast.error("Please fill all fields");
        return;
    }

    setLoading(true);
    
    // Simulate AI Generation delay
    setTimeout(() => {
        setLoading(false);
        setOpen(false);
        
        // Generate a random Room ID
        const roomId = Math.random().toString(36).substring(7);
        
        // Navigate based on selected MODE
        if (mode === "verbal") {
            navigate(`/room/verbal/${roomId}`, { 
                state: { role, topic, experience, description, mode: "verbal" } 
            });
        } else {
            navigate(`/room/${roomId}`, { 
                state: { role, topic, experience, description, mode: "technical" } 
            });
        }
        
        toast.success("Interview Environment Ready!");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
            <Plus size={18} />
            New Interview
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Configure Interview</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          {/* NEW: INTERVIEW TYPE SELECTOR */}
          <div className="grid gap-2">
            <Label className="text-zinc-400">Interview Type</Label>
            <Select onValueChange={setMode} defaultValue={mode}>
              <SelectTrigger className="bg-black/50 border-zinc-700 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="technical">Technical (Coding)</SelectItem>
                <SelectItem value="verbal">Behavioral (Speaking)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-zinc-400">Job Role / Position</Label>
            <Input 
                placeholder="e.g. Full Stack Developer"
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                className="bg-black/50 border-zinc-700 focus:border-blue-500 text-white" 
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-zinc-400">Tech Stack (comma separated)</Label>
            <Input 
                placeholder="e.g. React, Node.js, Java"
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                className="bg-black/50 border-zinc-700 focus:border-blue-500 text-white" 
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-zinc-400">Job Description (Paste from LinkedIn)</Label>
            <textarea 
                placeholder="Paste the full job description here..."
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="bg-black/50 border-zinc-700 focus:border-blue-500 text-white min-h-[100px] p-2 rounded-md text-sm" 
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-zinc-400">Years of Experience</Label>
            <Input 
                placeholder="e.g. 2"
                type="number"
                value={experience} 
                onChange={(e) => setExperience(e.target.value)} 
                className="bg-black/50 border-zinc-700 focus:border-blue-500 text-white" 
            />
          </div>

        </div>
        <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} className="border-zinc-700 hover:bg-zinc-800 text-gray-300">
                Cancel
            </Button>
            <Button onClick={handleStart} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Start Session"}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}