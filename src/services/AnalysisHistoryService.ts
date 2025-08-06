import { supabase } from "@/integrations/supabase/client";

export interface AnalysisHistoryRecord {
  id?: string;
  url?: string;
  content_excerpt: string;
  analysis_result: any;
  source_verification?: any;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export class AnalysisHistoryService {
  static async saveAnalysis(record: Omit<AnalysisHistoryRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .insert([record])
        .select('id')
        .single();
      
      if (error) {
        console.error('Error saving analysis:', error);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Failed to save analysis:', error);
      return null;
    }
  }
  
  static async getRecentAnalyses(limit: number = 10): Promise<AnalysisHistoryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching analyses:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
      return [];
    }
  }
  
  static async searchAnalyses(query: string): Promise<AnalysisHistoryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .or(`content_excerpt.ilike.%${query}%, url.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error searching analyses:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to search analyses:', error);
      return [];
    }
  }
}