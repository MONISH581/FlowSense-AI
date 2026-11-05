import React, { useState, useEffect, useRef } from 'react';
import {
  Menu, RefreshCw, Database, Download, CheckCircle2, Sparkles, Loader2,
  ChevronDown, Trash2, Check, LogIn, LogOut, X, ShieldCheck
} from 'lucide-react';
import {
  loadDemoDataset, downloadSampleCSVUrl, getDatasets, activateDataset,
  deleteDataset, loginUser, registerUser, logoutUser
} from '../api';

export default function Header({ onToggleSidebar, onDatasetLoaded, datasetInfo }) {
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [message, setMessage] = useState(null);

  // Dataset dropdown state
  const [datasetDropdownOpen, setDatasetDropdownOpen] = useState(false);
  const [datasetsList, setDatasetsList] = useState([]);
  const dropdownRef = useRef(null);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('flowsense_user')) || null;
    } catch {
      return null;
    }
  });

  const fetchDatasets = async () => {
    try {
      const res = await getDatasets();
      setDatasetsList(res.data.datasets || []);
    } catch (err) {
      console.error('Failed to fetch datasets list:', err);
    }
  };

  useEffect(() => {
    fetchDatasets();
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDatasetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleActivateDataset = async (id) => {
    try {
      await activateDataset(id);
      setMessage(`Switched to dataset #${id}`);
      setDatasetDropdownOpen(false);
      await fetchDatasets();
      if (onDatasetLoaded) onDatasetLoaded();
      setTimeout(() => {
        setMessage(null);
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Failed to switch dataset:', err);
      alert('Error switching dataset.');
    }
  };

  const handleDeleteDataset = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete dataset #${id}? All associated analysis and logs will be removed.`)) {
      return;
    }
    try {
      await deleteDataset(id);
      setMessage(`Dataset #${id} deleted.`);
      await fetchDatasets();
      if (onDatasetLoaded) onDatasetLoaded();
      setTimeout(() => {
        setMessage(null);
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Failed to delete dataset:', err);
      alert('Error deleting dataset.');
    }
  };

  const handleLoadDemo = async () => {
    try {
      setLoadingDemo(true);
      setMessage(null);
      const res = await loadDemoDataset();
      setMessage('Demo dataset loaded & saved to SQLite!');
      await fetchDatasets();
      if (onDatasetLoaded) onDatasetLoaded(res.data);
      setTimeout(() => {
        setMessage(null);
        window.location.reload();
      }, 600);
    } catch (err) {
      console.error('Failed to load demo:', err);
      alert('Error loading demo dataset. Please check backend.');
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'login') {
        const res = await loginUser({
          username_or_email: authForm.username,
          password: authForm.password,
        });
        localStorage.setItem('flowsense_token', res.data.access_token);
        localStorage.setItem('flowsense_user', JSON.stringify(res.data.user));
        setCurrentUser(res.data.user);
        setMessage(`Welcome back, ${res.data.user.username}!`);
      } else {
        const res = await registerUser(authForm);
        localStorage.setItem('flowsense_token', res.data.access_token);
        localStorage.setItem('flowsense_user', JSON.stringify(res.data.user));
        setCurrentUser(res.data.user);
        setMessage(`Account registered! Logged in as ${res.data.user.username}`);
      }
      setAuthModalOpen(false);
      setAuthForm({ username: '', email: '', password: '' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setMessage('Logged out successfully.');
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-[#FAFDFC]/85 backdrop-blur-md border-b border-[#99AFA9]/25 px-4 md:px-8 flex items-center justify-between">
      {/* Left section: mobile toggle and dataset selector dropdown */}
      <div className="flex items-center gap-3.5" ref={dropdownRef}>
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-[#01110A] hover:bg-[#3B4A34]/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dataset Switcher Component */}
        <div className="relative">
          <button
            onClick={() => {
              fetchDatasets();
              setDatasetDropdownOpen(!datasetDropdownOpen);
            }}
            className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#FAFDFC] hover:bg-white rounded-full border border-[#99AFA9]/30 text-xs font-medium text-[#3B4A34] shadow-xs transition-all cursor-pointer"
            title="Click to switch active dataset"
          >
            <Database className="w-3.5 h-3.5 text-[#3B4A34]" />
            <span className="text-[#99AFA9] hidden sm:inline">Dataset:</span>
            <span className="font-bold text-[#01110A] max-w-[150px] sm:max-w-[200px] truncate">
              {datasetInfo?.filename || 'ecommerce_fulfillment_demo.csv'}
            </span>
            <span className="px-2 py-0.5 bg-[#ADEBD9]/40 text-[#01110A] rounded-full text-[10px] font-extrabold border border-[#ADEBD9]">
              {datasetInfo?.total_cases ? `${datasetInfo.total_cases.toLocaleString()} cases` : 'SQLite DB'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#99AFA9] transition-transform ${datasetDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dataset Switcher Dropdown Menu */}
          {datasetDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#99AFA9]/30 shadow-xl z-50 p-3 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#99AFA9]/20 px-1">
                <span className="text-[11px] font-bold text-[#3B4A34] uppercase tracking-wider">
                  Stored Datasets in SQLite
                </span>
                <span className="text-[10px] text-[#99AFA9] font-medium">
                  {datasetsList.length} dataset(s)
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {datasetsList.length === 0 ? (
                  <div className="p-3 text-center text-xs text-[#99AFA9]">No datasets stored yet.</div>
                ) : (
                  datasetsList.map((ds) => (
                    <div
                      key={ds.id}
                      onClick={() => handleActivateDataset(ds.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        ds.is_active
                          ? 'bg-[#ADEBD9]/20 border-[#ADEBD9] text-[#01110A]'
                          : 'bg-[#FAFDFC] border-transparent hover:border-[#99AFA9]/40 text-[#3B4A34]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold truncate">{ds.filename}</p>
                          {ds.is_active && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-[#ADEBD9] text-[#01110A] text-[9px] font-black rounded-full">
                              <Check className="w-2.5 h-2.5" /> Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#99AFA9] mt-0.5">
                          {ds.case_count.toLocaleString()} cases &bull; {ds.row_count.toLocaleString()} events
                        </p>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => handleDeleteDataset(e, ds.id)}
                          className="p-1.5 rounded-lg text-[#99AFA9] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                          title="Delete dataset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Action Buttons */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {message && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#01110A] bg-[#ADEBD9]/50 px-3.5 py-1 rounded-full border border-[#ADEBD9] font-semibold animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#01110A]" />
            <span>{message}</span>
          </div>
        )}

        {/* Sample CSV Download */}
        <a
          href={downloadSampleCSVUrl}
          download="flowsense_sample_process_log.csv"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#99AFA9]/30 text-xs font-bold text-[#3B4A34] bg-white hover:bg-[#FAFDFC] hover:border-[#3B4A34]/40 transition-all shadow-xs"
          title="Download Sample CSV for manual file uploads"
        >
          <Download className="w-3.5 h-3.5 text-[#99AFA9]" />
          <span className="hidden sm:inline">Sample CSV</span>
        </a>

        {/* Load Demo Dataset Button */}
        <button
          onClick={handleLoadDemo}
          disabled={loadingDemo}
          className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#01110A] hover:bg-[#082819] text-[#A0F89C] border border-[#A0F89C]/30 text-xs font-bold shadow-md shadow-[#01110A]/20 transition-all disabled:opacity-70 cursor-pointer"
        >
          {loadingDemo ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-[#ADEBD9]" />
          )}
          <span>{loadingDemo ? 'Synthesizing...' : 'Load Demo'}</span>
        </button>

        {/* Authentication Button / User Profile */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-1 border-l border-[#99AFA9]/30">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[#01110A] leading-tight">{currentUser.username}</span>
              <span className="text-[10px] text-[#99AFA9] uppercase font-semibold">{currentUser.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-[#99AFA9]/30 text-[#99AFA9] hover:text-[#ef4444] hover:bg-white transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#99AFA9]/30 text-xs font-bold text-[#01110A] bg-white hover:bg-[#FAFDFC] transition-all cursor-pointer shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5 text-[#3B4A34]" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}

        {/* Refresh Page */}
        <button
          onClick={() => window.location.reload()}
          className="p-2.5 rounded-xl border border-[#99AFA9]/30 text-[#99AFA9] hover:text-[#01110A] hover:bg-white transition-colors cursor-pointer"
          title="Refresh analytical state"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#01110A]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#99AFA9]/30 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fadeIn relative">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#99AFA9] hover:text-[#01110A] hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#ADEBD9]/40 flex items-center justify-center border border-[#ADEBD9]">
                <ShieldCheck className="w-4 h-4 text-[#01110A]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#01110A]">
                {authMode === 'login' ? 'Sign In to FlowSense' : 'Create Analyst Account'}
              </h2>
            </div>
            <p className="text-xs text-[#99AFA9] mb-5">
              {authMode === 'login'
                ? 'Access user-isolated event logs and saved process mining models.'
                : 'Register for role-based workspace access and audit persistence.'}
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3B4A34] mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  placeholder="analyst_monish"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#99AFA9]/40 text-xs text-[#01110A] focus:outline-none focus:border-[#01110A] transition-colors"
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-[#3B4A34] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    placeholder="analyst@flowsense.ai"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#99AFA9]/40 text-xs text-[#01110A] focus:outline-none focus:border-[#01110A] transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#3B4A34] mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#99AFA9]/40 text-xs text-[#01110A] focus:outline-none focus:border-[#01110A] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-[#01110A] hover:bg-[#082819] text-[#A0F89C] border border-[#A0F89C]/30 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-[#99AFA9]">
              {authMode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                    }}
                    className="font-bold text-[#01110A] hover:underline cursor-pointer"
                  >
                    Register here
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                    }}
                    className="font-bold text-[#01110A] hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
