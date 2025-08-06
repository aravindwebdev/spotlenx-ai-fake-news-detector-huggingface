import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, Bell, BellOff, Edit, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AlertRule {
  id: string;
  keywords: string[];
  alert_type: string;
  is_active: boolean;
  created_at: string;
}

interface TriggeredAlert {
  id: string;
  alert_id: string;
  analysis_id: string;
  content_excerpt: string;
  matched_keywords: string[];
  triggered_at: string;
  is_read: boolean;
}

export const AlertsManager = () => {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [newKeywords, setNewKeywords] = useState('');
  const [newAlertType, setNewAlertType] = useState('all');
  const [editingAlert, setEditingAlert] = useState<AlertRule | null>(null);
  const [editKeywords, setEditKeywords] = useState('');
  const [editAlertType, setEditAlertType] = useState('all');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadAlerts();
      loadTriggeredAlerts();
      subscribeToAlerts();
    }
  }, [user]);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        title: "Error loading alerts",
        description: "Could not load your alert rules",
        variant: "destructive"
      });
    }
  };

  const loadTriggeredAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('triggered_alerts')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTriggeredAlerts(data || []);
    } catch (error) {
      console.error('Error loading triggered alerts:', error);
    }
  };

  const subscribeToAlerts = () => {
    const channel = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          loadAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createAlert = async () => {
    if (!newKeywords.trim() || !user) return;

    setLoading(true);
    try {
      const keywords = newKeywords.split(',').map(k => k.trim()).filter(k => k);
      
      const { error } = await supabase
        .from('alerts')
        .insert([{
          user_id: user.id,
          keywords,
          alert_type: newAlertType,
          is_active: true
        }]);

      if (error) throw error;

      setNewKeywords('');
      setNewAlertType('all');
      toast({
        title: "Alert created!",
        description: "You'll be notified when matching content is analyzed",
        className: "bg-success border-success text-success-foreground"
      });
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: "Error creating alert",
        description: "Could not create the alert rule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (alert: AlertRule) => {
    setEditingAlert(alert);
    setEditKeywords(alert.keywords.join(', '));
    setEditAlertType(alert.alert_type);
  };

  const updateAlert = async () => {
    if (!editingAlert || !editKeywords.trim()) return;

    setLoading(true);
    try {
      const keywords = editKeywords.split(',').map(k => k.trim()).filter(k => k);
      
      const { error } = await supabase
        .from('alerts')
        .update({
          keywords,
          alert_type: editAlertType
        })
        .eq('id', editingAlert.id);

      if (error) throw error;

      setEditingAlert(null);
      setEditKeywords('');
      setEditAlertType('all');
      
      // Refresh the alerts list to show updated data
      await loadAlerts();
      
      toast({
        title: "Alert updated!",
        description: "Your alert rule has been successfully updated",
        className: "bg-success border-success text-success-foreground"
      });
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: "Error updating alert",
        description: "Could not update the alert rule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (triggeredAlertId: string) => {
    try {
      const { error } = await supabase
        .from('triggered_alerts')
        .update({ is_read: true })
        .eq('id', triggeredAlertId);

      if (error) throw error;

      setTriggeredAlerts(prev => 
        prev.map(alert => 
          alert.id === triggeredAlertId 
            ? { ...alert, is_read: true }
            : alert
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_active: isActive })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: isActive ? "Alert activated" : "Alert deactivated",
        description: `Alert has been ${isActive ? 'enabled' : 'disabled'}`,
        className: isActive ? "bg-success border-success text-success-foreground" : "bg-warning border-warning text-warning-foreground"
      });
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast({
        title: "Error updating alert",
        description: "Could not update the alert status",
        variant: "destructive"
      });
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert deleted",
        description: "Alert rule has been removed",
        className: "bg-warning border-warning text-warning-foreground"
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: "Error deleting alert",
        description: "Could not delete the alert rule",
        variant: "destructive"
      });
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'misinformation': return 'destructive';
      case 'bias': return 'secondary';
      case 'source_reliability': return 'outline';
      default: return 'default';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'misinformation': return 'Misinformation';
      case 'bias': return 'Bias Detection';
      case 'source_reliability': return 'Source Issues';
      default: return 'All Issues';
    }
  };

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Please sign in to manage alerts and notifications.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Create New Alert
          </CardTitle>
          <CardDescription>
            Get notified when content matching your keywords is analyzed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              value={newKeywords}
              onChange={(e) => setNewKeywords(e.target.value)}
              placeholder="politics, healthcare, climate change"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="alert-type">Alert Type</Label>
            <Select value={newAlertType} onValueChange={setNewAlertType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Issues</SelectItem>
                <SelectItem value="misinformation">Misinformation Only</SelectItem>
                <SelectItem value="bias">Bias Detection Only</SelectItem>
                <SelectItem value="source_reliability">Source Reliability Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={createAlert} disabled={loading || !newKeywords.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Alert Rules</CardTitle>
          <CardDescription>
            Manage your existing notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alert rules configured yet</p>
              <p className="text-sm">Create your first alert to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {alert.is_active ? (
                        <Bell className="h-4 w-4 text-green-500" />
                      ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge variant={getAlertTypeColor(alert.alert_type)}>
                        {getAlertTypeLabel(alert.alert_type)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {alert.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(alert)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={alert.is_active}
                      onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Triggered Alerts
          </CardTitle>
          <CardDescription>
            Latest alerts that have been triggered by your rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {triggeredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts have been triggered yet</p>
              <p className="text-sm">Your alerts will appear here when content matches your keywords</p>
            </div>
          ) : (
            <div className="space-y-4">
              {triggeredAlerts.map((triggered) => (
                <div
                  key={triggered.id}
                  className={`p-4 border rounded-lg ${triggered.is_read ? 'bg-muted/30' : 'bg-warning/10 border-warning/50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${triggered.is_read ? 'text-muted-foreground' : 'text-warning'}`} />
                        <span className="text-sm font-medium">
                          Alert Triggered
                        </span>
                        {!triggered.is_read && (
                          <Badge variant="destructive" className="text-xs">New</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {triggered.matched_keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      
                      <p className="text-sm text-foreground">
                        {triggered.content_excerpt.substring(0, 150)}...
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(triggered.triggered_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!triggered.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(triggered.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Alert Dialog */}
      <Dialog open={!!editingAlert} onOpenChange={() => setEditingAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Alert Rule</DialogTitle>
            <DialogDescription>
              Update your alert keywords and type
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-keywords">Keywords (comma-separated)</Label>
              <Input
                id="edit-keywords"
                value={editKeywords}
                onChange={(e) => setEditKeywords(e.target.value)}
                placeholder="politics, healthcare, climate change"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-alert-type">Alert Type</Label>
              <Select value={editAlertType} onValueChange={setEditAlertType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  <SelectItem value="misinformation">Misinformation Only</SelectItem>
                  <SelectItem value="bias">Bias Detection Only</SelectItem>
                  <SelectItem value="source_reliability">Source Reliability Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAlert(null)}>
              Cancel
            </Button>
            <Button onClick={updateAlert} disabled={loading || !editKeywords.trim()}>
              Update Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};