import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Code2, Plus, Loader2, Trash2 } from "lucide-react"; // Trash2 is the icon
import { getAllSnippets, deleteSnippet } from "../api/code";
import toast, { Toaster } from "react-hot-toast";

interface Snippet {
  _id: string;
  title: string;
  language: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user } = useUser();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadSnippets();
  }, [user]);

  const loadSnippets = async () => {
    try {
      if (!user) return;
      const data = await getAllSnippets(user.id);
      setSnippets(data);
    } catch (error) {
      toast.error("Failed to load snippets");
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE LOGIC ---
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Stop the card from opening
    e.stopPropagation(); // Double safety
    
    if (confirm("Are you sure you want to delete this code?")) {
      await deleteSnippet(id);
      toast.success("Snippet deleted");
      loadSnippets(); // Refresh the list instantly
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster position="top-center" />
      
      <nav className="border-b border-gray-800 p-4 flex justify-between items-center bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:text-blue-400 transition-colors">
          <Code2 className="text-blue-500" />
          Runbox
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden md:block">Welcome, {user?.firstName}</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">My Snippets</h1>
          <Link to="/room/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all">
            <Plus size={18} />
            New Code
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center mt-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        )}

        {!loading && snippets.length === 0 && (
            <div className="text-center mt-20">
                <p className="text-gray-500 text-xl">No code saved yet.</p>
                <p className="text-gray-600 text-sm mt-2">Start a new interview to save your first snippet!</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {snippets.map((snippet) => (
            <Link 
              key={snippet._id} 
              to={`/room/${snippet._id}`} 
              className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all cursor-pointer group flex flex-col h-48 relative"
            >
              {/* DELETE BUTTON (Floating Top Right) */}
              <button 
                onClick={(e) => handleDelete(e, snippet._id)}
                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-gray-700 rounded-full z-10"
              >
                <Trash2 size={18} />
              </button>

              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Code2 className="text-blue-400" size={20} />
                </div>
                <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded mr-8">
                    {snippet.language}
                </span>
              </div>
              
              <h3 className="font-bold text-lg mb-1 truncate text-gray-100">{snippet.title}</h3>
              <p className="text-sm text-gray-400">
                Created: {new Date(snippet.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}