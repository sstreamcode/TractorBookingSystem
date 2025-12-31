import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Tractor,
  Calendar,
  LogOut,
  User,
  Shield,
  Moon,
  Sun,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getInitials, getAvatarColor, getImageUrlWithCacheBust } from '@/lib/utils';

interface SuperAdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingOwnersCount?: number;
}

const SuperAdminSidebar = ({ activeTab, onTabChange, pendingOwnersCount = 0 }: SuperAdminSidebarProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      value: 'overview',
    },
    {
      title: 'Users',
      icon: Users,
      value: 'users',
    },
    {
      title: 'Tractor Owners',
      icon: UserCheck,
      value: 'tractor-owners',
      badge: pendingOwnersCount > 0 ? pendingOwnersCount : undefined,
    },
    {
      title: 'All Tractors',
      icon: Tractor,
      value: 'tractors',
    },
    {
      title: 'Bookings & Payments',
      icon: Calendar,
      value: 'bookings',
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">Tractor Sewa</span>
            <span className="text-xs text-sidebar-foreground/70">Super Admin</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <button
                        onClick={() => onTabChange(item.value)}
                        className="w-full"
                      >
                        <Icon />
                        <span>{item.title}</span>
                        {item.badge && (
                          <SidebarMenuBadge>
                            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                              {item.badge}
                            </Badge>
                          </SidebarMenuBadge>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              tooltip={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={getImageUrlWithCacheBust(user?.profilePictureUrl)}
                      alt={user?.name}
                    />
                    <AvatarFallback
                      className={`${getAvatarColor(user?.name || user?.email || 'User')} rounded-lg text-white text-xs font-semibold`}
                    >
                      {getInitials(user?.name || user?.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{user?.name || 'User'}</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      {user?.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export default SuperAdminSidebar;

