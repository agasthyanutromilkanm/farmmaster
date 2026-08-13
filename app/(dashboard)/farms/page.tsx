'use client';

import { useEffect, useState } from 'react';
import {
  Tractor,
  MapPin,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface Farm {
  _id: string;
  name: string;
  code: string;
  address: string;
  location: string;
  status: boolean;
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newFarm, setNewFarm] = useState({ name: '', code: '', address: '', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchFarms = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/farms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setFarms(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch farms', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newFarm)
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Farm created successfully' });
        setNewFarm({ name: '', code: '', address: '', location: '' });
        await fetchFarms();
        setTimeout(() => setShowModal(false), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create farm' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Farm Management</h1>
          <p className="text-slate-500 font-medium">Registry and geolocation of all dairy production units.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-6 h-6" />
          Register Unit
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {farms.map((farm) => (
            <div key={farm._id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 group">
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-inner border border-blue-100/50">
                    <Tractor className="w-7 h-7" />
                  </div>
                  <button className="text-slate-300 hover:text-slate-900 transition-colors">
                    <MoreVertical className="w-6 h-6" />
                  </button>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2 truncate leading-none">{farm.name}</h3>
                <p className="text-xs text-blue-500 font-black mb-6 uppercase tracking-widest">{farm.code}</p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-sm text-slate-500 font-medium">
                    <MapPin className="w-5 h-5 mt-0.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    <span className="line-clamp-2">{farm.address || 'Location metadata pending'}</span>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-[10px] uppercase font-black tracking-tighter px-3 py-1 rounded-full border ${farm.status ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm'}`}>
                  {farm.status ? 'Active Unit' : 'Offline'}
                </span>
                <div className="flex gap-4">
                  <button className="p-2 text-slate-300 hover:text-blue-600 transition-all hover:bg-white rounded-xl shadow-sm"><Edit className="w-5 h-5" /></button>
                  <button className="p-2 text-slate-300 hover:text-rose-600 transition-all hover:bg-white rounded-xl shadow-sm"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          ))}

          {farms.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center bg-white">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <Tractor className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-400">Zero Units Indexed</h3>
              <p className="text-slate-500 font-bold mt-2">Initialize your dairy enterprise by adding a production farm.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModal(false)} />

          <div className="bg-white border border-slate-200 rounded-3xl p-10 w-full max-w-xl relative z-10 shadow-2xl animate-in fade-in slide-in-from-bottom duration-500 scale-100">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/30">
                  <Tractor className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Define Production Unit</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Industrial Asset Entry</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all transform hover:rotate-90 duration-300"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {message.text && (
              <div className={`mb-8 p-6 rounded-2xl flex items-center gap-4 shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                {message.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                <p className="text-sm font-bold">{message.text}</p>
              </div>
            )}

            <form onSubmit={handleCreateFarm} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enterprise Name</label>
                  <input
                    required
                    value={newFarm.name}
                    onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })}
                    placeholder="E.g. Green Valley"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Code</label>
                  <input
                    required
                    value={newFarm.code}
                    onChange={(e) => setNewFarm({ ...newFarm, code: e.target.value.toUpperCase() })}
                    placeholder="UNIT-X"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GPS Metadata / Coordinates</label>
                <input
                  value={newFarm.location}
                  onChange={(e) => setNewFarm({ ...newFarm, location: e.target.value })}
                  placeholder="E.g. 19.0760° N, 72.8777° E"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address Log</label>
                <textarea
                  rows={3}
                  value={newFarm.address}
                  onChange={(e) => setNewFarm({ ...newFarm, address: e.target.value })}
                  placeholder="Complete postal identification..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-5 rounded-3xl shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg mt-10 uppercase tracking-widest"
              >
                {submitting ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <>
                    <span>Execute Asset Registry</span>
                    <ChevronRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
