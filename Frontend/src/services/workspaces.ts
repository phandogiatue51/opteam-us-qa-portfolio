import api from "./api";
import type { Workspace } from "@/types";

export const getWorkspaces = () => api.get<Workspace[]>("/api/workspaces").then((r) => r.data);

export const createWorkspace = (data: { name: string; description?: string }) =>
  api.post<Workspace>("/api/workspaces", data).then((r) => r.data);
