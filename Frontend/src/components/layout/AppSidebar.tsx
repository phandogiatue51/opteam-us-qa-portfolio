import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, LogOut, ChevronRight, UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import { getWorkspaces } from "@/services/workspaces";
import { getProjects } from "@/services/projects";
import type { Workspace, Project } from "@/types";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project[]>>({});

  useEffect(() => {
    getWorkspaces()
      .then(setWorkspaces)
      .catch(() => {});
  }, []);

  const loadProjects = async (wsId: string) => {
    if (projectsMap[wsId]) return;
    try {
      const projects = await getProjects(wsId);
      setProjectsMap((prev) => ({ ...prev, [wsId]: projects }));
    } catch {
      /* silent */
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-5 py-4">
        <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-sidebar-foreground dark-text-glow">
          <Logo size={22} />
          OpTeamUs
        </span>
        {user && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={location.pathname === "/dashboard"} onClick={() => navigate("/dashboard")}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={location.pathname === "/profile"} onClick={() => navigate("/profile")}>
                <UserCircle className="h-4 w-4" />
                <span>Profile</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaces.map((ws) => (
                <Collapsible key={ws.id} asChild onOpenChange={(open) => open && loadProjects(ws.id)}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={location.pathname === `/workspaces/${ws.id}`}
                        onClick={() => navigate(`/workspaces/${ws.id}`)}
                      >
                        <FolderKanban className="h-4 w-4" />
                        <span className="truncate">{ws.name}</span>
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {(projectsMap[ws.id] ?? []).map((p) => (
                          <SidebarMenuSubItem key={p.id}>
                            <SidebarMenuSubButton
                              isActive={location.pathname === `/projects/${p.id}`}
                              onClick={() => navigate(`/projects/${p.id}`)}
                            >
                              <span className="truncate">{p.name}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => { logout(); navigate("/login"); }}>
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
