import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, AlertTriangle, CheckCircle, Globe, Bookmark, BookmarkCheck, Bot, Newspaper, TrendingUp, ExternalLink, Lightbulb, Link, Database, FileText } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FakeNewsDetector } from '@/utils/FakeNewsDetector';
import { EnhancedSourceVerificationService } from '@/services/EnhancedSourceVerification';
import { AnalysisHistoryService } from '@/services/AnalysisHistoryService';
import { BookmarkService } from '@/services/BookmarkService';
import { AlertService } from '@/services/AlertService';
import { SocialMediaIntegration } from '@/components/SocialMediaIntegration';
import { useAuth } from '@/hooks/useAuth';
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
  sourceVerification?: any;
}
export const NewsAnalyzer = () => {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('text');
  const { toast } = useToast();
  const analyzeContent = async (content: string, sourceUrl?: string) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Perform AI-powered analysis
      const analysisResult = await FakeNewsDetector.analyzeText(content, sourceUrl);

      setResult(analysisResult);

      // Save to analysis history
      try {
        const analysisId = await AnalysisHistoryService.saveAnalysis({
          url: sourceUrl,
          content_excerpt: content.substring(0, 500),
          analysis_result: analysisResult,
          source_verification: analysisResult.sources,
          user_id: user?.id
        });

        if (analysisId) {
          setCurrentAnalysisId(analysisId);
          // Check if already bookmarked
          const bookmarkStatus = await BookmarkService.isBookmarked(analysisId);
          setIsBookmarked(bookmarkStatus);
        }
      } catch (error) {
        console.warn('Failed to save analysis history:', error);
      }

      // Check for alerts
      if (user) {
        try {
          await AlertService.checkAlerts(content, analysisResult, sourceUrl, currentAnalysisId);
        } catch (error) {
          console.warn('Failed to check alerts:', error);
        }
      }

      toast({
        title: "AI Analysis Complete",
        description: `Content classified as ${analysisResult.classification} with ${Math.round(analysisResult.confidence * 100)}% confidence using real-time fact-checking.`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to bookmark analyses.",
        variant: "destructive"
      });
      return;
    }

    if (!currentAnalysisId) {
      toast({
        title: "No Analysis to Bookmark",
        description: "Please run an analysis first.",
        variant: "destructive"
      });
      return;
    }

    setIsBookmarking(true);
    try {
      if (isBookmarked) {
        const success = await BookmarkService.removeBookmark(currentAnalysisId);
        if (success) {
          setIsBookmarked(false);
          toast({
            title: "Bookmark Removed",
            description: "Analysis removed from bookmarks.",
            className: "bg-warning border-warning text-warning-foreground"
          });
        }
      } else {
        const bookmark = await BookmarkService.addBookmark(currentAnalysisId);
        if (bookmark) {
          setIsBookmarked(true);
          toast({
            title: "Analysis Bookmarked",
            description: "Analysis saved to your bookmarks.",
            className: "bg-success border-success text-success-foreground"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Bookmark Failed",
        description: "Unable to update bookmark. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBookmarking(false);
    }
  };
  const handleTextAnalysis = async () => {
    if (!text.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to analyze.",
        variant: "destructive"
      });
      return;
    }
    await analyzeContent(text);
  };
  const handleUrlAnalysis = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to analyze.",
        variant: "destructive"
      });
      return;
    }
    try {
      const content = await FakeNewsDetector.extractFromUrl(url);
      await analyzeContent(content, url);
    } catch (error) {
      toast({
        title: "URL Analysis Failed",
        description: "Unable to extract content from the URL.",
        variant: "destructive"
      });
    }
  };
  const getScoreColor = (classification: string) => {
    switch (classification) {
      case 'reliable':
        return 'text-green-600 dark:text-green-400';
      case 'questionable':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'unreliable':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };
  const getScoreIcon = (classification: string) => {
    switch (classification) {
      case 'reliable':
        return <CheckCircle className="w-5 h-5" />;
      case 'questionable':
        return <AlertTriangle className="w-5 h-5" />;
      case 'unreliable':
        return <Shield className="w-5 h-5" />;
      default:
        return null;
    }
  };
  return <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI-Powered Fact Checker</h1>
        <p className="text-muted-foreground">
          Real-time analysis using OpenAI, live news verification, and multiple fact-checking sources
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <a href="/dashboard" className="text-primary hover:underline">View Analytics Dashboard</a>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-white">
          <CardTitle>Content Analysis</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="bg-transparent data-[state=active]:bg-black data-[state=active]:text-white">Text Analysis</TabsTrigger>
              <TabsTrigger value="url" className="data-[state=active]:bg-black data-[state=active]:text-white">URL Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-4">
              <Textarea placeholder="Paste the news text here to analyze..." value={text} onChange={e => setText(e.target.value)} className="min-h-[200px] bg-white" />
              <Button onClick={handleTextAnalysis} disabled={isAnalyzing} className="w-full">
                {isAnalyzing ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Analyzing...
                  </div>
                ) : 'Analyze Text'}
              </Button>
            </TabsContent>
            
            <TabsContent value="url" className="space-y-4">
              <Input placeholder="Enter news article URL..." value={url} onChange={e => setUrl(e.target.value)} type="url" className="bg-white" />
              <Button onClick={handleUrlAnalysis} disabled={isAnalyzing} className="w-full">
                {isAnalyzing ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Analyzing...
                  </div>
                ) : 'Analyze URL'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {result && <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getScoreIcon(result.classification)}
                AI-Powered Analysis Results
              </div>
              {user && currentAnalysisId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBookmark}
                  disabled={isBookmarking}
                  className="flex items-center gap-2"
                >
                  {isBookmarking ? (
                    <LoadingSpinner size="sm" />
                  ) : isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <div className={`text-4xl font-bold ${getScoreColor(result.classification)}`}>
                {typeof result.score === 'number' ? Math.round(result.score * 100) : 0}%
              </div>
              <Badge variant={result.classification === 'reliable' ? 'default' : result.classification === 'questionable' ? 'secondary' : 'destructive'} className="text-sm">
                {result.classification.toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Confidence: {typeof result.confidence === 'number' ? Math.round(result.confidence * 100) : 0}%
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.details.keyIndicators.map((indicator, index) => <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{indicator}</span>
                      </li>)}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.details.suggestions.map((suggestion, index) => <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            {/* AI Analysis Summary */}
            {result.aiAnalysis && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Analysis Summary
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">{result.aiAnalysis.summary}</p>
                </div>
              </div>
            )}

            {/* Real-time Sources */}
            {result.sources && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Real-time Source Verification
                </h3>
                
                {/* Supporting Articles */}
                {result.sources.supportingArticles && result.sources.supportingArticles.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Newspaper className="w-4 h-4" />
                      Supporting News Articles ({result.sources.supportingArticles.length})
                    </h4>
                    <div className="space-y-2">
                      {result.sources.supportingArticles.slice(0, 5).map((article, index) => (
                        <div key={index} className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1 line-clamp-2">{article.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{article.source}</span>
                                <span>•</span>
                                <span>Relevance: {Math.round(article.relevance * 10)}%</span>
                                <span>•</span>
                                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <ExternalLink 
                              className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0 cursor-pointer hover:text-primary" 
                              onClick={() => window.open(article.url, '_blank')}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fact Check Articles */}
                {result.sources.factCheckArticles && result.sources.factCheckArticles.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Fact Check Results ({result.sources.factCheckArticles.length})
                    </h4>
                    <div className="space-y-2">
                      {result.sources.factCheckArticles.slice(0, 3).map((factCheck, index) => (
                        <div key={index} className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{factCheck.organization}</span>
                            <Badge variant={
                              factCheck.rating.toLowerCase().includes('true') || 
                              factCheck.rating.toLowerCase().includes('correct') || 
                              factCheck.rating.toLowerCase().includes('accurate') 
                                ? 'default' : 'destructive'
                            }>
                              {factCheck.rating}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2 line-clamp-2">{factCheck.title}</p>
                          {factCheck.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{factCheck.summary}</p>
                          )}
                          {factCheck.url && (
                            <div className="flex justify-end mt-2">
                              <ExternalLink 
                                className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" 
                                onClick={() => window.open(factCheck.url, '_blank')}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Real-time Data Insights */}
                {result.realTimeData && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Real-time Insights
                    </h4>
                    <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                      {result.realTimeData.newsVolume > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Related news articles found:</span>
                          <span className="font-medium">{result.realTimeData.newsVolume}</span>
                        </div>
                       )}
                       {result.realTimeData.trendingTopics && result.realTimeData.trendingTopics.length > 0 && (
                         <div>
                           <span className="text-sm font-medium">Trending topics: </span>
                           <span className="text-sm">{result.realTimeData.trendingTopics.slice(0, 3).join(', ')}</span>
                         </div>
                       )}
                      {result.realTimeData.sourceCredibilityMap && Object.keys(result.realTimeData.sourceCredibilityMap).length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Source credibility: </span>
                          {Object.entries(result.realTimeData.sourceCredibilityMap).map(([domain, score]) => (
                            <div key={domain} className="text-sm ml-2">
                              {domain}: {score}/100
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resource Section - Sources and References */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Resources & References
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Source */}
                {url && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Original Source
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Analyzed URL:</span>
                        <ExternalLink 
                          className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" 
                          onClick={() => window.open(url, '_blank')}
                        />
                      </div>
                      <p className="text-sm break-all">{url}</p>
                    </div>
                  </div>
                )}

                {/* Verification Sources */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Verification Sources
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>OpenAI GPT-4o Analysis</span>
                      <span className="text-green-600">✓ Used</span>
                    </div>
                    {result.sources?.factCheckArticles && result.sources.factCheckArticles.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Google Fact Check API</span>
                        <span className="text-green-600">✓ Used</span>
                      </div>
                    )}
                    {result.sources?.supportingArticles && result.sources.supportingArticles.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span>NewsAPI Real-time Data</span>
                        <span className="text-green-600">✓ Used</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>Source Credibility Database</span>
                      <span className="text-green-600">✓ Used</span>
                    </div>
                  </div>
                </div>

                {/* Fact-Checking Organizations */}
                {result.sources?.factCheckArticles && result.sources.factCheckArticles.length > 0 && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Fact-Checking Organizations
                    </h4>
                    <div className="space-y-2">
                      {result.sources.factCheckArticles.slice(0, 4).map((factCheck, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{factCheck.organization}</span>
                          {factCheck.url && (
                            <ExternalLink 
                              className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" 
                              onClick={() => window.open(factCheck.url, '_blank')}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supporting News Sources */}
                {result.sources?.supportingArticles && result.sources.supportingArticles.length > 0 && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Newspaper className="w-4 h-4" />
                      Supporting News Sources
                    </h4>
                    <div className="space-y-2">
                      {result.sources.supportingArticles.slice(0, 4).map((article, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{article.source}</span>
                          <ExternalLink 
                            className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" 
                            onClick={() => window.open(article.url, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Reference Links - Topic Specific */}
                <div className="bg-muted/50 p-4 rounded-lg md:col-span-2">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Additional Reference Links
                  </h4>
                  
                  {/* Show supporting articles if available */}
                  {result.sources?.supportingArticles && result.sources.supportingArticles.length > 0 ? (
                    <div className="space-y-2">
                      {result.sources.supportingArticles.slice(0, 6).map((article, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">{article.title}</p>
                            <p className="text-xs text-muted-foreground">{article.source} • {new Date(article.publishedAt).toLocaleDateString()}</p>
                          </div>
                          <ExternalLink 
                            className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary ml-2 flex-shrink-0" 
                            onClick={() => window.open(article.url, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  ) : result.realTimeData?.trendingTopics && result.realTimeData.trendingTopics.length > 0 ? (
                    /* Show suggested search links for the topic if no articles found */
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-3">Search for more information about this topic:</p>
                      {result.realTimeData.trendingTopics.slice(0, 3).map((topic, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="flex items-center justify-between p-2 bg-background rounded border">
                            <span className="text-sm">Google: {topic}</span>
                            <ExternalLink 
                              className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" 
                              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(topic)}`, '_blank')}
                            />
                          </div>
                          <div className="flex items-center justify-between p-2 bg-background rounded border">
                            <span className="text-sm">Scholar: {topic}</span>
                            <ExternalLink 
                              className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" 
                              onClick={() => window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}`, '_blank')}
                            />
                          </div>
                          <div className="flex items-center justify-between p-2 bg-background rounded border">
                            <span className="text-sm">News: {topic}</span>
                            <ExternalLink 
                              className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" 
                              onClick={() => window.open(`https://news.google.com/search?q=${encodeURIComponent(topic)}`, '_blank')}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Fallback - show general search suggestions */
                    <div className="text-sm text-muted-foreground">
                      <p>No specific articles found. Try searching for this topic on:</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center justify-between p-2 bg-background rounded border">
                          <span>Google Search</span>
                          <ExternalLink 
                            className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" 
                            onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(text.substring(0, 100))}`, '_blank')}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2 bg-background rounded border">
                          <span>Google News</span>
                          <ExternalLink 
                            className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" 
                            onClick={() => window.open(`https://news.google.com/search?q=${encodeURIComponent(text.substring(0, 100))}`, '_blank')}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Analysis Methodology */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg md:col-span-2">
                  <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Analysis Methodology</h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• <strong>AI Content Analysis:</strong> OpenAI GPT-4o-mini analyzes text for credibility signals, bias, and factual accuracy</p>
                    <p>• <strong>Real-time Verification:</strong> Cross-references claims with live news sources and fact-checking databases</p>
                    <p>• <strong>Source Credibility:</strong> Evaluates publisher reputation, bias ratings, and factual reporting history</p>
                    <p>• <strong>Multi-source Validation:</strong> Combines multiple data sources for comprehensive credibility assessment</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">AI Recommendations</h3>
              <ul className="space-y-2">
                {result.details.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>}
      
      {result && <SocialMediaIntegration analysisResult={result} url={url} contentExcerpt={text.substring(0, 500)} />}
    </div>;
};