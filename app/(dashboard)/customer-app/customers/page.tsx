'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar,
  X, 
  Loader2, 
  CheckCircle2, 
  Info,
  Pencil,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';

interface Address {
  _id: string;
  fullName: string;
  label: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface Customer {
  _id: string;
  phone: string;
  name: string;
  email?: string;
  status: boolean;
  createdAt: string;
  addresses: Address[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Edit customer state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });

  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setCustomers(result.data);
      } else {
        setError(result.error || 'Failed to fetch customer directory');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    const search = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.phone.includes(search) ||
      (customer.email && customer.email.toLowerCase().includes(search))
    );
  });

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
    });
    setModalMessage({ type: '', text: '' });
    setSelectedCustomer(null); // Close details modal if open
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setSubmitting(true);
    setModalMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/customers/${editingCustomer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      
      const result = await res.json();
      if (result.success) {
        setModalMessage({ type: 'success', text: 'Customer profile updated successfully' });
        await fetchCustomers();
        setTimeout(() => setEditingCustomer(null), 1200);
      } else {
        setModalMessage({ type: 'error', text: result.error || 'Failed to update customer profile' });
      }
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message || 'An unexpected error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete customer "${name || 'Anonymous User'}"? This action soft-deletes the customer profile.`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        await fetchCustomers();
        setSelectedCustomer(null);
      } else {
        alert(result.error || 'Failed to delete customer');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while deleting customer');
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Customer Directory</h1>
          <p className="text-slate-500 font-bold tracking-tight">Registered mobile client accounts and delivery profiles.</p>
        </div>
      </div>

      {/* Search and stats bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-6 rounded-[24px]">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Customers</span>
            <span className="text-2xl font-black text-slate-900">{customers.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-[20px] font-bold text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">S.No</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Full Name</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Mobile Number</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Email Address</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Addresses</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Registered On</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                      No registered customers found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <tr key={customer._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-800 text-sm">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-900 block">
                              {customer.name || 'Anonymous User'}
                            </span>
                            {!customer.name && (
                              <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded uppercase font-black tracking-wider">
                                OTP Verified Only
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{customer.phone}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {customer.email || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {customer.addresses.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 w-fit uppercase tracking-wider">
                              <MapPin className="w-3 h-3 text-blue-500" />
                              {customer.addresses.length} {customer.addresses.length === 1 ? 'Saved' : 'Saved'}
                            </span>
                            <span className="text-xs text-slate-500 font-bold max-w-[220px] truncate" title={customer.addresses.find(a => a.isDefault)?.addressLine1 || customer.addresses[0].addressLine1}>
                              {customer.addresses.find(a => a.isDefault)?.addressLine1 || customer.addresses[0].addressLine1}
                              , {customer.addresses.find(a => a.isDefault)?.city || customer.addresses[0].city}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            No addresses
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-300" />
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all uppercase tracking-wider shadow-sm hover:shadow"
                        >
                          <Info className="w-3.5 h-3.5" />
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" onClick={() => setSelectedCustomer(null)} />
          
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 w-full max-w-4xl relative z-10 shadow-3xl animate-in slide-in-from-bottom-32 duration-500 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-3xl shadow-slate-900/40">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                     {selectedCustomer.name || 'Anonymous Profile'}
                   </h2>
                   <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.3em] font-black">Registered Customer Details</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all transform hover:rotate-90 duration-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
              {/* Profile summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Registered Mobile</span>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span className="font-bold text-slate-900">{selectedCustomer.phone}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Email Address</span>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <span className="font-bold text-slate-900 break-all">{selectedCustomer.email || 'No email registered'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Registration Date</span>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-bold text-slate-900">{new Date(selectedCustomer.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Saved Delivery Addresses */}
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Saved Delivery Addresses ({selectedCustomer.addresses.length})
                </h3>

                {selectedCustomer.addresses.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 text-center text-slate-400 font-bold text-sm">
                    This customer has not registered any delivery addresses yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCustomer.addresses.map((address) => (
                      <div 
                        key={address._id} 
                        className={`p-5 rounded-2xl border transition-all ${
                          address.isDefault 
                            ? 'bg-blue-600/5 border-blue-200 shadow-md shadow-blue-500/5' 
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider border ${
                            address.isDefault 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {address.label}
                          </span>
                          {address.isDefault && (
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                              ★ Primary Delivery Address
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="font-black text-slate-900 text-sm">{address.fullName}</p>
                          <p className="text-xs text-slate-500 font-medium">{address.phone}</p>
                          
                          <div className="pt-2 text-xs text-slate-600 leading-relaxed font-semibold">
                            <p>{address.addressLine1}</p>
                            {address.addressLine2 && <p>{address.addressLine2}</p>}
                            <p>{address.city}, {address.state} - {address.pincode}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditClick(selectedCustomer)}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Profile
                </button>
                <button
                  onClick={() => handleDeleteCustomer(selectedCustomer._id, selectedCustomer.name)}
                  className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-rose-100"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" onClick={() => setEditingCustomer(null)} />
          
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 w-full max-w-2xl relative z-10 shadow-3xl animate-in slide-in-from-bottom-32 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-3xl shadow-slate-900/40">
                  <Pencil className="w-7 h-7 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">Edit Customer Profile</h2>
                   <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.3em] font-black">Credential Authority Register</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all transform hover:rotate-90 duration-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMessage.text && (
              <div className={`mb-6 p-4 rounded-[20px] flex items-center gap-3 shadow-sm border ${
                modalMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                {modalMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {modalMessage.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                <p className="font-black text-sm">{modalMessage.text}</p>
              </div>
            )}

            <form onSubmit={handleUpdateCustomer} className="space-y-6">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3.5 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Mobile Number</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Enter mobile number"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3.5 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter email address (optional)"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3.5 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
