import { supabase } from "@/integrations/supabase/client";

interface PublisherAnalysis {
  domain: string;
  publisher: string;
  foundingYear?: number;
  headquarters?: string;
  credibilityScore: number;
  bias: string;
  factualReporting: string;
  reputationScore: number;
  lastUpdated: string;
  mediaBiasFactCheckRating?: string;
  adFontesBias?: number;
  allSidesRating?: string;
  publicationFrequency?: 'daily' | 'weekly' | 'monthly' | 'irregular';
  primaryTopics?: string[];
}

interface FactCheckResult {
  claim: string;
  rating: string;
  source: string;
  url: string;
  date: string;
}

interface CrossReference {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  relevanceScore: number;
}

interface EnhancedVerificationResult {
  publisherAnalysis: PublisherAnalysis;
  factChecks: FactCheckResult[];
  crossReferences: CrossReference[];
  overallCredibilityScore: number;
  confidence: number;
  warnings: string[];
  recommendations: string[];
}

export class EnhancedSourceVerificationService {
  private static readonly KNOWN_PUBLISHERS: Record<string, Partial<PublisherAnalysis>> = {
    'reuters.com': {
      publisher: 'Reuters',
      foundingYear: 1851,
      headquarters: 'London, UK',
      credibilityScore: 92,
      bias: 'Center',
      factualReporting: 'Very High',
      reputationScore: 95,
      mediaBiasFactCheckRating: 'Least Biased',
      primaryTopics: ['Breaking News', 'Business', 'World News']
    },
    'ap.org': {
      publisher: 'Associated Press',
      foundingYear: 1846,
      headquarters: 'New York, USA',
      credibilityScore: 90,
      bias: 'Center',
      factualReporting: 'Very High',
      reputationScore: 94,
      mediaBiasFactCheckRating: 'Least Biased',
      primaryTopics: ['Breaking News', 'Politics', 'Sports']
    },
    'bbc.com': {
      publisher: 'BBC News',
      foundingYear: 1922,
      headquarters: 'London, UK',
      credibilityScore: 85,
      bias: 'Center',
      factualReporting: 'High',
      reputationScore: 88,
      mediaBiasFactCheckRating: 'Least Biased',
      primaryTopics: ['World News', 'UK News', 'Technology']
    },
    'nytimes.com': {
      publisher: 'The New York Times',
      foundingYear: 1851,
      headquarters: 'New York, USA',
      credibilityScore: 82,
      bias: 'Lean Left',
      factualReporting: 'High',
      reputationScore: 85,
      mediaBiasFactCheckRating: 'Left-Center',
      primaryTopics: ['Politics', 'Business', 'Culture']
    },
    'washingtonpost.com': {
      publisher: 'The Washington Post',
      foundingYear: 1877,
      headquarters: 'Washington D.C., USA',
      credibilityScore: 80,
      bias: 'Lean Left',
      factualReporting: 'High',
      reputationScore: 83,
      mediaBiasFactCheckRating: 'Left-Center',
      primaryTopics: ['Politics', 'National News', 'Investigations']
    },
    'wsj.com': {
      publisher: 'The Wall Street Journal',
      foundingYear: 1889,
      headquarters: 'New York, USA',
      credibilityScore: 83,
      bias: 'Lean Right',
      factualReporting: 'High',
      reputationScore: 86,
      mediaBiasFactCheckRating: 'Right-Center',
      primaryTopics: ['Business', 'Finance', 'Economics']
    },
    'cnn.com': {
      publisher: 'CNN',
      foundingYear: 1980,
      headquarters: 'Atlanta, USA',
      credibilityScore: 72,
      bias: 'Lean Left',
      factualReporting: 'Mixed',
      reputationScore: 70,
      mediaBiasFactCheckRating: 'Left-Center',
      primaryTopics: ['Breaking News', 'Politics', 'International']
    },
    'foxnews.com': {
      publisher: 'Fox News',
      foundingYear: 1996,
      headquarters: 'New York, USA',
      credibilityScore: 65,
      bias: 'Lean Right',
      factualReporting: 'Mixed',
      reputationScore: 68,
      mediaBiasFactCheckRating: 'Right',
      primaryTopics: ['Politics', 'Opinion', 'Breaking News']
    }
  };

  static async performEnhancedVerification(url: string, content?: string): Promise<EnhancedVerificationResult> {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      
      // Get publisher analysis
      const publisherAnalysis = this.getPublisherAnalysis(domain);
      
      // Get fact-checks and cross-references via edge function
      const { factChecks, crossReferences } = await this.getExternalVerification(content || '', url);
      
      // Calculate overall credibility
      const overallCredibility = this.calculateOverallCredibility(publisherAnalysis, factChecks, crossReferences);
      
      // Generate warnings and recommendations
      const { warnings, recommendations } = this.generateInsights(publisherAnalysis, factChecks, overallCredibility);
      
      return {
        publisherAnalysis,
        factChecks,
        crossReferences,
        overallCredibilityScore: overallCredibility.score,
        confidence: overallCredibility.confidence,
        warnings,
        recommendations
      };
    } catch (error) {
      console.error('Enhanced verification failed:', error);
      throw new Error('Verification service unavailable');
    }
  }

  private static getPublisherAnalysis(domain: string): PublisherAnalysis {
    const knownData = this.KNOWN_PUBLISHERS[domain];
    
    return {
      domain,
      publisher: knownData?.publisher || this.generatePublisherName(domain),
      foundingYear: knownData?.foundingYear,
      headquarters: knownData?.headquarters,
      credibilityScore: knownData?.credibilityScore || this.estimateCredibilityScore(domain),
      bias: knownData?.bias || this.estimateBias(domain),
      factualReporting: knownData?.factualReporting || this.estimateFactualReporting(domain),
      reputationScore: knownData?.reputationScore || this.estimateReputationScore(domain),
      lastUpdated: new Date().toISOString(),
      mediaBiasFactCheckRating: knownData?.mediaBiasFactCheckRating,
      primaryTopics: knownData?.primaryTopics || ['General News']
    };
  }

  private static async getExternalVerification(content: string, url: string) {
    try {
      const { data, error } = await supabase.functions.invoke('fact-check-api', {
        body: { query: content.substring(0, 500), url }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        return { factChecks: [], crossReferences: [] };
      }
      
      return {
        factChecks: this.processFactChecks(data.factChecks || []),
        crossReferences: this.processCrossReferences(data.newsReferences || [])
      };
    } catch (error) {
      console.error('External verification failed:', error);
      return { factChecks: [], crossReferences: [] };
    }
  }

  private static processFactChecks(rawFactChecks: any[]): FactCheckResult[] {
    return rawFactChecks.slice(0, 5).map(item => ({
      claim: item.text || item.claimant || 'Related claim',
      rating: item.claimReview?.[0]?.textualRating || 'Under review',
      source: item.claimReview?.[0]?.publisher?.name || 'Fact checker',
      url: item.claimReview?.[0]?.url || '#',
      date: item.claimReview?.[0]?.reviewDate || new Date().toISOString()
    }));
  }

  private static processCrossReferences(articles: any[]): CrossReference[] {
    return articles.slice(0, 5).map(article => ({
      title: article.title || 'Related article',
      source: new URL(article.url).hostname,
      url: article.url,
      publishedAt: article.publishedAt || new Date().toISOString(),
      relevanceScore: Math.random() * 0.4 + 0.6 // Mock relevance score
    }));
  }

  private static calculateOverallCredibility(
    publisher: PublisherAnalysis, 
    factChecks: FactCheckResult[], 
    crossReferences: CrossReference[]
  ) {
    let score = publisher.credibilityScore;
    let confidence = 0.7;
    
    // Adjust based on fact-checks
    if (factChecks.length > 0) {
      const positiveChecks = factChecks.filter(fc => 
        fc.rating.toLowerCase().includes('true') || 
        fc.rating.toLowerCase().includes('correct') ||
        fc.rating.toLowerCase().includes('accurate')
      ).length;
      
      const negativeChecks = factChecks.filter(fc => 
        fc.rating.toLowerCase().includes('false') || 
        fc.rating.toLowerCase().includes('misleading') ||
        fc.rating.toLowerCase().includes('inaccurate')
      ).length;
      
      score += (positiveChecks * 5) - (negativeChecks * 10);
      confidence += 0.2;
    }
    
    // Adjust based on cross-references
    if (crossReferences.length > 0) {
      const reputableSources = crossReferences.filter(ref => {
        const domain = ref.source;
        return ['reuters.com', 'ap.org', 'bbc.com', 'npr.org'].includes(domain);
      }).length;
      
      score += reputableSources * 3;
      confidence += crossReferences.length * 0.05;
    }
    
    return {
      score: Math.min(100, Math.max(0, score)),
      confidence: Math.min(1, confidence)
    };
  }

  private static generateInsights(
    publisher: PublisherAnalysis, 
    factChecks: FactCheckResult[], 
    credibility: { score: number }
  ) {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Publisher-based warnings
    if (publisher.credibilityScore < 70) {
      warnings.push(`Source has lower credibility score (${publisher.credibilityScore}/100)`);
    }
    
    if (publisher.bias !== 'Center') {
      warnings.push(`Source shows ${publisher.bias.toLowerCase()} bias`);
    }
    
    if (publisher.factualReporting === 'Mixed' || publisher.factualReporting === 'Low') {
      warnings.push('Source has mixed or low factual reporting standards');
    }
    
    // Fact-check warnings
    const negativeFacts = factChecks.filter(fc => 
      fc.rating.toLowerCase().includes('false') || 
      fc.rating.toLowerCase().includes('misleading')
    );
    
    if (negativeFacts.length > 0) {
      warnings.push(`${negativeFacts.length} related claims have been fact-checked as false or misleading`);
    }
    
    // Recommendations
    if (credibility.score < 80) {
      recommendations.push('Verify information with additional trusted sources');
      recommendations.push('Look for official statements or documents');
    }
    
    if (factChecks.length === 0) {
      recommendations.push('Search for fact-checks on major fact-checking websites');
    }
    
    recommendations.push('Check the article publication date for timeliness');
    recommendations.push('Review the author\'s credentials and expertise');
    
    return { warnings, recommendations };
  }

  // Helper methods for unknown publishers
  private static generatePublisherName(domain: string): string {
    return domain.split('.')[0].toUpperCase().replace(/[-_]/g, ' ');
  }

  private static estimateCredibilityScore(domain: string): number {
    // Simple heuristic based on domain characteristics
    if (domain.endsWith('.gov') || domain.endsWith('.edu')) return 85;
    if (domain.endsWith('.org')) return 75;
    if (domain.includes('news') || domain.includes('media')) return 65;
    return 55;
  }

  private static estimateBias(domain: string): string {
    // Very basic estimation - in reality would use a proper bias database
    return 'Mixed';
  }

  private static estimateFactualReporting(domain: string): string {
    if (domain.endsWith('.gov') || domain.endsWith('.edu')) return 'High';
    return 'Mixed';
  }

  private static estimateReputationScore(domain: string): number {
    return this.estimateCredibilityScore(domain) - 5;
  }
}