import { supabase } from '@/integrations/supabase/client';
import { pipeline } from '@huggingface/transformers';

interface AnalysisResult {
  score: number;
  confidence: number;
  classification: 'reliable' | 'questionable' | 'unreliable';
  details: {
    sentiment: string;
    keyIndicators: string[];
    suggestions: string[];
  };
  aiAnalysis?: {
    summary: string;
    keyFindings: string[];
    redFlags: string[];
    verifiedFacts: string[];
  };
  sources?: {
    supportingArticles: Array<{
      title: string;
      url: string;
      source: string;
      relevance: number;
      publishedAt: string;
    }>;
    factCheckArticles: Array<{
      title: string;
      url: string;
      organization: string;
      rating: string;
      summary: string;
    }>;
  };
  realTimeData?: {
    trendingTopics: string[];
    newsVolume: number;
    sourceCredibilityMap: Record<string, number>;
  };
}

export class FakeNewsDetector {
  private static classifier: any = null;

  static async analyzeText(text: string, url?: string): Promise<AnalysisResult> {
    try {
      if (!text || text.trim().length < 10) {
        throw new Error('Text too short for meaningful analysis');
      }

      console.log('Starting free AI analysis using Hugging Face...');

      // Use browser-based AI for free analysis
      const aiResult = await this.analyzeWithHuggingFace(text);
      
      return {
        score: aiResult.score,
        confidence: aiResult.confidence,
        classification: aiResult.classification,
        details: {
          sentiment: aiResult.sentiment,
          keyIndicators: aiResult.keyIndicators,
          suggestions: aiResult.suggestions
        },
        aiAnalysis: {
          summary: aiResult.summary,
          keyFindings: aiResult.keyFindings,
          redFlags: aiResult.redFlags,
          verifiedFacts: aiResult.verifiedFacts
        }
      };
    } catch (error) {
      console.error('Error in AI analysis:', error);
      // Fallback to basic analysis
      return this.fallbackAnalysis(text);
    }
  }

  private static async analyzeWithHuggingFace(text: string): Promise<any> {
    try {
      // Initialize classifier if not already done
      if (!this.classifier) {
        console.log('Loading Hugging Face model...');
        this.classifier = await pipeline('text-classification', 'martin-ha/toxic-comment-model', {
          device: 'webgpu'
        });
      }

      // Analyze text toxicity/credibility
      const result = await this.classifier(text.substring(0, 512)); // Limit text length
      
      // Convert toxicity score to credibility score (inverse relationship)
      const toxicityScore = result[0].label === 'TOXIC' ? result[0].score : 1 - result[0].score;
      const credibilityScore = 1 - toxicityScore;
      
      // Basic content analysis
      const characteristics = this.analyzeTextCharacteristics(text);
      const basicScore = this.basicCredibilityScore(text, characteristics);
      
      // Combine AI and basic analysis
      const finalScore = (credibilityScore * 0.6) + (basicScore * 0.4);
      
      let classification: 'reliable' | 'questionable' | 'unreliable';
      if (finalScore >= 0.75) classification = 'reliable';
      else if (finalScore >= 0.45) classification = 'questionable';
      else classification = 'unreliable';

      const keyFindings = [];
      const redFlags = [];
      
      if (characteristics.hasEmotionalWords) {
        redFlags.push('Contains emotional language');
      }
      if (characteristics.hasClickbait) {
        redFlags.push('Uses clickbait-style phrases');
      }
      if (characteristics.hasNumbers) {
        keyFindings.push('Includes statistical information');
      }
      if (characteristics.hasQuotes) {
        keyFindings.push('Contains quoted sources');
      }

      return {
        score: finalScore,
        confidence: 0.75,
        classification,
        sentiment: result[0].label === 'TOXIC' ? 'Potentially biased' : 'Neutral',
        keyIndicators: [
          ...keyFindings.map(finding => `✓ ${finding}`),
          ...redFlags.map(flag => `⚠️ ${flag}`)
        ],
        suggestions: this.getFreeSuggestions(classification),
        summary: `AI analysis using open-source model. Credibility: ${Math.round(finalScore * 100)}%`,
        keyFindings,
        redFlags,
        verifiedFacts: keyFindings
      };
    } catch (error) {
      console.error('Hugging Face analysis failed:', error);
      // Fallback to basic analysis
      const characteristics = this.analyzeTextCharacteristics(text);
      const score = this.basicCredibilityScore(text, characteristics);
      
      let classification: 'reliable' | 'questionable' | 'unreliable';
      if (score >= 0.75) classification = 'reliable';
      else if (score >= 0.45) classification = 'questionable';
      else classification = 'unreliable';

      return {
        score,
        confidence: 0.6,
        classification,
        sentiment: 'Basic Analysis',
        keyIndicators: this.getBasicIndicators(characteristics),
        suggestions: this.getFreeSuggestions(classification),
        summary: 'Basic content analysis (AI model unavailable)',
        keyFindings: ['Basic text analysis completed'],
        redFlags: characteristics.hasClickbait ? ['Potential clickbait detected'] : [],
        verifiedFacts: []
      };
    }
  }

  private static async fallbackAnalysis(text: string): Promise<AnalysisResult> {
    console.log('Using fallback analysis...');
    
    // Basic text analysis as fallback
    const characteristics = this.analyzeTextCharacteristics(text);
    const score = this.basicCredibilityScore(text, characteristics);
    
    let classification: 'reliable' | 'questionable' | 'unreliable';
    if (score >= 0.75) classification = 'reliable';
    else if (score >= 0.45) classification = 'questionable';
    else classification = 'unreliable';

    return {
      score,
      confidence: 0.6,
      classification,
      details: {
        sentiment: 'Basic Analysis',
        keyIndicators: this.getBasicIndicators(characteristics),
        suggestions: this.getBasicSuggestions(classification)
      }
    };
  }

  private static generateSuggestions(data: any): string[] {
    const suggestions = [];
    
    if (data.classification === 'unreliable') {
      suggestions.push('🔍 Cross-reference with multiple trusted news sources');
      suggestions.push('📋 Verify claims through fact-checking organizations');
      suggestions.push('🔗 Check original sources and citations');
    } else if (data.classification === 'questionable') {
      suggestions.push('✅ Verify with additional reliable sources');
      suggestions.push('📊 Look for supporting statistical evidence');
      suggestions.push('🏛️ Consider the source\'s reputation and potential bias');
    } else {
      suggestions.push('✓ Content shows strong credibility indicators');
      suggestions.push('📰 Cross-reference with other reputable sources for completeness');
    }

    // Add specific suggestions based on available data
    if (data.sources?.supportingArticles?.length > 0) {
      suggestions.push(`📰 Found ${data.sources.supportingArticles.length} related news articles for verification`);
    }
    
    if (data.sources?.factCheckArticles?.length > 0) {
      suggestions.push(`🔍 ${data.sources.factCheckArticles.length} fact-check articles available for review`);
    }

    return suggestions;
  }

  private static analyzeTextCharacteristics(text: string) {
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    return {
      hasEmotionalWords: this.hasEmotionalLanguage(text),
      hasClickbait: this.hasClickbaitPhrases(text),
      hasCapitalization: /[A-Z]{3,}/.test(text),
      hasBiasedLanguage: this.hasBiasedLanguage(text),
      wordCount: words.length,
      avgSentenceLength: words.length / sentences.length,
      hasNumbers: /\d+/.test(text),
      hasQuotes: /["']/.test(text),
      hasUrls: /https?:\/\//.test(text)
    };
  }

  private static basicCredibilityScore(text: string, characteristics: any): number {
    let score = 0.6;
    
    if (characteristics.hasNumbers) score += 0.1;
    if (characteristics.hasQuotes) score += 0.1;
    if (characteristics.wordCount > 100) score += 0.05;
    if (!characteristics.hasEmotionalWords) score += 0.1;
    if (!characteristics.hasClickbait) score += 0.15;
    if (characteristics.hasEmotionalWords) score -= 0.1;
    if (characteristics.hasClickbait) score -= 0.2;
    if (characteristics.hasBiasedLanguage) score -= 0.05;
    
    return Math.max(0.1, Math.min(1, score));
  }

  private static getBasicIndicators(characteristics: any): string[] {
    const indicators = [];
    if (characteristics.hasEmotionalWords) indicators.push('Contains emotional language');
    if (characteristics.hasClickbait) indicators.push('Uses clickbait-style phrases');
    if (characteristics.hasNumbers) indicators.push('Includes statistical information');
    if (characteristics.hasQuotes) indicators.push('Contains quoted sources');
    return indicators.length > 0 ? indicators : ['Basic content analysis completed'];
  }

  private static getBasicSuggestions(classification: string): string[] {
    if (classification === 'unreliable') {
      return ['Cross-reference with trusted sources', 'Verify with fact-checkers'];
    } else if (classification === 'questionable') {
      return ['Seek additional verification', 'Check source credibility'];
    }
    return ['Content appears credible', 'Always verify with multiple sources'];
  }

  private static getFreeSuggestions(classification: string): string[] {
    const baseSuggestions = this.getBasicSuggestions(classification);
    return [
      ...baseSuggestions,
      '🤖 Analysis powered by free open-source AI models',
      '💡 For enhanced accuracy, consider using premium fact-checking services'
    ];
  }

  private static hasEmotionalLanguage(text: string): boolean {
    const emotionalWords = [
      'shocking', 'unbelievable', 'amazing', 'terrible', 'awful', 'incredible',
      'devastating', 'outrageous', 'scandal', 'explosive'
    ];
    // Removed 'breaking' and 'urgent' as these are legitimate news terms
    const emotionalCount = emotionalWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    return emotionalCount >= 2; // Require multiple emotional words
  }

  private static hasClickbaitPhrases(text: string): boolean {
    const clickbaitPhrases = [
      'you won\'t believe', 'this will shock you', 'doctors hate', 'one simple trick',
      'what happens next', 'the truth they don\'t want', 'secret that', 'they don\'t want you to know'
    ];
    return clickbaitPhrases.some(phrase => text.toLowerCase().includes(phrase));
  }

  private static hasBiasedLanguage(text: string): boolean {
    const biasedWords = [
      'always', 'never', 'all', 'everyone', 'nobody', 'everything', 'nothing',
      'totally', 'completely', 'absolutely', 'definitely', 'certainly'
    ];
    const biasedCount = biasedWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    return biasedCount > 2;
  }

  // Keep the utility methods for fallback analysis

  static async extractFromUrl(url: string): Promise<string> {
    // Simple URL content extraction (in a real app, you'd use a proper scraping service)
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Basic text extraction from HTML (this is simplified)
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (textContent.length < 100) {
        throw new Error('Unable to extract sufficient content from URL');
      }

      return textContent.substring(0, 2000); // Limit content length
    } catch (error) {
      throw new Error('Failed to fetch content from URL. CORS policy may be blocking the request.');
    }
  }
}