import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Plus, ShieldAlert, Clock, MapPin } from 'lucide-react';

interface Incident {
  id: string;
  type: string;
  severity: string;
  status: string;
  location: { lat: number, lng: number };
  description: string;
}

export default function CitizenDashboard() {
  const { email, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!email || role !== 'citizen') {
      navigate('/login');
      return;
    }

    fetch(`http://localhost:8000/incidents/user/${email}`)
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [email, role, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <h1 className="text-2xl font-bold tracking-wider">ResQAI <span className="text-slate-500 font-light text-xl">Citizen</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm text-slate-400">{email}</span>
          <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Reports</h2>
            <p className="text-slate-400">Track the status of your emergency reports and complaints.</p>
          </div>
          <Link to="/report" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">
            <Plus className="w-5 h-5" />
            New Report
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50 text-center">
            <FileText className="w-16 h-16 text-slate-700 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Reports Found</h3>
            <p className="text-slate-500 mb-6 max-w-md">You haven't submitted any emergency reports or complaints yet. If you see an incident, you can report it to help authorities respond faster.</p>
            <Link to="/report" className="text-blue-400 font-medium hover:text-blue-300">Submit your first report &rarr;</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-slate-500">#{report.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${report.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : report.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : report.severity === 'LOW' ? 'bg-purple-500/20 text-purple-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {report.severity}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">
                      {report.status}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-200 mb-1">{report.type}</h4>
                  <p className="text-slate-400 text-sm">{report.description}</p>
                </div>
                
                <div className="flex flex-col gap-2 text-sm text-slate-500 bg-slate-950 p-4 rounded-lg min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <span>Lat: {report.location.lat.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span>Just now</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
