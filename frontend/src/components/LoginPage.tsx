import React, { useState } from 'react';
import { ShieldAlert, LogIn, Lock, Mail, Users, Activity, UserPlus, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'citizen' | 'operator'>('citizen');
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate authentication / registration
    setTimeout(() => {
      login(email, role);
      setIsLoading(false);
      if (role === 'operator') {
        navigate('/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ShieldAlert className="w-6 h-6 text-red-500" />
        <span className="font-bold tracking-wider">ResQAI</span>
      </Link>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex bg-slate-950 p-1 rounded-lg mb-8">
          <button 
            type="button"
            onClick={() => setRole('citizen')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === 'citizen' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Citizen
          </button>
          <button 
            type="button"
            onClick={() => setRole('operator')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === 'operator' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Operator
          </button>
        </div>

        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${role === 'operator' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
            {role === 'operator' ? <Activity className="w-8 h-8" /> : <Users className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            {mode === 'login' 
              ? (role === 'operator' ? 'Operator Login' : 'Citizen Login')
              : (role === 'operator' ? 'Register Operator' : 'Create Citizen Account')}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {mode === 'login'
              ? (role === 'operator' ? 'Sign in to access the Command Center' : 'Sign in to view your reports and complaints')
              : (role === 'operator' ? 'Register a new official operator account' : 'Create an account to track your emergency reports')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={role === 'operator' ? "operator@resqai.gov" : "citizen@example.com"}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-4
              ${isLoading 
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed' 
                : role === 'operator' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-slate-300 font-medium hover:text-white transition-colors">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-slate-300 font-medium hover:text-white transition-colors">
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
