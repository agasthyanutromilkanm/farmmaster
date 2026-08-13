'use client';

import { useEffect, useState } from 'react';
import { 
  Tractor, 
  Warehouse, 
  Tag as TagIcon, 
  Beef as CattleIcon,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Stats {
  totalFarms: number;
  totalSheds: number;
  totalCattle: number;
  totalTags: number;
  activeTags: number;
  availableTags: number;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const cards = [
    { name: 'Total Farms', value: stats?.totalFarms || 0, icon: Tractor, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    { name: 'Total Sheds', value: stats?.totalSheds || 0, icon: Warehouse, color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
    { name: 'Total Cattle', value: stats?.totalCattle || 0, icon: CattleIcon, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
    { name: 'Active Tags', value: stats?.activeTags || 0, icon: TagIcon, color: 'text-amber-600', bg: 'bg-amber-600/10' },
  ];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 font-geist-sans tracking-tight">System Overview</h1>
        <p className="text-slate-500 font-medium">Monitoring dairy farm performance and asset health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map((card) => (
          <div key={card.name} className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-6">
              <div className={cn("p-4 rounded-2xl", card.bg)}>
                <card.icon className={cn("w-7 h-7", card.color)} />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border border-emerald-100">
                <TrendingUp className="w-3 h-3" />
                <span>Steady Growth</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">{card.name}</p>
            <div className="flex items-baseline justify-between capitalize">
               <h3 className="text-4xl font-black text-slate-900">{card.value}</h3>
               <ArrowUpRight className="w-6 h-6 text-slate-200 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900">
              <Activity className="w-6 h-6 text-blue-600" />
              Live Feed
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-bold underline underline-offset-4 decoration-2">View Log</button>
          </div>
          
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-center p-4 hover:bg-slate-50 rounded-2xl transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-100 group">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform border border-blue-100/50">
                  <CattleIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">New Cattle Identification</p>
                  <p className="text-xs text-slate-400 font-medium">Asset ID #528 successfully indexed into Cluster 1</p>
                </div>
                <span className="text-[10px] uppercase font-black text-slate-300 tracking-tighter">18 MAR</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tag Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-10 text-slate-900">Tag Distribution</h3>
          <div className="relative h-56 flex items-center justify-center">
             <div className="w-36 h-36 border-[12px] border-blue-600 rounded-full flex items-center justify-center relative shadow-inner">
                <div className="absolute inset-0 border-[12px] border-slate-100 rounded-full border-t-amber-500 rotate-45" />
                <div className="text-center">
                  <p className="text-3xl font-black text-slate-900 leading-none">{stats?.totalTags || 0}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-2">Active Units</p>
                </div>
             </div>
          </div>
          <div className="space-y-5 mt-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-blue-600" />
                 <span className="text-sm font-bold text-slate-600">Assigned</span>
              </div>
              <span className="text-sm font-black text-slate-900">{stats?.activeTags || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-amber-500" />
                 <span className="text-sm font-bold text-slate-600">Inventory</span>
              </div>
              <span className="text-sm font-black text-slate-900">{stats?.availableTags || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
