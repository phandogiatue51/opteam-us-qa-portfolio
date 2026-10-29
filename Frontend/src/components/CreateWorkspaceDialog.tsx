import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { createWorkspace } from "@/services/workspaces";

interface Props {
  onCreated: () => void;
}

const CreateWorkspaceDialog = ({ onCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createWorkspace({ name, description: description || undefined });
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
          <Plus className="mr-1 h-4 w-4" /> New Workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card shadow-lg">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>Create a new workspace to organize your projects.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="My Workspace" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} className="rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? "Creating…" : "Create Workspace"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceDialog;
