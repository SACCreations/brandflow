'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronRight, FolderKanban, Fingerprint, X } from 'lucide-react';
import { cn } from '@brandflow/ui';
import { apiClient } from '@/lib/api-client';
import { useScopeStore } from '@/store/scope.store';

interface DropdownItem {
  id: string;
  name: string;
  [key: string]: any;
}

export function ScopeSwitcher() {
  const { customer, project, brand, setCustomer, setProject, setBrand, clearScope } =
    useScopeStore();

  const hasScope = customer || project || brand;

  return (
    <div className="flex items-center gap-1 border-b border-border bg-background px-6 py-2 border-border bg-background">
      <span className="mr-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Scope
      </span>

      <ScopeSegment
        icon={Building2}
        placeholder="All Clients"
        value={customer}
        queryKey="scope-customers"
        fetchUrl="/customers"
        onSelect={(item) => setCustomer(item)}
        onClear={() => setCustomer(null)}
      />

      <ChevronRight className="h-3 w-3 text-muted-foreground dark:text-gray-600" />

      <ScopeSegment
        icon={FolderKanban}
        placeholder="All Projects"
        value={project}
        queryKey="scope-projects"
        fetchUrl="/projects"
        fetchParams={customer ? { customerId: customer.id } : undefined}
        onSelect={(item) => setProject(item)}
        onClear={() => setProject(null)}
        disabled={!customer}
      />

      <ChevronRight className="h-3 w-3 text-muted-foreground dark:text-gray-600" />

      <ScopeSegment
        icon={Fingerprint}
        placeholder="All Brands"
        value={brand}
        queryKey="scope-brands"
        fetchUrl="/brands"
        fetchParams={project ? { projectId: project.id } : customer ? { customerId: customer.id } : undefined}
        onSelect={(item) => setBrand(item)}
        onClear={() => setBrand(null)}
      />

      {hasScope && (
        <button
          onClick={clearScope}
          className="ml-3 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-surface-2 hover:text-gray-700 dark:hover:bg-surface-1 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}

function ScopeSegment({
  icon: Icon,
  placeholder,
  value,
  queryKey,
  fetchUrl,
  fetchParams,
  onSelect,
  onClear,
  disabled,
}: {
  icon: typeof Building2;
  placeholder: string;
  value: DropdownItem | null;
  queryKey: string;
  fetchUrl: string;
  fetchParams?: Record<string, string>;
  onSelect: (item: DropdownItem) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const { data: items = [] } = useQuery<DropdownItem[]>({
    queryKey: [queryKey, fetchParams],
    queryFn: async () => {
      const res = await apiClient.get(fetchUrl, { params: fetchParams });
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    },
    enabled: open,
    staleTime: 30_000,
  });

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
          disabled
            ? 'cursor-not-allowed text-muted-foreground dark:text-gray-600'
            : value
              ? 'bg-primary/10 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
              : 'text-muted-foreground hover:bg-surface-2 text-muted-foreground dark:hover:bg-surface-1',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="max-w-[120px] truncate">{value?.name ?? placeholder}</span>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setOpen(false);
            }}
            className="ml-0.5 rounded-full p-0.5 hover:bg-surface-3 dark:hover:bg-gray-700"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-background shadow-lg border-border bg-background">
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-md border border-border bg-surface-1 bg-background px-3 py-1.5 text-xs outline-none focus:border-primary border-border bg-surface-2 text-foreground"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto px-1 pb-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No results</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'flex w-full items-center rounded-md px-3 py-2 text-left text-xs transition-colors',
                    item.id === value?.id
                      ? 'bg-primary/10 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                      : 'text-foreground hover:bg-surface-2 text-foreground dark:hover:bg-surface-1',
                  )}
                >
                  {item.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
