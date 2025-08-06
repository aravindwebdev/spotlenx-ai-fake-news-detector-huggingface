import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookmarkIcon, Search, ExternalLink, Trash2, Edit3, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Bookmark {
  id: string;
  analysis_id: string;
  tags: string[];
  notes: string;
  created_at: string;
  analysis_history: {
    url: string;
    content_excerpt: string;
    analysis_result: any;
  };
}
const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);
  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('bookmarks').select(`
          *,
          analysis_history (
            url,
            content_excerpt,
            analysis_result
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast({
        title: "Error loading bookmarks",
        description: "Could not load your saved analyses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const updateBookmark = async (bookmarkId: string, updates: {
    notes?: string;
    tags?: string[];
  }) => {
    try {
      const {
        error
      } = await supabase.from('bookmarks').update(updates).eq('id', bookmarkId);
      if (error) throw error;
      await loadBookmarks();
      setEditingBookmark(null);
      toast({
        title: "Bookmark updated",
        description: "Your notes and tags have been saved"
      });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast({
        title: "Error updating bookmark",
        description: "Could not save your changes",
        variant: "destructive"
      });
    }
  };
  const deleteBookmark = async (bookmarkId: string) => {
    try {
      const {
        error
      } = await supabase.from('bookmarks').delete().eq('id', bookmarkId);
      if (error) throw error;
      await loadBookmarks();
      toast({
        title: "Bookmark deleted",
        description: "Analysis has been removed from bookmarks"
      });
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast({
        title: "Error deleting bookmark",
        description: "Could not remove the bookmark",
        variant: "destructive"
      });
    }
  };
  const startEditing = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark.id);
    setEditNotes(bookmark.notes || '');
    setEditTags(bookmark.tags?.join(', ') || '');
  };
  const saveEditing = (bookmarkId: string) => {
    const tags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    updateBookmark(bookmarkId, {
      notes: editNotes,
      tags
    });
  };
  const getCredibilityColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  const filteredBookmarks = bookmarks.filter(bookmark => bookmark.analysis_history.content_excerpt.toLowerCase().includes(searchTerm.toLowerCase()) || bookmark.analysis_history.url?.toLowerCase().includes(searchTerm.toLowerCase()) || bookmark.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) || bookmark.notes?.toLowerCase().includes(searchTerm.toLowerCase()));
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please sign in to view your bookmarked analyses.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BookmarkIcon className="h-8 w-8" />
              Bookmarked Analyses
            </h1>
            <p className="text-muted-foreground">
              Your saved fact-checks and analysis results
            </p>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search bookmarks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          {loading ? <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading bookmarks...</p>
            </div> : filteredBookmarks.length === 0 ? <Card>
              <CardContent className="text-center py-8">
                <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No matching bookmarks' : 'No bookmarks yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start analyzing content and bookmark interesting results'}
                </p>
              </CardContent>
            </Card> : <div className="space-y-4">
              {filteredBookmarks.map(bookmark => <Card key={bookmark.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          Analysis Result
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`font-semibold ${getCredibilityColor((bookmark.analysis_history.analysis_result?.score || 0) * 100)}`}>
                            {Math.round((bookmark.analysis_history.analysis_result?.score || 0) * 100)}% Credible
                          </span>
                          <Badge variant={bookmark.analysis_history.analysis_result?.classification === 'reliable' ? 'default' : bookmark.analysis_history.analysis_result?.classification === 'questionable' ? 'secondary' : 'destructive'}>
                            {bookmark.analysis_history.analysis_result?.classification || 'Unknown'}
                          </Badge>
                        </div>
                        {bookmark.analysis_history.url && <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <ExternalLink className="h-4 w-4" />
                            <a href={bookmark.analysis_history.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                              {bookmark.analysis_history.url}
                            </a>
                          </div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => startEditing(bookmark)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteBookmark(bookmark.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Content Excerpt</h4>
                        <p className="text-sm text-muted-foreground">
                          {bookmark.analysis_history.content_excerpt}
                        </p>
                      </div>

                      {editingBookmark === bookmark.id ? <div className="space-y-4 border-t pt-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Notes</label>
                            <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Add your notes..." rows={3} />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                            <Input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="politics, healthcare, fact-check" />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => saveEditing(bookmark.id)}>
                              Save
                            </Button>
                            <Button variant="outline" onClick={() => setEditingBookmark(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div> : <div className="border-t pt-4">
                          {bookmark.notes && <div className="mb-3">
                              <h4 className="font-medium mb-1">Notes</h4>
                              <p className="text-sm text-muted-foreground">{bookmark.notes}</p>
                            </div>}
                          
                          {bookmark.tags && bookmark.tags.length > 0 && <div className="mb-3">
                              <h4 className="font-medium mb-2 flex items-center gap-1">
                                <Tag className="h-4 w-4" />
                                Tags
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {bookmark.tags.map((tag, index) => <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>)}
                              </div>
                            </div>}
                          
                          <p className="text-xs text-muted-foreground">
                            Saved {new Date(bookmark.created_at).toLocaleDateString()}
                          </p>
                        </div>}
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
        </div>
    </div>
  );
};
export default Bookmarks;