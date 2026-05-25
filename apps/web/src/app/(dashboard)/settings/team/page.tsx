'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  Search,
  Filter,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@brandflow/ui';
import { format } from 'date-fns';

interface Member {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  role: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export default function TeamSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [selectedRole, setSelectedRole] = useState('editor');

  const { data: members, isLoading, isError } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await apiClient.get('/business/members');
      return res.data as Member[];
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      await apiClient.patch('/business/members/invite', { email, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/business/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: 'Member Removed', description: 'User access has been revoked.' });
    },
    onError: (err: any) => {
      toast({ 
        title: 'Removal Failed', 
        description: err.response?.data?.message || 'Could not remove member.',
        variant: 'destructive'
      });
    }
  });

  const handleAddEmailRow = () => setInviteEmails([...inviteEmails, '']);
  const handleRemoveEmailRow = (index: number) => {
    if (inviteEmails.length > 1) {
      setInviteEmails(inviteEmails.filter((_, i) => i !== index));
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...inviteEmails];
    newEmails[index] = value;
    setInviteEmails(newEmails);
  };

  const handleInvite = async () => {
    const validEmails = inviteEmails.filter(email => email.trim() !== '' && email.includes('@'));
    if (validEmails.length === 0) {
      toast({ title: 'Invalid Emails', description: 'Please enter valid email addresses.', variant: 'destructive' });
      return;
    }

    let successCount = 0;
    for (const email of validEmails) {
      try {
        await inviteMutation.mutateAsync({ email, role: selectedRole });
        successCount++;
      } catch (err: any) {
        console.error(`Failed to invite ${email}`, err);
      }
    }

    toast({ 
      title: 'Invitations Sent', 
      description: `Successfully sent ${successCount} invitation(s).` 
    });
    setIsInviteModalOpen(false);
    setInviteEmails(['']);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Team Management</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Manage access control and collaborate with your organization.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
        >
          <UserPlus className="h-4 w-4" /> Add Team Members
        </button>
      </div>

      {/* Stats Mini-Bar */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2 dark:bg-blue-500/10"><Users className="h-5 w-5 text-blue-600" /></div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-white">{members?.length || 0}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Seats</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-2 dark:bg-purple-500/10"><Shield className="h-5 w-5 text-purple-600" /></div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-white">{members?.filter(m => m.role.name === 'admin' || m.role.name === 'owner').length || 0}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admins</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2 dark:bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-white">Active</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-brand-50 bg-brand-50/20 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-100 p-2 dark:bg-brand-500/20"><UserPlus className="h-5 w-5 text-brand-600" /></div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-white">Unlimited</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-6 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search team..." 
                className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
              />
            </div>
            <button className="rounded-xl border border-gray-100 dark:border-gray-800 p-2 text-gray-500 dark:border-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-800">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50 dark:bg-gray-950/50 dark:border-gray-800 dark:bg-gray-800/30">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {members?.map((member) => (
                <tr key={member.id} className="group transition-colors hover:bg-gray-50 dark:bg-gray-950/50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                        {member.user.avatarUrl ? (
                          <img src={member.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-black text-gray-400">
                            {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {member.user.firstName} {member.user.lastName}
                        </div>
                        <div className="text-xs text-gray-400">{member.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      member.role.name === 'owner' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' :
                      member.role.name === 'admin' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      <Shield className="h-3 w-3" />
                      {member.role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                    {format(new Date(member.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => removeMutation.mutate(member.user.id)}
                        disabled={member.role.name === 'owner'}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors disabled:opacity-0"
                        title="Revoke Access"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Team Members</h2>
                <p className="text-sm text-gray-500">Collaborate with your team by adding them here.</p>
              </div>
              <button onClick={() => setIsInviteModalOpen(false)} className="rounded-full bg-gray-50 dark:bg-gray-950 p-2 text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                  Email Addresses
                  <span className="text-brand-600 cursor-pointer hover:underline" onClick={handleAddEmailRow}>+ Add Another</span>
                </label>
                <div className="max-h-[200px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {inviteEmails.map((email, index) => (
                    <div key={index} className="flex gap-2 animate-in slide-in-from-right-2 duration-300">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="email" 
                          placeholder="coworker@company.com"
                          className="w-full rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-10 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                          value={email}
                          onChange={(e) => handleEmailChange(index, e.target.value)}
                        />
                      </div>
                      {inviteEmails.length > 1 && (
                        <button 
                          onClick={() => handleRemoveEmailRow(index)}
                          className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-gray-400 hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:hover:bg-gray-800"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assign Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {['admin', 'editor', 'viewer'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                        selectedRole === role 
                          ? 'border-brand-500 bg-brand-50/50 text-brand-600 dark:bg-brand-500/10' 
                          : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800'
                      }`}
                    >
                      <Shield className="h-5 w-5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{role}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-100 dark:border-gray-800 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleInvite}
                  disabled={inviteMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 disabled:opacity-50"
                >
                  {inviteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Invitations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
