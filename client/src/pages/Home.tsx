import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Code2, Cpu, Globe, Zap, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30">
      
      {/* 1. NAVBAR */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Code2 className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">Runbox</span>
          </div>
          
          <div>
            <SignedIn>
              <Link to="/dashboard">
                <Button variant="secondary" className="font-medium">Dashboard</Button>
              </Link>
              <span className="ml-4"><UserButton afterSignOutUrl="/" /></span>
            </SignedIn>
            
            <SignedOut>
               <SignInButton mode="modal">
                 <Button className="bg-white text-black hover:bg-zinc-200">Sign In</Button>
               </SignInButton>
            </SignedOut>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <div className="relative overflow-hidden pt-20 pb-32">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-6 inline-block">
              🚀 The Future of Technical Interviews
            </span>
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight mb-6">
              Code. Compile. <br />
              <span className="text-blue-500">Collaborate.</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              A real-time collaborative coding environment powered by AI. 
              Run code in the cloud, get instant hints, and conduct interviews like a pro.
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20">
                    Start Coding for Free
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard">
                  <Button size="lg" className="h-14 px-8 text-lg bg-green-600 hover:bg-green-700 shadow-xl shadow-green-500/20">
                    Go to Workspace
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. FEATURES GRID */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Feature 1 */}
          <Card className="bg-zinc-900/50 border-white/10 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <Cpu className="text-blue-400" size={24} />
              </div>
              <CardTitle className="text-xl text-white">Multi-Language Runner</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400">
                Execute JavaScript, Python, and Java code instantly in secure cloud sandboxes. No setup required.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="bg-zinc-900/50 border-white/10 hover:border-purple-500/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-purple-400" size={24} />
              </div>
              <CardTitle className="text-xl text-white">AI Interview Coach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400">
                Stuck on a problem? Get intelligent hints from Gemini AI without revealing the full solution.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="bg-zinc-900/50 border-white/10 hover:border-green-500/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <Globe className="text-green-400" size={24} />
              </div>
              <CardTitle className="text-xl text-white">Real-Time Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400">
                Type code and see it appear on your interviewer's screen instantly with <span className="text-white">Socket.io</span>.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 4. FOOTER */}
      <footer className="border-t border-white/10 py-10 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-zinc-500 text-sm">
          <p>© 2025 Runbox. Built for Engineers.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-white cursor-pointer">GitHub</span>
          </div>
        </div>
      </footer>

    </div>
  );
}