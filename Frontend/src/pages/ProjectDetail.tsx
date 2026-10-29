import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { getTasks, updateTask } from "@/services/tasks";
import type { Task, TaskStatus } from "@/types";
import AppLayout from "@/components/layout/AppLayout";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import KanbanColumn from "@/components/KanbanColumn";

const STATUS_ORDER: TaskStatus[] = ["todo", "in-progress", "done"];

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = () => {
    if (!id) return;
    getTasks(id)
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, [id]);

  const grouped = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId as TaskStatus;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(draggableId, { status: newStatus });
    } catch {
      fetchTasks(); // revert on failure
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
          {id && <CreateTaskDialog projectId={id} onCreated={fetchTasks} />}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={grouped[status]}
                onUpdated={fetchTasks}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
    </AppLayout>
  );
};

export default ProjectDetail;
