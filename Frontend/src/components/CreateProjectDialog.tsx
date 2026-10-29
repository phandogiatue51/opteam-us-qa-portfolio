import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { createProject } from "@/services/projects";

interface Props {
  workspaceId: string;
  onCreated: () => void;
}

const CreateProjectDialog = ({ workspaceId, onCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProject({ name, description: description || undefined, workspaceId });
      setName("");
      setDescription("");
      setOpen(false);
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full">
          <Plus className="mr-1 h-4 w-4" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card shadow-lg">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Create a new project in this workspace.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="My Project" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} className="rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? "Creating…" : "Create Project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
