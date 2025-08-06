import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FactCheckResult {
  credibilityScore: number;
  classification: 'reliable' | 'questionable' | 'unreliable';
  confidence: number;
  aiAnalysis: {
    summary: string;
    keyFindings: string[];
    redFlags: string[];
    verifiedFacts: string[];
  };
  sources: {
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
  realTimeData: {
    trendingTopics: string[];
    newsVolume: number;
    sourceCredibilityMap: Record<string, number>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { content, url } = await req.json()
    
    if (!content || content.trim().length < 10) {
      throw new Error('Content too short for meaningful analysis')
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Step 1: AI-powered content analysis
    const aiAnalysisPrompt = `
Analyze the following content for factual accuracy, credibility, and potential misinformation. Provide:
1. A credibility assessment (0-100 scale)
2. Key claims that need verification
3. Red flags or warning signs
4. Verified factual elements
5. Overall summary of reliability

Content to analyze:
"${content}"

Respond in JSON format with this structure:
{
  "credibilityScore": number,
  "keyFindings": string[],
  "redFlags": string[],
  "verifiedFacts": string[],
  "summary": string,
  "keywordExtraction": string[]
}
`

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert fact-checker and misinformation analyst. Analyze content objectively and provide detailed assessments.'
          },
          {
            role: 'user',
            content: aiAnalysisPrompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('OpenAI API error:', aiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${aiResponse.status} - ${errorText}`)
    }

    const aiData = await aiResponse.json()
    console.log('OpenAI response:', aiData)
    const aiAnalysis = JSON.parse(aiData.choices[0].message.content)

    // Step 2: Real-time news verification
    const keywords = aiAnalysis.keywordExtraction || extractKeywords(content)
    const newsResults = await searchRealtimeNews(keywords.slice(0, 3))
    
    // Step 3: Fact-checking database lookup
    const factCheckResults = await searchFactCheckOrganizations(keywords)

    // Step 4: Source credibility analysis
    const sourceCredibility = url ? await analyzeSourceCredibility(url) : {}

    // Step 5: Calculate final credibility score
    const finalScore = calculateFinalCredibilityScore(
      aiAnalysis.credibilityScore,
      newsResults,
      factCheckResults,
      sourceCredibility
    )

    const classification = getClassification(finalScore)
    const confidence = calculateConfidence(aiAnalysis, newsResults, factCheckResults)

    const result: FactCheckResult = {
      credibilityScore: finalScore,
      classification,
      confidence,
      aiAnalysis: {
        summary: aiAnalysis.summary,
        keyFindings: aiAnalysis.keyFindings || [],
        redFlags: aiAnalysis.redFlags || [],
        verifiedFacts: aiAnalysis.verifiedFacts || []
      },
      sources: {
        supportingArticles: newsResults.articles || [],
        factCheckArticles: factCheckResults || []
      },
      realTimeData: {
        trendingTopics: keywords,
        newsVolume: newsResults.totalResults || 0,
        sourceCredibilityMap: sourceCredibility
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('AI Fact Checker Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function extractKeywords(content: string): string[] {
  // Simple keyword extraction - in production, use more sophisticated NLP
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
  
  const stopWords = ['that', 'with', 'have', 'this', 'will', 'they', 'from', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'about', 'there', 'could', 'other', 'after', 'first', 'well', 'just', 'also', 'when', 'where', 'what', 'more', 'some', 'very', 'into', 'such', 'even', 'most', 'made', 'only', 'over', 'like', 'before', 'through', 'these', 'should', 'being', 'many', 'much', 'than', 'were', 'them']
  
  const filteredWords = words.filter(word => !stopWords.includes(word))
  
  // Get word frequency
  const wordCount = {}
  filteredWords.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
}

async function searchRealtimeNews(keywords: string[]) {
  // Use NewsAPI for real-time news verification
  const newsApiKey = Deno.env.get('NEWS_API_KEY')
  if (!newsApiKey || keywords.length === 0) {
    return { articles: [], totalResults: 0 }
  }

  try {
    const query = keywords.join(' OR ')
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=10&language=en&apiKey=${newsApiKey}`
    )
    
    if (!response.ok) {
      console.error('NewsAPI error:', response.status)
      return { articles: [], totalResults: 0 }
    }

    const data = await response.json()
    
    const processedArticles = (data.articles || []).map(article => ({
      title: article.title,
      url: article.url,
      source: article.source?.name || 'Unknown',
      relevance: calculateRelevanceScore(article, keywords),
      publishedAt: article.publishedAt
    }))

    return {
      articles: processedArticles.sort((a, b) => b.relevance - a.relevance),
      totalResults: data.totalResults || 0
    }
  } catch (error) {
    console.error('News search error:', error)
    return { articles: [], totalResults: 0 }
  }
}

async function searchFactCheckOrganizations(keywords: string[]) {
  // Use Google Fact Check Tools API
  const factCheckApiKey = Deno.env.get('GOOGLE_FACT_CHECK_API_KEY')
  if (!factCheckApiKey || keywords.length === 0) {
    return []
  }

  try {
    const query = keywords.join(' ')
    const response = await fetch(
      `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(query)}&key=${factCheckApiKey}`
    )
    
    if (!response.ok) {
      console.error('Fact Check API error:', response.status)
      return []
    }

    const data = await response.json()
    
    return (data.claims || []).map(claim => ({
      title: claim.text || 'Fact Check',
      url: claim.claimReview?.[0]?.url || '',
      organization: claim.claimReview?.[0]?.publisher?.name || 'Unknown',
      rating: claim.claimReview?.[0]?.textualRating || 'Unknown',
      summary: claim.claimReview?.[0]?.title || ''
    }))
  } catch (error) {
    console.error('Fact check search error:', error)
    return []
  }
}

async function analyzeSourceCredibility(url: string) {
  try {
    const domain = new URL(url).hostname
    
    // Predefined credibility scores for known sources
    const knownSources = {
      'reuters.com': 95,
      'ap.org': 95,
      'bbc.com': 90,
      'npr.org': 88,
      'cnn.com': 75,
      'nytimes.com': 85,
      'washingtonpost.com': 82,
      'theguardian.com': 80,
      'bloomberg.com': 88,
      'wsj.com': 85,
      'abc.com': 75,
      'cbsnews.com': 75,
      'nbcnews.com': 75,
      'foxnews.com': 60,
      'breitbart.com': 35,
      'infowars.com': 15,
      'dailymail.co.uk': 45
    }

    return { [domain]: knownSources[domain] || 50 }
  } catch (error) {
    console.error('Source credibility analysis error:', error)
    return {}
  }
}

function calculateRelevanceScore(article: any, keywords: string[]): number {
  const title = article.title?.toLowerCase() || ''
  const description = article.description?.toLowerCase() || ''
  const content = article.content?.toLowerCase() || ''
  
  let score = 0
  keywords.forEach(keyword => {
    if (title.includes(keyword)) score += 3
    if (description.includes(keyword)) score += 2
    if (content.includes(keyword)) score += 1
  })
  
  return Math.min(10, score)
}

function calculateFinalCredibilityScore(
  aiScore: number,
  newsResults: any,
  factCheckResults: any[],
  sourceCredibility: Record<string, number>
): number {
  let finalScore = aiScore * 0.4 // AI analysis gets 40% weight

  // News verification (30% weight)
  if (newsResults.articles?.length > 0) {
    const reputableSources = newsResults.articles.filter(article => 
      ['Reuters', 'Associated Press', 'BBC', 'NPR', 'Bloomberg'].includes(article.source)
    )
    const newsScore = Math.min(100, (reputableSources.length / newsResults.articles.length) * 100)
    finalScore += newsScore * 0.3
  }

  // Fact-check results (20% weight)
  if (factCheckResults.length > 0) {
    const verifiedClaims = factCheckResults.filter(result => 
      result.rating.toLowerCase().includes('true') || 
      result.rating.toLowerCase().includes('correct') ||
      result.rating.toLowerCase().includes('accurate')
    )
    const factCheckScore = (verifiedClaims.length / factCheckResults.length) * 100
    finalScore += factCheckScore * 0.2
  }

  // Source credibility (10% weight)
  const sourceScores = Object.values(sourceCredibility)
  if (sourceScores.length > 0) {
    const avgSourceScore = sourceScores.reduce((a, b) => a + b, 0) / sourceScores.length
    finalScore += avgSourceScore * 0.1
  }

  return Math.max(0, Math.min(100, finalScore))
}

function getClassification(score: number): 'reliable' | 'questionable' | 'unreliable' {
  if (score >= 75) return 'reliable'
  if (score >= 45) return 'questionable'
  return 'unreliable'
}

function calculateConfidence(aiAnalysis: any, newsResults: any, factCheckResults: any[]): number {
  let confidence = 0.6 // Base confidence

  // Higher confidence with more data sources
  if (newsResults.articles?.length > 5) confidence += 0.1
  if (factCheckResults.length > 2) confidence += 0.1
  if (aiAnalysis.verifiedFacts?.length > 3) confidence += 0.1

  // Lower confidence with conflicting information
  if (aiAnalysis.redFlags?.length > 3) confidence -= 0.1

  return Math.max(0.3, Math.min(0.95, confidence))
}