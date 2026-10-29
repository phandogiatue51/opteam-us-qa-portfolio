import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProjects } from "@/services/projects";
import type { Project } from "@/types";
import AppLayout from "@/components/layout/AppLayout";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";

const WorkspaceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = () => {
    if (!id) return;
    getProjects(id)
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, [id]);

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark-text-glow">Projects</h1>
          {id && <CreateProjectDialog workspaceId={id} onCreated={fetchProjects} />}
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-32 animate-pulse border-border bg-card" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="mb-4 h-12 w-12 text-muted-foreground dark:text-emerald-400/60" />
              <p className="text-lg font-semibold text-foreground">No projects yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first project in this workspace.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer border-border bg-card shadow-sm transition-all hover:shadow-md"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary dark:bg-emerald-500/10">
                      <Layers className="h-4 w-4 text-foreground" />
                    </div>
                    {p.name}
                  </CardTitle>
                  {p.description && <CardDescription>{p.description}</CardDescription>}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default WorkspaceDetail;
