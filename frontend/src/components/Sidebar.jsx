import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Network,
  AlertTriangle,
  Clock,
  SearchCheck,
  Layers,
  Sparkles,
  Sliders,
  FileText,
  Settings,
  Workflow
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Upload Dataset', path: '/upload', icon: UploadCloud },
  { name: 'Process Mining', path: '/process-mining', icon: Network },
  { name: 'Bottleneck Detection', path: '/bottlenecks', icon: AlertTriangle },
  { name: 'Delay Prediction', path: '/delay-prediction', icon: Clock },
  { name: 'Anomaly Detection', path: '/anomalies', icon: SearchCheck },
  { name: 'Process Clustering', path: '/clustering', icon: Layers },
  { name: 'AI Insights', path: '/insights', icon: Sparkles },
  { name: 'What-If Simulation', path: '/simulation', icon: Sliders },
  { name: 'Reports & Export', path: '/reports', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-68 bg-[#01110A] border-r border-[#3B4A34]/35 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="h-22 px-6 flex items-center justify-between border-b border-[#3B4A34]/30 bg-[#01110A]/90">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#082819] to-[#01110A] border border-[#A0F89C]/40 flex items-center justify-center shadow-md shadow-[#A0F89C]/15">
            <Workflow className="w-5 h-5 text-[#A0F89C]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[#FAFDFC] font-sans">
                Flow<span className="text-[#A0F89C]">Sense</span>
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#ADEBD9]/15 text-[#ADEBD9] rounded border border-[#ADEBD9]/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-[#99AFA9] font-medium tracking-tight">Process Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#99AFA9]/70">
          Core Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setIsOpen && setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#ADEBD9] text-[#01110A] shadow-md shadow-[#ADEBD9]/25 font-bold scale-[1.02]'
                    : 'text-[#99AFA9] hover:text-[#FAFDFC] hover:bg-[#3B4A34]/30'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Engine Status Card */}
      <div className="p-4 border-t border-[#3B4A34]/30 bg-[#01110A]">
        <div className="flex items-center gap-3 px-3.5 py-2.5 bg-[#082819]/80 rounded-xl border border-[#3B4A34]/60">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A0F89C] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#A0F89C]"></span>
          </span>
          <div className="text-xs">
            <p className="text-[#FAFDFC] font-bold leading-tight">Engine Active</p>
            <p className="text-[#99AFA9] text-[10px] mt-0.5">PM4Py &bull; Scikit-Learn ML</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
