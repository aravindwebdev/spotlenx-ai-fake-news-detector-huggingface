import { supabase } from '@/integrations/supabase/client';

export interface BookmarkData {
  id?: string;
  user_id: string;
  analysis_id: string;
  tags?: string[];
  notes?: string;
  created_at?: string;
}

export class BookmarkService {
  static async addBookmark(analysisId: string, tags: string[] = [], notes: string = ''): Promise<BookmarkData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          analysis_id: analysisId,
          tags,
          notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      return null;
    }
  }

  static async removeBookmark(analysisId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .match({ user_id: user.id, analysis_id: analysisId });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      return false;
    }
  }

  static async isBookmarked(analysisId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .match({ user_id: user.id, analysis_id: analysisId })
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Failed to check bookmark status:', error);
      return false;
    }
  }

  static async getUserBookmarks(): Promise<BookmarkData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          *,
          analysis_history!bookmarks_analysis_id_fkey (
            id,
            url,
            content_excerpt,
            analysis_result,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user bookmarks:', error);
      return [];
    }
  }
}