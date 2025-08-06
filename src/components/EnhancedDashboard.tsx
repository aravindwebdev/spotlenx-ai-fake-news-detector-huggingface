import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, Clock, Target, Globe } from 'lucide-react';
import { AnalysisHistoryService, AnalysisHistoryRecord } from '@/services/AnalysisHistoryService';
interface DashboardStats {
  totalAnalyses: number;
  averageCredibility: number;
  reliableCount: number;
  questionableCount: number;
  unreliableCount: number;
  recentTrend: 'up' | 'down' | 'stable';
}
const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];
export const EnhancedDashboard = () => {
  const [history, setHistory] = useState<AnalysisHistoryRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadDashboardData();
  }, []);
  const loadDashboardData = async () => {
    try {
      const analyses = await AnalysisHistoryService.getRecentAnalyses(50);
      setHistory(analyses);
      const dashboardStats = calculateStats(analyses);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const calculateStats = (analyses: AnalysisHistoryRecord[]): DashboardStats => {
    const totalAnalyses = analyses.length;
    if (totalAnalyses === 0) {
      return {
        totalAnalyses: 0,
        averageCredibility: 0,
        reliableCount: 0,
        questionableCount: 0,
        unreliableCount: 0,
        recentTrend: 'stable'
      };
    }
    
    const classifications = analyses.map(a => a.analysis_result.classification);
    const reliableCount = classifications.filter(c => c === 'reliable').length;
    const questionableCount = classifications.filter(c => c === 'questionable').length;
    const unreliableCount = classifications.filter(c => c === 'unreliable').length;
    const averageCredibility = analyses.reduce((sum, a) => sum + (a.analysis_result.score * 100), 0) / totalAnalyses;

    // Calculate trend (simplified)
    const recent = analyses.slice(0, 10);
    const older = analyses.slice(10, 20);
    const recentAvg = recent.length ? recent.reduce((sum, a) => sum + a.analysis_result.score, 0) / recent.length : 0;
    const olderAvg = older.length ? older.reduce((sum, a) => sum + a.analysis_result.score, 0) / older.length : 0;
    let recentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (recentAvg > olderAvg + 0.1) recentTrend = 'up';else if (recentAvg < olderAvg - 0.1) recentTrend = 'down';
    return {
      totalAnalyses,
      averageCredibility,
      reliableCount,
      questionableCount,
      unreliableCount,
      recentTrend
    };
  };
  const getChartData = () => {
    return history.slice(0, 20).reverse().map((analysis, index) => ({
      index: index + 1,
      credibility: Math.round(analysis.analysis_result.score * 100),
      classification: analysis.analysis_result.classification,
      date: new Date(analysis.created_at!).toLocaleDateString()
    }));
  };
  const getPieData = () => {
    if (!stats) return [];
    return [{
      name: 'Reliable',
      value: stats.reliableCount,
      color: '#22c55e'
    }, {
      name: 'Questionable',
      value: stats.questionableCount,
      color: '#f59e0b'
    }, {
      name: 'Unreliable',
      value: stats.unreliableCount,
      color: '#ef4444'
    }];
  };
  const getSourceData = () => {
    try {
      const sources: Record<string, number> = {};
      
      history.forEach(h => {
        if (h.url) {
          try {
            const domain = new URL(h.url).hostname;
            sources[domain] = (sources[domain] || 0) + 1;
          } catch {
            sources['invalid-url'] = (sources['invalid-url'] || 0) + 1;
          }
        } else {
          // For text analyses, categorize by content type or use generic label
          sources['text-analysis'] = (sources['text-analysis'] || 0) + 1;
        }
      });
      
      return Object.entries(sources)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([source, count]) => ({
          domain: source === 'text-analysis' ? 'Text Analysis' : source,
          count
        }));
    } catch (error) {
      console.error('Error processing source data:', error);
      return [];
    }
  };
  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>;
  }
  if (!stats) {
    return <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Enhanced Analytics Dashboard</h2>
          <p className="text-muted-foreground">No analysis data available yet. Start analyzing content to see insights here.</p>
        </div>
      </div>;
  }
  return <div className="max-w-6xl mx-auto p-6 space-y-6 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights into your content analysis</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Analyses</p>
                <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${stats.recentTrend === 'up' ? 'text-green-500' : stats.recentTrend === 'down' ? 'text-red-500' : 'text-yellow-500'}`} />
              <div>
                <p className="text-sm text-muted-foreground">Avg Credibility</p>
                <p className="text-2xl font-bold">{Math.round(stats.averageCredibility)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Recent Trend</p>
                <Badge variant={stats.recentTrend === 'up' ? 'default' : stats.recentTrend === 'down' ? 'destructive' : 'secondary'}>
                  {stats.recentTrend === 'up' ? 'Improving' : stats.recentTrend === 'down' ? 'Declining' : 'Stable'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Reliable Sources</p>
                <p className="text-2xl font-bold">{stats.reliableCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="trends" className="data-[state=active]:bg-black data-[state=active]:text-white text-xs md:text-sm">Trends</TabsTrigger>
          <TabsTrigger value="distribution" className="data-[state=active]:bg-black data-[state=active]:text-white text-xs md:text-sm">Distribution</TabsTrigger>
          <TabsTrigger value="reliability" className="data-[state=active]:bg-black data-[state=active]:text-white text-xs md:text-sm">Reliability</TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-black data-[state=active]:text-white text-xs md:text-sm">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Credibility Score Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Credibility Score']} labelFormatter={(label: any) => `Analysis #${label}`} />
                  <Line type="monotone" dataKey="credibility" stroke="#8884d8" strokeWidth={2} dot={{
                  fill: '#8884d8'
                }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Classification Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={getPieData()} cx="50%" cy="50%" innerRadius={60} outerRadius={120} dataKey="value" label={({
                    name,
                    percent
                  }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {getPieData().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Classification Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Reliable</span>
                  </div>
                  <span className="font-bold">{stats.reliableCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Questionable</span>
                  </div>
                  <span className="font-bold">{stats.questionableCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Unreliable</span>
                  </div>
                  <span className="font-bold">{stats.unreliableCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reliability">
          <Card>
            <CardHeader>
              <CardTitle>Reliability Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{stats.reliableCount}</div>
                  <div className="text-sm text-green-700 mt-2">Reliable Sources</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.totalAnalyses > 0 ? `${Math.round((stats.reliableCount / stats.totalAnalyses) * 100)}%` : '0%'} of total
                  </div>
                </div>
                <div className="text-center p-6 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">{stats.questionableCount}</div>
                  <div className="text-sm text-yellow-700 mt-2">Questionable Sources</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.totalAnalyses > 0 ? `${Math.round((stats.questionableCount / stats.totalAnalyses) * 100)}%` : '0%'} of total
                  </div>
                </div>
                <div className="text-center p-6 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{stats.unreliableCount}</div>
                  <div className="text-sm text-red-700 mt-2">Unreliable Sources</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.totalAnalyses > 0 ? `${Math.round((stats.unreliableCount / stats.totalAnalyses) * 100)}%` : '0%'} of total
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Reliability Score</h4>
                <div className="text-2xl font-bold text-primary">{Math.round(stats.averageCredibility)}%</div>
                <p className="text-sm text-muted-foreground">Average credibility across all analyses</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Most Analyzed Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getSourceData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="domain" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};