import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Login } from './components/Login';
import { CoverPageForm } from './components/CoverPageForm';
import { StudyVault } from './components/StudyVault';
import { MyUploads } from './components/MyUploads';
import { UploadPortal } from './components/UploadPortal';
import { Toaster } from 'react-hot-toast';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from './components/ThemeContext';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-ewu-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Helper check to highlight the "Study Vault" tab when nested paths are loaded
  const isVaultActive = location.pathname.startsWith('/vault');

  return (
    <div className="min-h-screen bg-mesh text-slate-900 dark:text-slate-100 transition-colors duration-500">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'glass-card dark:text-white',
          style: {
            borderRadius: '1rem',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
          }
        }}
      />
      
      {session ? (
        <div className="relative">
          {/* Desktop & Mobile Top Navigation */}
          <nav className="nav-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-ewu-green/20 ring-1 ring-black/5 dark:ring-white/10 shrink-0 flex items-center justify-center">
                  <img src="/logo.png" alt="EWUmate" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-xl tracking-tight">
                  EWUmate <span className="bg-gradient-to-r from-ewu-green to-green-600 bg-clip-text text-transparent">Web</span>
                </span>
                
                {/* Desktop Tabs */}
                <div className="hidden sm:flex items-center gap-1.5 ml-2 border-l border-slate-200 dark:border-white/10 pl-4">
                  <NavLink
                    to="/cover-page"
                    className={({ isActive }) => 
                      `px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-black border transition-all ${
                        isActive 
                          ? 'bg-ewu-green/10 text-ewu-green border-ewu-green/15' 
                          : 'text-slate-500 hover:bg-slate-100 border-transparent dark:text-slate-400 dark:hover:bg-white/5'
                      }`
                    }
                  >
                    Cover Page
                  </NavLink>
                  <NavLink
                    to="/vault"
                    className={() => 
                      `px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-black border transition-all ${
                        isVaultActive 
                          ? 'bg-ewu-green/10 text-ewu-green border-ewu-green/15' 
                          : 'text-slate-500 hover:bg-slate-100 border-transparent dark:text-slate-400 dark:hover:bg-white/5'
                      }`
                    }
                  >
                    Study Vault
                  </NavLink>
                </div>
              </div>
              
              <div className="flex items-center gap-3 md:gap-5">
                <button
                  onClick={toggleTheme}
                  className="p-2.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 text-slate-500 dark:text-slate-400"
                  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
 
                <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-white/10">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200 max-w-[150px] truncate">{session.user.email}</div>
                    <div className="text-[10px] uppercase tracking-widest font-black text-ewu-green">Verified Student</div>
                  </div>
                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all group text-slate-400 hover:text-red-500"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
                
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="sm:hidden p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all text-slate-400 hover:text-red-500"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile Tabs subheader */}
          <div className="sm:hidden flex items-center justify-center gap-2 mt-4 mx-4 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5">
            <NavLink
              to="/cover-page"
              className={({ isActive }) => 
                `flex-1 text-center py-2.5 rounded-xl text-xs uppercase tracking-widest font-black border transition-all ${
                  isActive 
                    ? 'bg-white dark:bg-slate-800 text-ewu-green shadow-sm border-slate-200 dark:border-white/5' 
                    : 'text-slate-500 dark:text-slate-400 border-transparent'
                }`
              }
            >
              Cover Page
            </NavLink>
            <NavLink
              to="/vault"
              className={() => 
                `flex-1 text-center py-2.5 rounded-xl text-xs uppercase tracking-widest font-black border transition-all ${
                  isVaultActive 
                    ? 'bg-white dark:bg-slate-800 text-ewu-green shadow-sm border-slate-200 dark:border-white/5' 
                    : 'text-slate-500 dark:text-slate-400 border-transparent'
                }`
              }
            >
              Study Vault
            </NavLink>
          </div>

          <main className="pt-12 pb-24 relative z-10">
            <Routes>
              <Route path="/" element={<Navigate to="/cover-page" replace />} />
              <Route path="/cover-page" element={<CoverPageForm user={session.user} />} />
              <Route path="/vault" element={<StudyVault />} />
              <Route path="/vault/my-uploads" element={<MyUploads user={session.user} />} />
              <Route path="/vault/upload" element={<UploadPortal user={session.user} />} />
              <Route path="*" element={<Navigate to="/cover-page" replace />} />
            </Routes>
          </main>
          
          <footer className="pt-12 pb-20 text-center text-slate-400 dark:text-slate-600 text-sm font-medium">
            <div className="max-w-7xl mx-auto px-6 border-t border-slate-100 dark:border-white/5 pt-8 space-y-2">
              <p>&copy; {new Date().getFullYear()} EWUmate Ecosystem. Built with 💚 for East West University Students.</p>
              <p className="text-xs tracking-wide uppercase font-black">
                Developed by <a href="https://rxxeron.iam.bd" target="_blank" rel="noopener noreferrer" className="text-ewu-green hover:text-ewu-blue transition-colors">rxxeron</a>
              </p>
            </div>
          </footer>
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;
