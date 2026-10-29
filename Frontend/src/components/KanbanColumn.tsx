import { memo } from "react";
import { MoreHorizontal } from "lucide-react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TaskCard from "@/components/TaskCard";
import type { Task, TaskStatus } from "@/types";

const statusMeta: Record<TaskStatus, { label: string; dotClass: string }> = {
  todo: { label: "To Do", dotClass: "bg-muted-foreground" },
  "in-progress": { label: "In Progress", dotClass: "bg-primary" },
  done: { label: "Done", dotClass: "bg-chart-2 dark:bg-emerald-400" },
};

interface Props {
  status: TaskStatus;
  tasks: Task[];
  onUpdated: () => void;
}

const KanbanColumn = ({ status, tasks, onUpdated }: Props) => {
  const meta = statusMeta[status];

  return (
    <div className="flex min-w-[280px] max-h-[calc(100vh-220px)] flex-1 flex-col rounded-xl border border-border bg-muted/30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass}`} />
          <span className="text-sm font-semibold text-foreground">{meta.label}</span>
          <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] justify-center px-1.5 text-xs">
            {tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-3 pb-3 transition-colors duration-200 ${snapshot.isDraggingOver ? "bg-accent/40 dark:bg-emerald-500/5 rounded-b-xl" : ""}`}
          >
            <div className="min-h-[60px]">
              {tasks.length === 0 && !snapshot.isDraggingOver ? (
                <p className="py-10 text-center text-xs text-muted-foreground">No tasks yet</p>
              ) : (
                tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className="mb-2.5 last:mb-0"
                        style={{
                          ...dragProvided.draggableProps.style,
                          transition: dragSnapshot.isDragging
                            ? dragProvided.draggableProps.style?.transition
                            : "transform 0.2s cubic-bezier(0.2,0,0,1)",
                          transform: dragSnapshot.isDragging
                            ? `${dragProvided.draggableProps.style?.transform ?? ""} rotate(2deg)`
                            : dragProvided.draggableProps.style?.transform,
                          opacity: dragSnapshot.isDragging ? 0.92 : 1,
                          willChange: dragSnapshot.isDragging ? "transform" : "auto",
                        }}
                      >
                        <TaskCard task={task} onUpdated={onUpdated} isDragging={dragSnapshot.isDragging} />
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default memo(KanbanColumn);
