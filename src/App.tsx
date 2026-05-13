import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Login } from './components/Login';
import { CoverPageForm } from './components/CoverPageForm';
import { Toaster } from 'react-hot-toast';
import { LogOut, Layout } from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-ewu-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toaster position="top-right" />
      
      {session ? (
        <>
          <nav className="glass-card sticky top-0 z-50 px-6 py-4 border-b border-slate-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-ewu-green p-2 rounded-lg shadow-md">
                  <Layout className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-ewu-blue tracking-tight">EWUmate <span className="text-ewu-green">Web</span></span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-semibold text-slate-700">{session.user.email}</div>
                  <div className="text-xs text-slate-400">Authenticated Student</div>
                </div>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </nav>

          <main className="pb-20">
            <CoverPageForm user={session.user} />
          </main>
          
          <footer className="py-8 text-center text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} EWUmate Ecosystem. Built for East West University Students.
          </footer>
        </>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;
