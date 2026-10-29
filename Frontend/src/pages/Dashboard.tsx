import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getWorkspaces } from "@/services/workspaces";
import type { Workspace } from "@/types";
import AppLayout from "@/components/layout/AppLayout";
import CreateWorkspaceDialog from "@/components/CreateWorkspaceDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = () => {
    getWorkspaces()
      .then(setWorkspaces)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground dark-text-glow">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <CreateWorkspaceDialog onCreated={fetchWorkspaces} />
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-32 animate-pulse border-border bg-card" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground dark:text-emerald-400/60" />
              <p className="text-lg font-semibold text-foreground">No workspaces yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first workspace to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <Card
                key={ws.id}
                className="cursor-pointer border-border bg-card shadow-sm transition-all hover:shadow-md"
                onClick={() => navigate(`/workspaces/${ws.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary dark:bg-emerald-500/10">
                      <FolderKanban className="h-4 w-4 text-foreground" />
                    </div>
                    {ws.name}
                  </CardTitle>
                  {ws.description && <CardDescription>{ws.description}</CardDescription>}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
