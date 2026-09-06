import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Activity, Users, ArrowRight, Zap, Wifi, WifiOff, CheckCircle, Database } from 'lucide-react';

export default function LandingPage() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-auto flex flex-col selection:bg-red-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <ShieldAlert className="w-8 h-8 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]" />
          <div>
            <h1 className="text-xl font-bold tracking-wider text-slate-100 flex items-center gap-2">
              ResQAI
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-mono font-bold">EMERGENCY</span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">AI Incident Prioritization & Disaster Early Warning</p>
          </div>
        </div>

        {/* Status Indicator & Navigation */}
        <div className="flex items-center gap-4 md:gap-6">
          {isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full text-xs font-semibold">
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">🟢 Online Service Active</span>
              <span className="sm:hidden">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">🟠 Offline Mode — IndexedDB Sync</span>
              <span className="sm:hidden">Offline</span>
            </div>
          )}

          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold">
            <Link to="/report" className="text-slate-300 hover:text-white transition-colors">Citizen Portal</Link>
            <Link to="/admin" className="text-slate-300 hover:text-white transition-colors">Admin Dashboard</Link>
            <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">Command Center</Link>
            <Link to="/map" className="text-slate-300 hover:text-white transition-colors">Live Map</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-6xl mx-auto space-y-10">
        
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold tracking-wider uppercase shadow-lg shadow-blue-500/10">
          <Zap className="w-4 h-4 text-blue-400" />
          <span>Next-Gen Crisis Response Platform</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl">
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-100">
            Intelligent Emergency <br />
            <span className="bg-gradient-to-r from-red-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Prioritization & Early Warning
            </span>
          </h2>
          <p className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            ResQAI empowers citizens to report emergencies in both <strong className="text-slate-200">Online & Offline modes</strong> while equipping Command Centre operators with AI-based severity rankings and nationwide disaster alerts.
          </p>
        </div>

        {/* Two Main Entry Gateway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl text-left pt-4">
          
          {/* Card 1: Citizen Emergency Portal (Offline & Online) */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-red-500/50 rounded-3xl p-8 flex flex-col justify-between shadow-2xl hover:shadow-red-500/10 transition-all hover:-translate-y-1 group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[11px] font-bold text-slate-300">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Offline & Online Capable</span>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">Citizen Emergency Portal</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Submit emergency reports, hazards, and complaints with GPS coordinates, photos, and voice audio recordings.
                </p>
              </div>

              {/* Online/Offline Capability Pills */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span><strong className="text-green-400">Online Mode:</strong> Direct AI classification & Command Centre email telemetry (`shreyasbpalan5@gmail.com`).</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span><strong className="text-amber-400">Offline Mode:</strong> IndexedDB client caching with automatic background sync upon network recovery.</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                to="/report"
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all group-hover:gap-3"
              >
                <span>Report Emergency Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Admin Dashboard & Command Center */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-8 flex flex-col justify-between shadow-2xl hover:shadow-blue-500/10 transition-all hover:-translate-y-1 group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[11px] font-bold text-blue-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Command & Control</span>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">Admin Dashboard & Command Center</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Centralized command console for emergency operators to review AI severity rankings, monitor full-India IMD weather alerts, and dispatch helpers.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span><strong className="text-blue-400">AI Priority Queue:</strong> Auto-ranks 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low cases.</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong className="text-emerald-400">Helper Dispatch:</strong> One-click helper notifications (`9035351841`).</span>
                </div>
              </div>
            </div>

            <div className="pt-8 grid grid-cols-2 gap-3">
              <Link
                to="/admin"
                className="py-4 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 font-bold rounded-2xl flex items-center justify-center gap-1.5 text-sm transition-all"
              >
                <span>Admin Console</span>
              </Link>
              <Link
                to="/dashboard"
                className="py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5 text-sm transition-all"
              >
                <span>Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl pt-8 border-t border-slate-800/60">
          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-left">
            <h4 className="text-xs font-bold uppercase text-red-400 mb-1">🤖 AI Priority Engine</h4>
            <p className="text-[11px] text-slate-400">Automated NLP severity ranking for instant triage.</p>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-left">
            <h4 className="text-xs font-bold uppercase text-emerald-400 mb-1">🗺️ Full-India Weather</h4>
            <p className="text-[11px] text-slate-400">Nationwide IMD weather alerts & state popups.</p>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-left">
            <h4 className="text-xs font-bold uppercase text-amber-400 mb-1">💾 Offline Sync</h4>
            <p className="text-[11px] text-slate-400">IndexedDB local storage with background sync.</p>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-left">
            <h4 className="text-xs font-bold uppercase text-blue-400 mb-1">📧 Email Telemetry</h4>
            <p className="text-[11px] text-slate-400">Instant alert to `shreyasbpalan5@gmail.com`.</p>
          </div>
        </div>

      </main>
    </div>
  );
}
