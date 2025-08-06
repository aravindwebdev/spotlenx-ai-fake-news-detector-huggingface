import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Twitter, Facebook, Linkedin, Copy, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialMediaIntegrationProps {
  analysisResult: any;
  url?: string;
  contentExcerpt: string;
}

export const SocialMediaIntegration = ({ analysisResult, url, contentExcerpt }: SocialMediaIntegrationProps) => {
  const [customMessage, setCustomMessage] = useState('');
  const { toast } = useToast();

  const credibilityScore = analysisResult?.score ? Math.round(analysisResult.score * 100) : 0;
  const classification = analysisResult?.classification || 'unknown';

  const generateShareText = (platform: string) => {
    const baseText = customMessage || `I just analyzed this content with TruthLens AI. Credibility Score: ${credibilityScore}% (${classification})`;
    const hashtags = '#FactCheck #TruthLens #NewsAnalysis #MediaLiteracy';
    
    switch (platform) {
      case 'twitter':
        return `${baseText} ${url ? url : ''} ${hashtags}`.substring(0, 280);
      case 'facebook':
        return `${baseText}\n\n${url ? `Source: ${url}` : ''}\n\n${hashtags}`;
      case 'linkedin':
        return `${baseText}\n\nThis analysis was powered by TruthLens AI - helping build a more informed society through advanced fact-checking.\n\n${url ? `Source: ${url}` : ''}\n\n${hashtags}`;
      default:
        return baseText;
    }
  };

  const handleShare = (platform: string) => {
    const text = generateShareText(platform);
    const encodedText = encodeURIComponent(text);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || window.location.href)}&quote=${encodedText}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url || window.location.href)}&summary=${encodedText}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      toast({
        title: "Shared successfully!",
        description: `Content shared on ${platform}`,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "Share text has been copied",
    });
  };

  const generateReport = () => {
    const report = {
      url: url || 'N/A',
      contentExcerpt,
      analysis: analysisResult,
      timestamp: new Date().toISOString(),
      platform: 'TruthLens AI'
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `truthlens-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    
    toast({
      title: "Report downloaded!",
      description: "Analysis report has been saved",
    });
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share & Export
        </CardTitle>
        <CardDescription>
          Share your analysis results or export detailed reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share" className="bg-transparent data-[state=active]:bg-black data-[state=active]:text-white">Social Media</TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-black data-[state=active]:text-white">Export & Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="share" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/20">
                <div className={`w-3 h-3 rounded-full ${getCredibilityColor(credibilityScore)}`} />
                <span className="font-medium">Credibility Score: {credibilityScore}%</span>
                <Badge variant={classification === 'reliable' ? 'default' : classification === 'questionable' ? 'secondary' : 'destructive'}>
                  {classification}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Message (Optional)</label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add your own commentary..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2"
              >
                <Twitter className="h-4 w-4" />
                Share on Twitter
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-2"
              >
                <Facebook className="h-4 w-4" />
                Share on Facebook
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleShare('linkedin')}
                className="flex items-center gap-2"
              >
                <Linkedin className="h-4 w-4" />
                Share on LinkedIn
              </Button>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview Text</label>
              <div className="relative">
                <Textarea
                  value={generateShareText('default')}
                  readOnly
                  rows={4}
                  className="pr-10"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(generateShareText('default'))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Download Report</CardTitle>
                  <CardDescription>
                    Export detailed analysis data as JSON
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={generateReport} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON Report
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Share Link</CardTitle>
                  <CardDescription>
                    Generate a shareable link to this analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      value={window.location.href}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(window.location.href)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => window.open(window.location.href, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Credibility Score:</span>
                    <span className="ml-2">{credibilityScore}%</span>
                  </div>
                  <div>
                    <span className="font-medium">Classification:</span>
                    <span className="ml-2 capitalize">{classification}</span>
                  </div>
                  <div>
                    <span className="font-medium">Source URL:</span>
                    <span className="ml-2 text-muted-foreground truncate">{url || 'Direct text'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Analyzed:</span>
                    <span className="ml-2">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};