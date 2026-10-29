import api from "./api";
import type { Project } from "@/types";

export const getProjects = (workspaceId: string) =>
  api.get<Project[]>(`/api/projects/workspace/${workspaceId}`).then((r) => r.data);

export const createProject = (data: { name: string; description?: string; workspaceId: string }) =>
  api.post<Project>("/api/projects", data).then((r) => r.data);
