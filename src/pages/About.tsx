import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, TrendingUp, Users, Zap, Globe, CheckCircle } from 'lucide-react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">About SpotLenX</h1>
          <p className="text-xl text-muted-foreground">
            Advanced AI-powered fact-checking and news analysis platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                To combat misinformation and promote media literacy through cutting-edge AI technology, 
                empowering users to make informed decisions based on verified, credible information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                A world where truth prevails over misinformation, where every citizen has access to 
                reliable fact-checking tools, and where informed discourse shapes our collective future.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Advanced machine learning algorithms analyze content for credibility, bias, and misinformation patterns.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Real-time Monitoring</h3>
              <p className="text-muted-foreground">
                Track news trends, source credibility, and emerging misinformation in real-time across multiple platforms.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Collaborative Platform</h3>
              <p className="text-muted-foreground">
                Build a community of fact-checkers, share insights, and contribute to a more informed society.
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-center">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="space-y-3">
                <div className="mx-auto w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-semibold">Submit Content</h4>
                <p className="text-sm text-muted-foreground">
                  Paste URLs, text, or upload documents for analysis
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="mx-auto w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-semibold">AI Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI examines credibility, bias, and factual accuracy
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="mx-auto w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-semibold">Verification</h4>
                <p className="text-sm text-muted-foreground">
                  Cross-reference with trusted sources and fact-check databases
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="mx-auto w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <h4 className="font-semibold">Results</h4>
                <p className="text-sm text-muted-foreground">
                  Receive detailed credibility scores and recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-16 mb-12">
          <h2 className="text-2xl font-bold mb-4">Join the Fight Against Misinformation</h2>
          <p className="text-muted-foreground mb-8">
            Together, we can build a more informed and truthful digital world.
          </p>
          <div className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">You can trust us</span>
          </div>
        </div>

        <div className="border-t pt-8 mt-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
              <p className="text-muted-foreground mb-1">Business Enquiry:</p>
              <a href="mailto:aravindsak.work@gmail.com" className="text-primary hover:underline">
                aravindsak.work@gmail.com
              </a>
            </div>
            <div className="text-center md:text-right">
              <p className="text-muted-foreground">
                Made with ❤️ by{' '}
                <span className="text-primary font-medium">aravindwebdev</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default About;