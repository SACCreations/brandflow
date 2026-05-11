'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { 
  Sparkles, 
  Plus, 
  Building2, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Archive, 
  Trash2,
  Filter,
  ArrowUpDown,
  ExternalLink,
  History,
  ShieldCheck,
  Palette,
  Loader2,
  Undo2
} from 'lucide-react';
import { 
  Card, 
  Badge, 
  Button, 
  Input, 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  useToast,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn
} from '@brandflow/ui';
import { format } from 'date-fns';

export default function BrandsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState('updatedAt');
  const [industryFilter, setIndustryFilter] = React.useState('all');
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { data: brands, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await apiClient.get('/brands');
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/brands/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: 'Brand deleted',
        description: 'The brand has been moved to trash.',
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => restoreMutation.mutate(id)}
            className="gap-1"
          >
            <Undo2 className="w-3 h-3" /> Undo
          </Button>
        ),
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete brand.',
      });
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/brands/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: 'Brand restored',
        description: 'The brand has been successfully restored.',
      });
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (brand: any) => {
      const { id, createdAt, updatedAt, version, ...rest } = brand;
      return apiClient.post('/brands', {
        ...rest,
        name: `${brand.name} (Copy)`,
        slug: brand.slug ? `${brand.slug}-copy` : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: 'Brand duplicated',
        description: 'A copy of the brand has been created.',
      });
    }
  });

  const filteredBrands = React.useMemo(() => {
    if (!brands) return [];
    
    return brands
      .filter((brand: any) => {
        const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          brand.industry?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesIndustry = industryFilter === 'all' || brand.industry === industryFilter;
        return matchesSearch && matchesIndustry;
      })
      .sort((a: any, b: any) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'updatedAt') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (sortBy === 'healthScore') return b.healthScore - a.healthScore;
        return 0;
      });
  }, [brands, searchQuery, industryFilter, sortBy]);

  const industries = React.useMemo(() => {
    if (!brands) return [];
    const unique = new Set(brands.map((b: any) => b.industry).filter(Boolean));
    return Array.from(unique);
  }, [brands]);

  const stats = React.useMemo(() => {
    if (!brands) return { total: 0, avgHealth: 0, active: 0 };
    const avg = brands.length > 0 ? brands.reduce((acc: number, b: any) => acc + (b.healthScore || 0), 0) / brands.length : 0;
    const active = brands.filter((b: any) => new Date(b.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
    return { total: brands.length, avgHealth: Math.round(avg), active };
  }, [brands]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-0 overflow-hidden">
              <Skeleton className="h-24 w-full" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="pt-4 flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Brands</h1>
          <p className="mt-1 text-gray-500 text-lg">Manage your unique brand identities and design systems.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/intelligence/brands/analyse">
            <Button variant="outline" className="gap-2 border-brand-200 text-brand-700 hover:bg-brand-50">
              <Sparkles className="w-4 h-4" />
              AI Analyser
            </Button>
          </Link>
          <Link href="/intelligence/brands/new">
            <Button className="gap-2 bg-brand-600 hover:bg-brand-700 shadow-md">
              <Plus className="w-4 h-4" />
              Create Brand
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Brands</p>
            <p className="text-3xl font-black mt-1 text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center transform group-hover:scale-110 transition-all">
            <Building2 className="w-5 h-5" />
          </div>
        </Card>
        <Card className="p-5 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Average Health</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-3xl font-black text-emerald-600">{stats.avgHealth}%</p>
              <div className="w-20 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${stats.avgHealth}%` }} />
              </div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center transform group-hover:scale-110 transition-all">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </Card>
        <Card className="p-5 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Recently</p>
            <p className="text-3xl font-black mt-1 text-amber-600">{stats.active}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center transform group-hover:scale-110 transition-all">
            <History className="w-5 h-5" />
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:flex-1">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
            <Input 
              placeholder="Search brands by name or industry..." 
              className="pl-10 h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 focus-visible:ring-brand-500 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full md:w-[180px] h-11 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((ind: any) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px] h-11 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800">
              <ArrowUpDown className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Recently Updated</SelectItem>
              <SelectItem value="name">Brand Name (A-Z)</SelectItem>
              <SelectItem value="healthScore">Health Score</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-8 w-px bg-gray-100 dark:bg-gray-800 hidden md:block mx-1" />

          <div className="flex items-center bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white dark:bg-gray-700 shadow-sm text-brand-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'table' ? "bg-white dark:bg-gray-700 shadow-sm text-brand-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredBrands.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map((brand: any) => (
              <Card key={brand.id} className="p-0 overflow-hidden hover:shadow-xl hover:border-brand-300 transition-all group relative">
                <div 
                  className="h-24 p-6 flex items-end relative overflow-hidden"
                  style={{ 
                    background: brand.visualRules?.primaryColor 
                      ? `linear-gradient(135deg, ${brand.visualRules.primaryColor} 0%, ${brand.visualRules.secondaryColor || brand.visualRules.primaryColor} 100%)`
                      : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
                  }}
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl border-gray-100 dark:border-gray-800 space-y-1">
                        <Link href={`/intelligence/brands/${brand.id}`}>
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                            <Edit className="w-4 h-4" /> Edit Brand
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => duplicateMutation.mutate(brand)}>
                          <Copy className="w-4 h-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 cursor-pointer text-amber-600 focus:text-amber-600">
                          <Archive className="w-4 h-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                          onClick={() => setDeleteId(brand.id)}
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    {brand.visualRules?.logoUrls?.[0] ? (
                      <img src={brand.visualRules.logoUrls[0]} alt={brand.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-brand-600" />
                    )}
                  </div>
                </div>
                <Link href={`/intelligence/brands/${brand.id}`} className="block">
                  <div className="p-6 space-y-5">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate pr-2 group-hover:text-brand-600 transition-colors">{brand.name}</h3>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">{brand.industry || 'General'}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1.5 h-10">
                        {brand.tagline || brand.positioning || 'No positioning statement defined yet.'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex flex-1 gap-1.5 h-6 overflow-hidden">
                        {Array.isArray(brand.tone) && brand.tone.length > 0 ? brand.tone.slice(0, 3).map((t: string) => (
                          <Badge key={t} variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {t}
                          </Badge>
                        )) : (
                          <span className="text-xs text-gray-400 italic">No tone specified</span>
                        )}
                      </div>
                      
                      {/* Mini Color Palette */}
                      {brand.visualRules?.primaryColor && (
                        <div className="flex -space-x-1">
                          <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" style={{ backgroundColor: brand.visualRules.primaryColor }} />
                          {brand.visualRules.secondaryColor && (
                            <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" style={{ backgroundColor: brand.visualRules.secondaryColor }} />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                            <path
                              className="text-gray-100 dark:text-gray-800"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className={brand.healthScore > 70 ? "text-emerald-500" : brand.healthScore > 30 ? "text-amber-500" : "text-red-500"}
                              strokeDasharray={`${brand.healthScore}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black">{brand.healthScore}</span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">Score</span>
                      </div>
                      <span className="text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-md">Updated {format(new Date(brand.updatedAt), 'MMM d')}</span>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-0 overflow-hidden border-gray-100 dark:border-gray-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Brand</th>
                  <th className="px-6 py-4 font-semibold">Industry</th>
                  <th className="px-6 py-4 font-semibold">Health Score</th>
                  <th className="px-6 py-4 font-semibold">Last Updated</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredBrands.map((brand: any) => (
                  <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/intelligence/brands/${brand.id}`} className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{ 
                            background: brand.visualRules?.primaryColor 
                              ? `linear-gradient(135deg, ${brand.visualRules.primaryColor} 0%, ${brand.visualRules.secondaryColor || brand.visualRules.primaryColor} 100%)`
                              : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
                          }}
                        >
                          {brand.visualRules?.logoUrls?.[0] ? (
                            <img src={brand.visualRules.logoUrls[0]} alt={brand.name} className="w-6 h-6 object-contain" />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{brand.name}</p>
                          <p className="text-xs text-gray-500 truncate w-48">{brand.tagline || 'Identity defined'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px] uppercase">{brand.industry || 'General'}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-500 transition-all"
                            style={{ width: `${brand.healthScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-600">{brand.healthScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(brand.updatedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl border-gray-100 dark:border-gray-800 space-y-1">
                          <Link href={`/intelligence/brands/${brand.id}`}>
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <Edit className="w-4 h-4" /> Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => duplicateMutation.mutate(brand)}>
                            <Copy className="w-4 h-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600" onClick={() => setDeleteId(brand.id)}>
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-20 text-center dark:border-gray-800 bg-gray-50/30">
          <div className="p-6 bg-brand-50 rounded-full mb-6 ring-8 ring-brand-50/50">
            <Building2 className="w-12 h-12 text-brand-600 opacity-40" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No results found' : 'No Brands Found'}
          </h2>
          <p className="text-gray-500 max-w-sm mb-8 text-lg">
            {searchQuery ? `We couldn't find any brands matching "${searchQuery}". Try a different term.` : 'Start by creating your first brand identity. You can use our AI analyser to extract it automatically.'}
          </p>
          <div className="flex gap-4">
            {searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery('')}>Clear search</Button>
            ) : (
              <>
                <Link href="/intelligence/brands/analyse">
                  <Button className="gap-2 bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-200 h-12 px-6 font-bold">
                    <Sparkles className="w-5 h-5" />
                    Analyse with AI
                  </Button>
                </Link>
                <Link href="/intelligence/brands/new">
                  <Button variant="outline" className="h-12 px-6 font-bold">Manual Create</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Brand
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this brand? This will move it to the trash.
              <span className="block mt-2 font-semibold text-gray-900 dark:text-gray-100">"This action can be undone from the trash later."</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white gap-2" 
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
