import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
export const AuthPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const {
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: displayName
          }
        }
      });
      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Account created successfully!",
          description: "You can now start analyzing news content."
        });
        // Navigate to home page after successful signup
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully."
        });
        // Navigate to home page after successful login
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Features */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SpotLens AI
            </h1>
            <p className="text-lg text-muted-foreground">
              Advanced fact-checking and news analysis platform
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-50">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI-Powered Analysis</h3>
                <p className="text-sm text-muted-foreground">Advanced algorithms detect misinformation and bias</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-50">
                <TrendingUp className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Monitoring</h3>
                <p className="text-sm text-muted-foreground">Track news trends and credibility in real-time</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/50">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Collaborative Platform</h3>
                <p className="text-sm text-muted-foreground">Share insights and build a trusted news community</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur h-[500px]">
          <CardHeader className="text-center bg-gray-600 rounded-t-lg pb-0">
            <CardTitle className="text-gray-50">Join SpotLens</CardTitle>
            <CardDescription className="text-slate-300">
              Create an account or sign in to access advanced features
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-slate-600 rounded-b-lg pt-4">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="bg-white text-black transition-all duration-300 data-[state=active]:bg-black data-[state=active]:text-white">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="bg-white text-black transition-all duration-300 data-[state=active]:bg-black data-[state=active]:text-white">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="bg-slate-600 text-white">Email</Label>
                    <Input id="signin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-white">Password</Label>
                    <Input id="signin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" className="bg-slate-50" />
                  </div>
                  {error && <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white">Display Name</Label>
                    <Input id="signup-name" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="Your display name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white">Email</Label>
                    <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password"className="text-white">Password</Label>
                    <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Create a password" minLength={6} />
                  </div>
                  {error && <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>;
};