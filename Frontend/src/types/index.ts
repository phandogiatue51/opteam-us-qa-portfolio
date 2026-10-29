/** User returned from GET /auth/me */
export interface User {
  id: string;
  email: string;
}

/** Auth response from POST /auth/login */
export interface AuthResponse {
  token: string;
  user: User;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdAt: string;
}

export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}
