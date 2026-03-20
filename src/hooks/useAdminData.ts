import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

async function fetchAdminData<T = any>(section: string, params?: Record<string, any>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('admin-dashboard-data', {
    body: { section, ...params },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export interface OverviewData {
  totalUsers: number;
  totalTours: number;
  totalPlaces: number;
  toursThisWeek: number;
  toursPerDay: Array<{ date: string; count: number }>;
  contentSources: Array<{ source: string; count: number }>;
}

export function useAdminOverview() {
  return useQuery<OverviewData>({
    queryKey: ['admin', 'overview'],
    queryFn: () => fetchAdminData('overview'),
    staleTime: 2 * 60 * 1000,
  });
}

export interface ApiCostsData {
  estimatedTotalCost: number;
  estimatedMonthCost: number;
  ttsCost: number;
  llmCost: number;
  recentTours: Array<{
    id: string;
    title: string;
    placeCount: number;
    createdAt: string;
    estimatedCost: number;
  }>;
}

export function useAdminApiCosts() {
  return useQuery<ApiCostsData>({
    queryKey: ['admin', 'api-costs'],
    queryFn: () => fetchAdminData('api-costs'),
    staleTime: 5 * 60 * 1000,
  });
}

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  tourCount: number;
  placeCount: number;
}

export interface UsersData {
  users: AdminUser[];
  total: number;
}

export function useAdminUsers(page = 0, search = '') {
  return useQuery<UsersData>({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => fetchAdminData('users', { page, search }),
    staleTime: 2 * 60 * 1000,
  });
}

export interface AdminTour {
  id: string;
  title: string;
  creatorEmail: string;
  placeCount: number;
  createdAt: string;
  places: Array<{
    id: string;
    name: string;
    city: string;
    hasAudio: boolean;
    contentSource: string;
  }>;
}

export interface ToursData {
  tours: AdminTour[];
  total: number;
}

export function useAdminTours(page = 0, search = '') {
  return useQuery<ToursData>({
    queryKey: ['admin', 'tours', page, search],
    queryFn: () => fetchAdminData('tours', { page, search }),
    staleTime: 2 * 60 * 1000,
  });
}

export interface ContentData {
  cities: number;
  places: number;
  stories: number;
  avgStoriesPerPlace: number;
  webCacheEntries: number;
  webCacheOldest: string | null;
  webCacheNewest: string | null;
  cityBreakdown: Array<{
    city: string;
    places: number;
    stories: number;
  }>;
}

export function useAdminContent() {
  return useQuery<ContentData>({
    queryKey: ['admin', 'content'],
    queryFn: () => fetchAdminData('content'),
    staleTime: 5 * 60 * 1000,
  });
}
