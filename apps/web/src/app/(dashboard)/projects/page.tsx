'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  AlertCircle,
  FolderKanban as ProjectIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Calendar as CalendarIcon,
  DollarSign as DollarIcon,
  CheckCircle2 as CheckIcon,
  X as XIcon,
  Loader2 as LoaderIcon,
  Trash2 as TrashIcon,
  Edit3 as EditIcon,
  Layout as LayoutIcon,
  Users as UsersIcon,
  Building2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@brandflow/ui';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  customerId: string | null;
  customer?: {
    id: string;
    name: string;
    company: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  name: string;
}

export default function ProjectsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    startDate: '',
    endDate: '',
    budget: '',
    customerId: ''
  });

  const queryCustomerId = searchParams.get('customerId');
  const shouldOpenNew = searchParams.get('open') === 'new';

  React.useEffect(() => {
    if (queryCustomerId) {
      setCustomerFilter(queryCustomerId);
      setFormData((current) => ({ ...current, customerId: queryCustomerId }));
    }

    if (shouldOpenNew) {
      setEditingProject(null);
      setIsModalOpen(true);
    }
  }, [queryCustomerId, shouldOpenNew]);

  const { data: projects, isLoading: projectsLoading, isError: projectsError } = useQuery({
    queryKey: ['projects', searchQuery, statusFilter, customerFilter],
    queryFn: async () => {
      const res = await apiClient.get('/projects', {
        params: {
          search: searchQuery || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          customerId: customerFilter === 'all' ? undefined : customerFilter,
        },
      });
      return res.data.data as Project[];
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await apiClient.get('/customers');
      return res.data.data as Customer[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/projects', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Project Created', description: 'Your new project has been initialized.' });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ 
        title: 'Creation Failed', 
        description: err.response?.data?.message || 'Could not create project.',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiClient.patch(`/projects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Project Updated', description: 'Project details have been synchronized.' });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Project Removed', description: 'The project has been permanently deleted.' });
    },
    onError: (err: any) => {
      toast({
        title: 'Delete Failed',
        description: err.response?.data?.message || 'This project could not be removed.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', status: 'active', startDate: '', endDate: '', budget: '', customerId: '' });
    setEditingProject(null);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? (new Date(project.startDate).toISOString().split('T')[0] ?? '') : '',
      endDate: project.endDate ? (new Date(project.endDate).toISOString().split('T')[0] ?? '') : '',
      budget: project.budget?.toString() || '',
      customerId: project.customerId || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Project name is required.', variant: 'destructive' });
      return;
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      toast({ title: 'Validation Error', description: 'End date must be on or after the start date.', variant: 'destructive' });
      return;
    }

    const payload = {
      ...formData,
      budget: formData.budget ? Number.parseInt(formData.budget, 10) : null,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      customerId: formData.customerId || null
    };

    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (projectsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (projectsError) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project workspace unavailable</h2>
        <p className="text-sm text-gray-500">We couldn't load your projects right now. Please try again in a moment.</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
          className="rounded-xl bg-gray-100 px-6 py-2 text-sm font-bold text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Project Management</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Orchestrate your workflows and track progress across initiatives.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
        >
          <PlusIcon className="h-4 w-4" /> Create Project
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
          />
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={customerFilter}
            onChange={(event) => setCustomerFilter(event.target.value)}
            className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
          >
            <option value="all">All clients</option>
            {customers?.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Mini-Bar */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2 dark:bg-blue-500/10"><LayoutIcon className="h-5 w-5 text-blue-600" /></div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-white">{projects?.length || 0}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Projects</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2 dark:bg-emerald-500/10"><CheckIcon className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-white">{projects?.filter(p => p.status === 'completed').length || 0}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2 dark:bg-amber-500/10"><DollarIcon className="h-5 w-5 text-amber-600" /></div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-white">
                ${projects?.reduce((acc, p) => acc + (p.budget || 0), 0).toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Budget</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-2 dark:bg-purple-500/10"><UsersIcon className="h-5 w-5 text-purple-600" /></div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-white">Multi</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collaboration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <div key={project.id} className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 transition-all hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
                <ProjectIcon className="h-6 w-6" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(project)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <EditIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => deleteMutation.mutate(project.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h3>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-xs font-bold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    View
                  </Link>
                </div>
              {project.customer && (
                <div className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-600">
                  <Building2 className="h-3 w-3" />
                  {project.customer.name}
                </div>
              )}
              <p className="mt-2 text-sm text-gray-500 line-clamp-2 min-h-[40px]">{project.description || 'No description provided.'}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-50 pt-6 dark:border-gray-800">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget</div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
                  <DollarIcon className="h-3.5 w-3.5 text-brand-600" />
                  {project.budget ? project.budget.toLocaleString() : 'N/A'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deadline</div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
                  <CalendarIcon className="h-3.5 w-3.5 text-brand-600" />
                  {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'No date'}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 dark:border-gray-900 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                    U{i}
                  </div>
                ))}
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                project.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 
                project.status === 'completed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' :
                'bg-gray-100 text-gray-500 dark:bg-gray-800'
              }`}>
                {project.status}
              </span>
            </div>
          </div>
        ))}

        {projects?.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-gray-200 bg-white/60 p-12 text-center dark:border-gray-800 dark:bg-gray-900/70">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300 dark:bg-gray-800">
              <ProjectIcon className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">No projects match these filters</h3>
            <p className="mt-2 text-sm text-gray-500">Try adjusting your search, changing the status filter, or create a fresh project.</p>
          </div>
        )}
      </div>

      {/* Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editingProject ? 'Edit Project' : 'Initiate New Project'}</h2>
                <p className="text-sm text-gray-500">Configure your project parameters and timeline.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-gray-50 p-2 text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Q3 Marketing Blitz"
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assign Client</label>
                  <select 
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={formData.customerId}
                    onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                  >
                    <option value="">No Client (Internal)</option>
                    {customers?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                <textarea 
                  rows={3}
                  placeholder="What are the main objectives?"
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End Date</label>
                  <input 
                    type="date" 
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget ($)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                  <select 
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-6 flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-100 py-3.5 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:border-gray-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <LoaderIcon className="h-4 w-4 animate-spin" />}
                  {editingProject ? 'Update Project' : 'Launch Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
