import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const isProd = window.location.hostname === 'services.ewumate.pro.bd';
      const redirectTo = isProd 
        ? 'https://services.ewumate.pro.bd/' 
        : `${window.location.origin}/`;
        
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-mesh">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-ewu-green/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-ewu-blue/10 rounded-full blur-[120px] animate-pulse-slow"></div>

      <div className="glass-card max-w-md w-full p-10 rounded-[2.5rem] shadow-2xl relative z-10 border-white/20">
        <div className="text-center mb-10">
          <div className="bg-gradient-to-br from-ewu-green to-green-700 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-ewu-green/20 animate-float">
            <LogIn className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white mb-2">
            EWUmate <span className="text-ewu-green">Web</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Professional Cover Page Generator</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="label-text">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-slate-400 group-focus-within:text-ewu-green transition-colors w-5 h-5" />
              </div>
              <input
                type="email"
                className="input-field pl-12"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label-text">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-slate-400 group-focus-within:text-ewu-green transition-colors w-5 h-5" />
              </div>
              <input
                type="password"
                className="input-field pl-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3 h-14 text-lg shadow-xl"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <LogIn className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-black">
            <span className="px-4 bg-transparent text-slate-400">Quick Access</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-4 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                     rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 
                     transition-all duration-300 font-bold text-slate-700 dark:text-slate-200 shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>
        
        <p className="mt-8 text-center text-xs text-slate-400 font-medium">
          By signing in, you agree to our <a href="#" className="text-ewu-green hover:underline">Terms of Service</a>
        </p>
        <div className="mt-12 text-center">
          <p className="text-[10px] tracking-widest uppercase font-black text-slate-400 dark:text-slate-600">
            Created by <a href="https://rxxeron.iam.bd" target="_blank" rel="noopener noreferrer" className="text-ewu-green hover:text-ewu-blue transition-colors">rxxeron</a>
          </p>
        </div>
      </div>
    </div>
  );
};
