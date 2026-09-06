import { useState, useEffect } from 'react';
import { ShieldAlert, Activity, MapPin, Mail, Phone, AlertTriangle, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface Incident {
  id: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  ai_priority?: string;
  ai_priority_reason?: string;
  created_at?: string;
  time?: string;
  email_sent?: boolean;
  reporter_phone?: string;
  location?: { lat: number; lng: number };
}

interface IMDAlert {
  id: string;
  color_level: 'Red' | 'Orange' | 'Yellow' | 'Green';
  state: string;
  district?: string;
  affected_area: string;
  severity: string;
}

export default function AdminDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [imdAlerts, setImdAlerts] = useState<IMDAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [incRes, imdRes] = await Promise.all([
        fetch('http://localhost:8000/incidents').catch(() => null),
        fetch('http://localhost:8000/imd-alerts').catch(() => null)
      ]);

      if (incRes && incRes.ok) {
        const data = await incRes.json();
        setIncidents(data);
      }
      if (imdRes && imdRes.ok) {
        const data = await imdRes.json();
        setImdAlerts(data);
      }
    } catch (e) {
      console.warn("Failed to fetch admin dashboard telemetry:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = incidents.filter(i => (i.ai_priority || i.severity) === 'CRITICAL').length;
  const highCount = incidents.filter(i => (i.ai_priority || i.severity) === 'HIGH').length;
  const redAlertsCount = imdAlerts.filter(a => a.color_level === 'Red').length;
  const orangeAlertsCount = imdAlerts.filter(a => a.color_level === 'Orange').length;

  const handleTestEmail = async () => {
    if (incidents.length === 0) {
      setTestEmailStatus("No active incidents to test. Create a report first.");
      return;
    }
    const targetId = incidents[0].id;
    setTestEmailStatus("Sending test email to shreyasbpalan5@gmail.com...");
    try {
      const res = await fetch(`http://localhost:8000/incidents/${targetId}/send-email`, { method: 'POST' });
      if (res.ok) {
        setTestEmailStatus("✓ Telemetry email sent successfully to shreyasbpalan5@gmail.com");
        fetchData();
      } else {
        setTestEmailStatus("✕ Failed to send telemetry email");
      }
    } catch (e) {
      setTestEmailStatus("✕ Network error testing email");
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Quick Action Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <span>Admin Control Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">ResQAI System Overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time monitoring for emergency operations, AI severity rankings, and disaster alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all text-xs flex items-center gap-1.5"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/command-center')}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 text-sm flex items-center gap-2 transition-all"
          >
            <Activity className="w-4 h-4" />
            <span>Access Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Total Incidents</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{isLoading ? '...' : incidents.length}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Active citizen emergency reports</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Critical Emergencies</p>
            <h3 className="text-3xl font-extrabold text-red-400 mt-1">{isLoading ? '...' : criticalCount}</h3>
            <p className="text-[11px] text-red-400/80 mt-1">{highCount} High Severity cases</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">IMD Disaster Alerts</p>
            <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{isLoading ? '...' : imdAlerts.length}</h3>
            <p className="text-[11px] text-amber-400/80 mt-1">{redAlertsCount} Red Alerts, {orangeAlertsCount} Orange</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Email Telemetry</p>
            <h3 className="text-sm font-bold text-emerald-400 mt-2 truncate max-w-[140px]" title="shreyasbpalan5@gmail.com">
              shreyasbpalan5@gmail.com
            </h3>
            <p className="text-[11px] text-emerald-400/80 mt-1">✓ Automated Dispatch Enabled</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Mail className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Admin Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Emergency Queue */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                <span>Live AI Priority Incident Queue</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Sorted dynamically by AI severity analysis</p>
            </div>
            <Link to="/command-center" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              Command Center View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading emergency telemetry...</div>
          ) : incidents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-slate-950/50 rounded-xl border border-slate-800">
              No active emergency reports currently submitted.
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {incidents.slice(0, 5).map((incident) => {
                const priority = incident.ai_priority || incident.severity;
                const isCritical = priority === 'CRITICAL';
                return (
                  <div
                    key={incident.id}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        }`}>
                          {priority}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{incident.id}</span>
                        <span className="text-xs text-slate-200 font-bold">{incident.type}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-1">{incident.description}</p>
                      {incident.reporter_phone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-blue-400" />
                          <span>{incident.reporter_phone}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => navigate('/command-center')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      Manage
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* System Diagnostics & Operational Telemetry */}
        <div className="space-y-6">
          {/* Email Telemetry Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-slate-100 text-sm">Command Centre Email Dispatch</h3>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400">Target Email:</span>
                <span className="font-mono text-slate-200 font-bold">shreyasbpalan5@gmail.com</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400">Auto-Dispatch:</span>
                <span className="text-emerald-400 font-bold">✓ Enabled</span>
              </div>
            </div>

            <button
              onClick={handleTestEmail}
              className="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-all"
            >
              Test Email Telemetry
            </button>

            {testEmailStatus && (
              <p className="text-[11px] p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-center font-medium">
                {testEmailStatus}
              </p>
            )}
          </div>

          {/* Quick Nav Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Full-India Weather Map</span>
            </h3>
            <p className="text-xs text-slate-400">
              View nationwide Meteorological Department alerts across Indian states with interactive popups.
            </p>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 pt-1"
            >
              Open Live Weather Map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
