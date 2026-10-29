import api from "./api";
import type { Task, TaskStatus } from "@/types";

export const getTasks = (projectId: string) =>
  api.get<Task[]>(`/api/tasks/project/${projectId}`).then((r) => r.data);

export const createTask = (data: { title: string; description?: string; status: TaskStatus; projectId: string }) =>
  api.post<Task>("/api/tasks", data).then((r) => r.data);

export const updateTask = (id: string, data: Partial<Pick<Task, "title" | "description" | "status">>) =>
  api.put<Task>(`/api/tasks/${id}`, data).then((r) => r.data);

export const deleteTask = (id: string) => api.delete(`/api/tasks/${id}`);
