import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, DollarSign, Users, Map, Library, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab';
import { AdminApiCostsTab } from '@/components/admin/AdminApiCostsTab';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminToursTab } from '@/components/admin/AdminToursTab';
import { AdminContentTab } from '@/components/admin/AdminContentTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'api-costs', label: 'API & Costs', icon: DollarSign },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tours', label: 'Tours', icon: Map },
  { id: 'content', label: 'Content', icon: Library },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="font-semibold text-sm text-foreground">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-foreground/40 font-mono">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        {/* Tab Bar */}
        <div className="flex gap-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-[11px] uppercase tracking-[0.1em] font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-foreground border-b-2 border-foreground'
                    : 'text-[#888] border-b-2 border-transparent hover:text-foreground/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div key={activeTab} className="pt-8 pb-16 animate-fade-in">
          {activeTab === 'overview' && <AdminOverviewTab />}
          {activeTab === 'api-costs' && <AdminApiCostsTab />}
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'tours' && <AdminToursTab />}
          {activeTab === 'content' && <AdminContentTab />}
        </div>
      </div>
    </div>
  );
}
