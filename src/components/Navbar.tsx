import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, User, Bell, BookmarkIcon, BarChart3, Search, Info, ScanSearch } from 'lucide-react';
export const Navbar = () => {
  const {
    user,
    signOut
  } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  return <nav className="border-b bg-black backdrop-blur supports-[backdrop-filter]:bg-black sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Search className="h-6 w-6 text-white" />
            <span className="text-xl font-bold text-white">
              SpotLenX
            </span>
          </Link>
          
          {user && <div className="hidden md:flex items-center gap-4">
              <Link to="/">
                <Button variant={isActive('/') ? 'secondary' : 'ghost'} size="sm" className={isActive('/') ? 'bg-black text-white hover:bg-black/90' : 'text-white hover:bg-white/10 hover:text-white'}>
                  <ScanSearch className="h-4 w-4 mr-2" />
                  Analyzer
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant={isActive('/dashboard') ? 'secondary' : 'ghost'} size="sm" className={isActive('/dashboard') ? 'bg-black text-white hover:bg-black/90' : 'text-white hover:bg-white/10 hover:text-white'}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/bookmarks">
                <Button variant={isActive('/bookmarks') ? 'secondary' : 'ghost'} size="sm" className={isActive('/bookmarks') ? 'bg-black text-white hover:bg-black/90' : 'text-white hover:bg-white/10 hover:text-white'}>
                  <BookmarkIcon className="h-4 w-4 mr-2" />
                  Bookmarks
                </Button>
              </Link>
              <Link to="/alerts">
                <Button variant={isActive('/alerts') ? 'secondary' : 'ghost'} size="sm" className={isActive('/alerts') ? 'bg-black text-white hover:bg-black/90' : 'text-white hover:bg-white/10 hover:text-white'}>
                  <Bell className="h-4 w-4 mr-2" />
                  Alerts
                </Button>
              </Link>
            </div>}
        </div>

        <div className="flex items-center gap-4">
          {user ? <div className="flex items-center gap-3">
              
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white/10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">
                        {user.user_metadata?.display_name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/about">
                      <Info className="mr-2 h-4 w-4" />
                      About
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div> : <Link to="/auth">
              <Button className="bg-white text-black hover:bg-white/90">Sign In</Button>
            </Link>}
        </div>
      </div>
    </nav>;
};