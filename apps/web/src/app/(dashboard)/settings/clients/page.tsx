'use client';

import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Building2, 
  Globe, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X,
  Loader2,
  User
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@brandflow/ui';
import { format } from 'date-fns';

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
}

export default function ClientsSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    status: 'active'
  });

  const { data: clients, isLoading, isError } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await apiClient.get('/customers');
      return res.data.data as Client[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/customers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client Created', description: 'The client has been added to your CRM.' });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ 
        title: 'Creation Failed', 
        description: err.response?.data?.message || 'Could not create client.',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiClient.patch(`/customers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client Updated', description: 'Client information has been saved.' });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client Removed', description: 'The client has been deleted.' });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', company: '', phone: '', status: 'active' });
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || '',
      company: client.company || '',
      phone: client.phone || '',
      status: client.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Client name is required.', variant: 'destructive' });
      return;
    }
    
    console.log('Submitting Client:', formData);
    
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Database Connection Error</h2>
        <p className="text-sm text-gray-500">We couldn't load your client database. Please check your connection and try again.</p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
          className="rounded-xl bg-gray-100 px-6 py-2 text-sm font-bold text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Client Management</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Manage your external relationships and customer database.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" /> Add New Client
        </button>
      </div>

      {/* Grid of Clients */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold text-brand-600 border-b-2 border-brand-600 pb-4 -mb-4">All Clients ({clients?.length || 0})</span>
          <span className="text-sm font-bold text-gray-400 hover:text-gray-600 cursor-pointer">Active</span>
          <span className="text-sm font-bold text-gray-400 hover:text-gray-600 cursor-pointer">Leads</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search database..." 
              className="rounded-xl border border-gray-100 bg-white pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients?.map((client) => (
          <div key={client.id} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEdit(client)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => deleteMutation.mutate(client.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{client.name}</h3>
              <p className="text-xs text-gray-400 font-medium">{client.company || 'Private Client'}</p>
            </div>

            <div className="mt-6 space-y-3">
              {client.email && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail className="h-3.5 w-3.5 text-gray-400" /> {client.email}
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="h-3.5 w-3.5 text-gray-400" /> {client.phone}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-800">
              <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                client.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {client.status}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Added {format(new Date(client.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        ))}
        
        {clients?.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300 dark:bg-gray-800">
              <User className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">No clients found</h3>
            <p className="text-sm text-gray-500">Start by adding your first customer or lead.</p>
          </div>
        )}
      </div>

      {/* Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                <p className="text-sm text-gray-500">Enter client information to save it to your database.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-gray-50 p-2 text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-10 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-10 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company</label>
                  <input 
                    type="text" 
                    placeholder="Company Name"
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</label>
                  <input 
                    type="text" 
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Relationship Status</label>
                <div className="flex gap-2">
                  {['active', 'lead', 'inactive'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFormData({...formData, status: s})}
                      className={`flex-1 rounded-xl border py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        formData.status === s 
                          ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10' 
                          : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-100 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:border-gray-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingClient ? 'Save Changes' : 'Add Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
