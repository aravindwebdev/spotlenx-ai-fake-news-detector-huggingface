interface SourceInfo {
  domain: string;
  publisher: string;
  credibilityScore: number;
  bias: string;
  factualReporting: string;
  description: string;
}

interface APIResponse {
  source: SourceInfo;
  confidence: number;
  lastUpdated: string;
}

export class SourceVerificationService {
  private static apiKey = 'sample_api_key_for_testing'; // TODO: Replace with real API key
  
  static async verifySource(url: string): Promise<APIResponse | null> {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      
      // For testing, return mock data
      const mockResponse: APIResponse = {
        source: {
          domain,
          publisher: this.getPublisherName(domain),
          credibilityScore: this.getMockCredibilityScore(domain),
          bias: this.getMockBias(domain),
          factualReporting: this.getMockFactualReporting(domain),
          description: `${this.getPublisherName(domain)} is a ${this.getMockBias(domain).toLowerCase()} publication known for ${this.getMockFactualReporting(domain).toLowerCase()} reporting.`
        },
        confidence: Math.random() * 0.3 + 0.7, // 70-100%
        lastUpdated: new Date().toISOString()
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return mockResponse;
    } catch (error) {
      console.error('Source verification failed:', error);
      return null;
    }
  }
  
  private static getPublisherName(domain: string): string {
    const publishers: Record<string, string> = {
      'bbc.com': 'BBC News',
      'cnn.com': 'CNN',
      'reuters.com': 'Reuters',
      'ap.org': 'Associated Press',
      'npr.org': 'NPR',
      'nytimes.com': 'The New York Times',
      'washingtonpost.com': 'The Washington Post',
      'theguardian.com': 'The Guardian',
      'wsj.com': 'The Wall Street Journal',
      'foxnews.com': 'Fox News'
    };
    
    return publishers[domain] || domain.split('.')[0].toUpperCase();
  }
  
  private static getMockCredibilityScore(domain: string): number {
    const scores: Record<string, number> = {
      'bbc.com': 85,
      'reuters.com': 90,
      'ap.org': 88,
      'npr.org': 82,
      'nytimes.com': 80,
      'washingtonpost.com': 78,
      'theguardian.com': 75,
      'wsj.com': 83,
      'cnn.com': 70,
      'foxnews.com': 65
    };
    
    return scores[domain] || Math.floor(Math.random() * 40) + 40; // 40-80 for unknown sources
  }
  
  private static getMockBias(domain: string): string {
    const biases: Record<string, string> = {
      'bbc.com': 'Center',
      'reuters.com': 'Center',
      'ap.org': 'Center',
      'npr.org': 'Lean Left',
      'nytimes.com': 'Lean Left',
      'washingtonpost.com': 'Lean Left',
      'theguardian.com': 'Lean Left',
      'wsj.com': 'Lean Right',
      'cnn.com': 'Lean Left',
      'foxnews.com': 'Lean Right'
    };
    
    return biases[domain] || 'Mixed';
  }
  
  private static getMockFactualReporting(domain: string): string {
    const reporting: Record<string, string> = {
      'bbc.com': 'High',
      'reuters.com': 'Very High',
      'ap.org': 'Very High',
      'npr.org': 'High',
      'nytimes.com': 'High',
      'washingtonpost.com': 'High',
      'theguardian.com': 'High',
      'wsj.com': 'High',
      'cnn.com': 'Mixed',
      'foxnews.com': 'Mixed'
    };
    
    return reporting[domain] || 'Mixed';
  }
}