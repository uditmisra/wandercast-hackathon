import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const LOCAL_STORAGE_KEY = 'whisper_preferences';

export interface UserPreferences {
  interests: string[];
  preferredTone: string;
  favoriteStoryTypes: string[];
}

const DEFAULT_PREFERENCES: UserPreferences = {
  interests: [],
  preferredTone: 'casual',
  favoriteStoryTypes: [],
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences from localStorage
  const loadLocalPreferences = useCallback((): UserPreferences => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading local preferences:', e);
    }
    return DEFAULT_PREFERENCES;
  }, []);

  // Save preferences to localStorage
  const saveLocalPreferences = useCallback((prefs: UserPreferences) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('Error saving local preferences:', e);
    }
  }, []);

  // Load preferences from Supabase
  const loadSupabasePreferences = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return null;
      }

      if (data) {
        return {
          interests: (data.interests as string[]) || [],
          preferredTone: (data as any).preferred_tone || DEFAULT_PREFERENCES.preferredTone,
          favoriteStoryTypes: ((data as any).favorite_story_types as string[]) || [],
        };
      }
    } catch (e) {
      console.error('Error loading Supabase preferences:', e);
    }
    return null;
  }, [user]);

  // Save preferences to Supabase
  const saveSupabasePreferences = useCallback(async (prefs: UserPreferences) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          interests: prefs.interests,
          preferred_tone: prefs.preferredTone,
          favorite_story_types: prefs.favoriteStoryTypes,
          updated_at: new Date().toISOString(),
        } as any, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving preferences:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error saving Supabase preferences:', e);
      return false;
    }
  }, [user]);

  // Load preferences on mount and when user changes
  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);

      if (user) {
        // Try to load from Supabase first
        const supabasePrefs = await loadSupabasePreferences();

        if (supabasePrefs) {
          setPreferences(supabasePrefs);
          // Also update localStorage as backup
          saveLocalPreferences(supabasePrefs);
        } else {
          // No Supabase prefs - check if we have local prefs to sync
          const localPrefs = loadLocalPreferences();
          if (localPrefs.interests.length > 0) {
            // Sync local prefs to Supabase
            await saveSupabasePreferences(localPrefs);
            setPreferences(localPrefs);
          } else {
            setPreferences(DEFAULT_PREFERENCES);
          }
        }
      } else {
        // Not logged in - use localStorage
        setPreferences(loadLocalPreferences());
      }

      setLoading(false);
    };

    loadPreferences();
  }, [user, loadSupabasePreferences, loadLocalPreferences, saveLocalPreferences, saveSupabasePreferences]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    setSaving(true);
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);

    // Always save to localStorage
    saveLocalPreferences(newPrefs);

    // If logged in, also save to Supabase
    if (user) {
      await saveSupabasePreferences(newPrefs);
    }

    setSaving(false);
  }, [preferences, user, saveLocalPreferences, saveSupabasePreferences]);

  // Check if user has set any preferences
  const hasPreferences = preferences.interests.length > 0;

  return {
    preferences,
    updatePreferences,
    loading,
    saving,
    hasPreferences,
  };
}
