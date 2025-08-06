import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, url } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const results = {
      factChecks: [],
      newsReferences: [],
      credibilityScore: 0
    }

    // Google Fact Check API
    const factCheckApiKey = Deno.env.get('GOOGLE_FACT_CHECK_API_KEY')
    if (factCheckApiKey && query) {
      try {
        const factCheckResponse = await fetch(
          `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(query)}&key=${factCheckApiKey}`
        )
        
        if (factCheckResponse.ok) {
          const factCheckData = await factCheckResponse.json()
          results.factChecks = factCheckData.claims || []
          console.log('Fact check results:', results.factChecks.length)
        }
      } catch (error) {
        console.error('Fact check API error:', error)
      }
    }

    // News API for cross-referencing
    const newsApiKey = Deno.env.get('NEWS_API_KEY')
    if (newsApiKey && query) {
      try {
        const newsResponse = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=5&apiKey=${newsApiKey}`
        )
        
        if (newsResponse.ok) {
          const newsData = await newsResponse.json()
          results.newsReferences = newsData.articles || []
          console.log('News references found:', results.newsReferences.length)
        }
      } catch (error) {
        console.error('News API error:', error)
      }
    }

    // Calculate enhanced credibility score
    let credibilityScore = 50 // Base score
    
    // Boost score based on fact-check results
    if (results.factChecks.length > 0) {
      const verifiedClaims = results.factChecks.filter(claim => 
        claim.claimReview?.some(review => 
          review.textualRating?.toLowerCase().includes('true') ||
          review.textualRating?.toLowerCase().includes('correct')
        )
      )
      credibilityScore += (verifiedClaims.length / results.factChecks.length) * 30
    }

    // Boost score based on reputable news sources
    if (results.newsReferences.length > 0) {
      const reputableSources = results.newsReferences.filter(article => {
        const domain = new URL(article.url).hostname
        return ['reuters.com', 'ap.org', 'bbc.com', 'npr.org'].includes(domain)
      })
      credibilityScore += (reputableSources.length / results.newsReferences.length) * 20
    }

    results.credibilityScore = Math.min(100, Math.max(0, credibilityScore))

    return new Response(
      JSON.stringify(results),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})