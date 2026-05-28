import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import Markdown from 'markdown-to-jsx';
import Mermaid from './Mermaid';
import { 
  History, Cpu, FileText, LogOut, Terminal, Download, 
  ShieldCheck, Menu, ChevronLeft, Plus, Search, Edit3, Check, Link2, Globe
} from 'lucide-react';

const GOOGLE_CLIENT_ID = "991730577247-8hd6kvkbst8fnjm7jqbkg7l0bh1g75r6.apps.googleusercontent.com";

function App() {
  const [user, setUser] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [currentReportId, setCurrentReportId] = useState(null);
  const [history, setHistory] = useState([]);
  const [errorLog, setErrorLog] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbPreference, setDbPreference] = useState('Any');
  const [archStyle, setArchStyle] = useState('Microservices');
  const [isEditing, setIsEditing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isPublicView, setIsPublicView] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/blueprint/')) {
      const reportId = path.split('/')[2];
      if (reportId) {
        setIsPublicView(true);
        setIsSidebarOpen(false);
        fetchPublicBlueprint(reportId);
      }
    } else if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchPublicBlueprint = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/public/blueprint/${id}`);
      setProjectTitle(res.data.project_title);
      setRequirement(res.data.user_requirement);
      setCurrentReport(res.data.generated_blueprint);
    } catch (err) {
      alert("This public blueprint link is invalid or expired.");
    }
    setLoading(false);
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/history/${user.user_id}`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post('http://localhost:8000/api/auth/google', {
        access_token: credentialResponse.credential
      });
      setUser(res.data);
    } catch (err) {
      alert("FastAPI Authentication failed!");
    }
  };

  const handleGenerate = async () => {
    if (!projectTitle.trim() || !requirement.trim()) return alert("Please fill details!");
    setLoading(true);
    setErrorLog('');
    setCurrentReport(null);
    setIsEditing(false);

    const finalPrompt = `${requirement}. (Database Preference: ${dbPreference}, Archetype Pattern: ${archStyle})`;

    try {
      const res = await axios.post('http://localhost:8000/api/generate', {
        user_id: user.user_id,
        project_title: projectTitle,
        user_input: finalPrompt
      });

      if (res.data.status === 'rejected') {
        setErrorLog(res.data.reason);
      } else {
        setCurrentReport(res.data.report.generated_blueprint);
        setCurrentReportId(res.data.report.id);
        fetchHistory();
      }
    } catch (err) {
      alert("Error executing pipeline flow.");
    }
    setLoading(false);
  };

  const generateShareLink = () => {
    if (!currentReportId) return alert("Please generate a blueprint first!");
    const livePublicUrl = `${window.location.origin}/blueprint/${currentReportId}`;
    navigator.clipboard.writeText(livePublicUrl);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  const handleNewChat = () => {
    setProjectTitle('');
    setRequirement('');
    setCurrentReport(null);
    setCurrentReportId(null);
    setErrorLog('');
    setIsEditing(false);
  };

  const downloadReport = () => {
    if (!currentReport) return;
    const element = document.createElement("a");
    const file = new Blob([currentReport], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${projectTitle.replace(/\s+/g, '_')}_architecture.md`;
    document.body.appendChild(element);
    element.click();
  };

  const filteredHistory = history.filter(item => 
    item.project_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Markdown Overrides Configuration (Both Views use this standard renderer)
  const markdownOptions = {
    overrides: {
      pre: {
        component: ({ children }) => {
          const codeContent = children.props.children;
          const className = children.props.className || '';
          if (className.includes('lang-mermaid')) {
            return <Mermaid chart={codeContent.trim()} />;
          }
          return <pre>{children}</pre>;
        }
      }
    }
  };

  // 🌐 PUBLIC READ-ONLY WORKSPACE
  if (isPublicView) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-600 p-2 rounded-xl text-white"><Globe className="w-4 h-4" /></div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block">Public Shared Link</span>
                <h2 className="text-xl font-bold text-slate-100">{projectTitle}</h2>
              </div>
            </div>
            <button onClick={() => window.location.href = window.location.origin} className="flex items-center space-x-2 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg transition">
              <Cpu className="w-3.5 h-3.5" /> <span>Create Your Own Blueprint ➔</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center p-10 text-slate-500 text-sm animate-pulse">Loading Blueprint...</div>
          ) : (
            currentReport && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl prose prose-invert max-w-none">
                <Markdown options={markdownOptions}>{currentReport}</Markdown>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // STANDARD AUTHENTICATION WALL
  if (!user) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white p-6 relative overflow-hidden">
          <div className="bg-slate-900 p-10 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-800 relative z-10">
            <Cpu className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-pulse" />
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">ArchAgent SaaS</h1>
            <p className="text-slate-400 text-sm mb-8">Autonomous Multi-Agent AI System that architects enterprise backend systems on-demand.</p>
            <div className="flex justify-center border border-slate-700/50 p-4 bg-slate-950/50 rounded-xl transition">
              <GoogleLogin onSuccess={handleGoogleSuccess} theme="filled_dark" shape="pill" />
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans relative overflow-hidden">
      
      {/* 🧭 SIDEBAR COMPONENT */}
      <div className={`fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-30 transition-all duration-300 transform ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'}`}>
        {isSidebarOpen && (
          <div className="p-5 overflow-y-auto flex-1 flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="bg-indigo-600 p-2 rounded-lg"><Cpu className="w-5 h-5 text-white" /></div>
                <span className="font-extrabold text-md tracking-wider bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">ArchAgent Pro</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition"><ChevronLeft className="w-4 h-4" /></button>
            </div>
            
            <button onClick={handleNewChat} className="w-full mb-5 flex items-center justify-center space-x-2 bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 text-slate-200 text-xs font-bold py-3 px-4 rounded-xl transition">
              <Plus className="w-4 h-4" /> <span>New Architecture Session</span>
            </button>

            <div className="relative mb-5">
              <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search blueprints..." className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 focus:outline-none" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                <History className="w-3 h-3 mr-1.5 text-indigo-400" /> Saved Blueprints ({filteredHistory.length})
              </h3>
              {filteredHistory.map((item) => (
                <button key={item.id} onClick={() => { setCurrentReport(item.generated_blueprint); setCurrentReportId(item.id); setProjectTitle(item.project_title); setRequirement(item.user_requirement); setErrorLog(''); setIsEditing(false); }} className="w-full text-left p-3 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/60 transition block truncate">
                  <span className="font-semibold text-xs text-slate-300 block truncate">{item.project_title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {isSidebarOpen && (
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
            <div className="truncate mr-3"><p className="text-xs font-bold text-slate-200 truncate">{user.full_name}</p></div>
            <button onClick={() => setUser(null)} className="p-2 hover:bg-red-950/40 rounded-xl text-slate-400"><LogOut className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* 🚀 MAIN CONTENT SPACE */}
      <div className={`flex-1 flex flex-col min-h-screen p-6 md:p-10 transition-all duration-300 w-full ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <div className={`mx-auto w-full transition-all duration-300 ${isSidebarOpen ? 'max-w-4xl' : 'max-w-6xl'}`}>
          
          {!isSidebarOpen && (
            <div className="mb-6">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-indigo-400 transition"><Menu className="w-5 h-5" /></button>
            </div>
          )}

          <div className="mb-8"><h1 className="text-3xl font-extrabold tracking-tight text-white">Design Production Infrastructure</h1></div>

          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5 mb-8">
            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 tracking-wider">Preferred Database System</label>
                <select value={dbPreference} onChange={(e) => setDbPreference(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"><option value="Any (AI Choice)">Any (AI Choice)</option><option value="PostgreSQL">PostgreSQL</option><option value="MongoDB">MongoDB</option></select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 tracking-wider">Architecture Archetype</label>
                <select value={archStyle} onChange={(e) => setArchStyle(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"><option value="Distributed Microservices">Microservices</option><option value="Modular Monolith">Modular Monolith</option></select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div><label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Project Name</label><input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="e.g., Netflix System" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-700" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Requirements</label><textarea value={requirement} onChange={(e) => setRequirement(e.target.value)} rows="4" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 resize-none placeholder-slate-700" /></div>
            </div>
            <button onClick={handleGenerate} disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold py-3.5 rounded-xl shadow-lg">{loading ? "Orchestrating Graph Framework... 🚀" : "🚀 Trigger Agent Blueprints"}</button>
          </div>

          {currentReport && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden mb-12">
              <div className="bg-slate-900/90 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2"><FileText className="w-4 h-4 text-indigo-400" /><span className="font-bold text-xs uppercase text-slate-400">System Document</span></div>
                
                <div className="flex items-center space-x-2">
                  <button onClick={generateShareLink} className={`flex items-center space-x-1 text-xs border px-3 py-2 rounded-xl font-bold transition duration-200 ${shareSuccess ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-indigo-400'}`}>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>{shareSuccess ? "Copied Link!" : "🔗 Share Public Link"}</span>
                  </button>
                  <button onClick={() => setIsEditing(!isEditing)} className="flex items-center space-x-1 text-xs bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-slate-300 font-bold">{isEditing ? "Done" : "Edit Text"}</button>
                  <button onClick={downloadReport} className="flex items-center space-x-1.5 text-xs bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-indigo-400 font-bold"><Download className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="p-6 md:p-8 text-slate-300 text-sm bg-slate-900/40 prose prose-invert max-w-none">
                {isEditing ? <textarea value={currentReport} onChange={(e) => setCurrentReport(e.target.value)} rows="25" className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-4 text-xs font-mono resize-y" /> : (
                  <Markdown options={markdownOptions}>{currentReport}</Markdown>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;