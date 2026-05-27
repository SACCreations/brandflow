'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  Trash2, 
  Edit3, 
  X,
  Loader2,
  User,
  AlertCircle,
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
  _count?: {
    projects: number;
  };
  createdAt: string;
}

export default function ClientsSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'lead' | 'inactive'>('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    status: 'active'
  });

  const { data: clients, isLoading, isError } = useQuery({
    queryKey: ['clients', searchQuery, statusFilter],
    queryFn: async () => {
      const res = await apiClient.get('/customers', {
        params: {
          search: searchQuery || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      });
      return res.data as Client[];
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
    onError: (err: any) => {
      toast({
        title: 'Delete Failed',
        description: err.response?.data?.message || 'This client could not be removed.',
        variant: 'destructive',
      });
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
    
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-foreground">Database Connection Error</h2>
        <p className="text-sm text-muted-foreground">We couldn't load your client database. Please check your connection and try again.</p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
          className="rounded-xl bg-surface-2 px-6 py-2 text-sm font-bold text-foreground hover:bg-surface-2 text-foreground"
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Client Management</h1>
          <p className="mt-2 text-muted-foreground">Manage your external relationships and customer database.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-foreground shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" /> Add New Client
        </button>
      </div>

      {/* Grid of Clients */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-4 border-border">
        <div className="flex items-center gap-6">
          {[
            { label: `All Clients (${clients?.length || 0})`, value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Leads', value: 'lead' },
            { label: 'Inactive', value: 'inactive' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value as typeof statusFilter)}
              className={`text-sm font-bold pb-4 -mb-4 border-b-2 transition-colors ${
                statusFilter === tab.value
                  ? 'text-primary border-brand-600'
                  : 'text-muted-foreground border-transparent hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search database..." 
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="rounded-xl border border-border/50 bg-background pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients?.map((client) => (
          <div key={client.id} className="group relative overflow-hidden glass-premium p-6 transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/100/10">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex gap-1">
                <Link
                  href={`/settings/clients/${client.id}`}
                  className="rounded-lg px-3 py-2 text-xs font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary/10"
                >
                  View
                </Link>
                <button 
                  onClick={() => handleEdit(client)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-surface-2/50 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => deleteMutation.mutate(client.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-bold text-foreground">{client.name}</h3>
              <p className="text-xs text-muted-foreground font-medium">{client.company || 'Private Client'}</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> {client._count?.projects ?? 0} linked project{(client._count?.projects ?? 0) === 1 ? '' : 's'}
              </div>
              {client.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {client.email}
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {client.phone}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4 border-border">
              <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                client.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {client.status}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">Added {format(new Date(client.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        ))}
        
        {clients?.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full glass-panel text-muted-foreground">
              <User className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">No clients found</h3>
            <p className="text-sm text-muted-foreground">Start by adding your first customer or lead.</p>
          </div>
        )}
      </div>

      {/* Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg glass-premium p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-foreground">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                <p className="text-sm text-muted-foreground">Enter client information to save it to your database.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-surface-2/50 p-2 text-muted-foreground hover:bg-surface-3 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Client Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-border/50 bg-surface-1/50 px-10 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    className="w-full rounded-xl border border-border/50 bg-surface-1/50 px-10 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Company</label>
                  <input 
                    type="text" 
                    placeholder="Company Name"
                    className="w-full rounded-xl border border-border/50 bg-surface-1/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phone</label>
                  <input 
                    type="text" 
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-border/50 bg-surface-1/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Relationship Status</label>
                <div className="flex gap-2">
                  {['active', 'lead', 'inactive'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFormData({...formData, status: s})}
                      className={`flex-1 rounded-xl border py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        formData.status === s 
                          ? 'border-primary bg-primary/10 text-primary dark:bg-primary/100/10' 
                          : 'border-border/50 bg-surface-1/50 text-muted-foreground hover:bg-surface-2'
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
                  className="flex-1 rounded-xl border border-border/50 py-3 text-sm font-bold text-muted-foreground hover:bg-surface-1 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-foreground shadow-lg shadow-brand-500/20 hover:bg-brand-700 disabled:opacity-50"
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
