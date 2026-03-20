import { useState } from 'react';
import { useAdminUsers } from '@/hooks/useAdminData';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function AdminUsersTab() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading, error } = useAdminUsers(page, search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  if (error) {
    return (
      <div className="text-center py-20 text-red-400 text-sm">
        Failed to load users: {(error as Error).message}
      </div>
    );
  }

  const perPage = 20;
  const totalPages = data ? Math.ceil(data.total / perPage) : 0;

  return (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-white/20"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-foreground/60 hover:text-foreground hover:bg-white/[0.08] transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.08] hover:bg-transparent">
                <TableHead className="text-foreground/40">Email</TableHead>
                <TableHead className="text-foreground/40">Signed Up</TableHead>
                <TableHead className="text-foreground/40">Last Sign In</TableHead>
                <TableHead className="text-foreground/40 text-right">Tours</TableHead>
                <TableHead className="text-foreground/40 text-right">Places</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.users || []).map((user) => (
                <TableRow key={user.id} className="border-white/[0.08]">
                  <TableCell className="text-foreground/80 font-medium font-mono text-xs">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-foreground/50 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-foreground/50 text-sm">
                    {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-foreground/60 tabular-nums text-right">
                    {user.tourCount}
                  </TableCell>
                  <TableCell className="text-foreground/60 tabular-nums text-right">
                    {user.placeCount}
                  </TableCell>
                </TableRow>
              ))}
              {data?.users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-foreground/30 py-8">
                    {search ? 'No users match that search' : 'No users yet'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground/40">
            {data?.total ?? 0} users total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-foreground/50 disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-foreground/50 tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-foreground/50 disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
