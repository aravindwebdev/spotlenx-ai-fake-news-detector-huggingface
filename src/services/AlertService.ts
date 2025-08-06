import { supabase } from '@/integrations/supabase/client';

export interface AlertRule {
  id: string;
  keywords: string[];
  alert_type: string;
  is_active: boolean;
  user_id: string;
}

export class AlertService {
  static async checkAlerts(content: string, analysisResult: any, url?: string, analysisId?: string): Promise<void> {
    try {
      // Get all active alert rules for all users
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching alerts:', error);
        return;
      }

      if (!alerts || alerts.length === 0) return;

      // Check each alert rule
      for (const alert of alerts) {
        const shouldTrigger = this.shouldTriggerAlert(content, analysisResult, alert);
        
        if (shouldTrigger) {
          await this.triggerAlert(alert, content, analysisResult, url, analysisId);
        }
      }
    } catch (error) {
      console.error('Failed to check alerts:', error);
    }
  }

  private static shouldTriggerAlert(content: string, analysisResult: any, alert: AlertRule): boolean {
    // Check if content contains any of the keywords
    const contentLower = content.toLowerCase();
    const hasKeyword = alert.keywords.some(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );

    if (!hasKeyword) return false;

    // Check alert type filter
    switch (alert.alert_type) {
      case 'misinformation':
        return analysisResult.classification === 'unreliable';
      case 'bias':
        // This would need more sophisticated bias detection
        return analysisResult.details?.sentiment === 'NEGATIVE' || 
               analysisResult.classification === 'questionable';
      case 'source_reliability':
        return analysisResult.classification === 'unreliable' || 
               analysisResult.classification === 'questionable';
      case 'all':
      default:
        return true; // Trigger for any analysis containing the keywords
    }
  }

  private static async triggerAlert(alert: AlertRule, content: string, analysisResult: any, url?: string, analysisId?: string): Promise<void> {
    try {
      // Get the matched keywords
      const contentLower = content.toLowerCase();
      const matchedKeywords = alert.keywords.filter(keyword => 
        contentLower.includes(keyword.toLowerCase())
      );

      // Store triggered alert in database
      const { error } = await supabase
        .from('triggered_alerts')
        .insert([{
          user_id: alert.user_id,
          alert_id: alert.id,
          analysis_id: analysisId || 'unknown',
          content_excerpt: content.substring(0, 300),
          matched_keywords: matchedKeywords,
          is_read: false
        }]);

      if (error) {
        console.error('Error storing triggered alert:', error);
      }
      
    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }


  static async getActiveAlertsForUser(userId: string): Promise<AlertRule[]> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user alerts:', error);
      return [];
    }
  }
}