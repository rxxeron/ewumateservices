import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, Globe } from 'lucide-react';
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
    <div className="min-height-screen flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-ewu-green w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <LogIn className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">EWUmate Assignment</h1>
          <p className="text-slate-500">Sign in to generate your cover page</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="label-text">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
              <input
                type="email"
                className="input-field pl-10"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label-text">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
              <input
                type="password"
                className="input-field pl-10"
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
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 border border-slate-200 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all font-medium text-slate-700"
        >
          <Globe className="w-5 h-5" />
          Google Sign In
        </button>
      </div>
    </div>
  );
};
