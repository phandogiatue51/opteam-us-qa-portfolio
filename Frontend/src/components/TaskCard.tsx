import { useState, memo } from "react";
import { Trash2, MoreHorizontal, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateTask, deleteTask } from "@/services/tasks";
import type { Task, TaskStatus } from "@/types";
import { format } from "date-fns";

const statusLabels: Record<TaskStatus, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const nextStatus: Record<TaskStatus, TaskStatus | null> = {
  todo: "in-progress",
  "in-progress": "done",
  done: null,
};

interface Props {
  task: Task;
  onUpdated: () => void;
  isDragging?: boolean;
}

const TaskCard = ({ task, onUpdated, isDragging }: Props) => {
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (status: TaskStatus) => {
    await updateTask(task.id, { status });
    onUpdated();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTask(task.id);
      onUpdated();
    } finally {
      setDeleting(false);
    }
  };

  const dateStr = task.createdAt
    ? format(new Date(task.createdAt), "MMM d, yyyy")
    : "";

  const next = nextStatus[task.status];

  return (
    <Card className={`border-border bg-card transition-shadow duration-200 hover:shadow-md dark:hover:border-emerald-500/10 ${isDragging ? "shadow-lg ring-2 ring-ring/20" : "shadow-sm"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug text-card-foreground">
            {task.title}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {next && (
                <DropdownMenuItem onClick={() => handleStatusChange(next)}>
                  <ArrowRight className="mr-2 h-3.5 w-3.5" />
                  Move to {statusLabels[next]}
                </DropdownMenuItem>
              )}
              {task.status !== "todo" && (
                <DropdownMenuItem onClick={() => handleStatusChange("todo")}>
                  <ArrowRight className="mr-2 h-3.5 w-3.5" />
                  Move to To Do
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {dateStr && (
          <p className="mt-3 text-[11px] text-muted-foreground">{dateStr}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(TaskCard);
