import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Code2, Cpu, Globe, Zap, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  // Show a spinner while Clerk is checking login status
  if (!isLoaded) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>;
  }

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
            {isSignedIn ? (
                <div className="flex items-center gap-4">
                    <Link to="/dashboard">
                        <Button variant="secondary" className="font-medium">Dashboard</Button>
                    </Link>
                    <UserButton afterSignOutUrl="/" />
                </div>
            ) : (
               <SignInButton mode="modal">
                 <Button className="bg-white text-black hover:bg-zinc-200 font-bold">Sign In</Button>
               </SignInButton>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <div className="relative overflow-hidden pt-20 pb-32">
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
              The Future of Technical Interviews is <br />
              <span className="text-blue-500">Synchronized.</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Runbox combines real-time collaboration, secure cloud execution, and Gemini AI into a single, zero-latency environment. Eliminate friction. Hire talent faster.
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              {isSignedIn ? (
                <Link to="/dashboard">
                  <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20">
                    Launch Intelligent Workspace
                  </Button>
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20">
                    Launch Intelligent Workspace
                  </Button>
                </SignInButton>
              )}
              
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white backdrop-blur-md">
                Watch the 2-Minute Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. FEATURES GRID (Clickable) */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Feature 1 */}
          <Link to="/dashboard" className="group block h-full">
            <Card className="h-full bg-zinc-900/50 border-white/10 group-hover:border-blue-500/50 group-hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Cpu className="text-blue-400" size={24} />
                </div>
                <CardTitle className="text-xl text-white group-hover:text-blue-400 transition-colors">Multi-Language Runner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Execute JavaScript, Python, and Java code instantly in secure cloud sandboxes. No setup required.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Feature 2 */}
          <Link to="/dashboard" className="group block h-full">
            <Card className="h-full bg-zinc-900/50 border-white/10 group-hover:border-purple-500/50 group-hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="text-purple-400" size={24} />
                </div>
                <CardTitle className="text-xl text-white group-hover:text-purple-400 transition-colors">AI Interview Coach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Stuck on a problem? Get intelligent hints from Gemini AI without revealing the full solution.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Feature 3 */}
          <Link to="/dashboard" className="group block h-full">
            <Card className="h-full bg-zinc-900/50 border-white/10 group-hover:border-green-500/50 group-hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="text-green-400" size={24} />
                </div>
                <CardTitle className="text-xl text-white group-hover:text-green-400 transition-colors">Real-Time Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Type code and see it appear on your interviewer's screen instantly with <span className="text-white">Socket.io</span>.
                </p>
              </CardContent>
            </Card>
          </Link>

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