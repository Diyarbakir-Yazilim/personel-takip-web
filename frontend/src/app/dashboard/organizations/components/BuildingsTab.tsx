"use client";

import React, { useEffect, useState } from "react";
import { Building, getBuildings, createBuilding, updateBuilding, deleteBuilding } from "@/api/organizations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";

export function BuildingsTab({ isActive }: { isActive: boolean }) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isActive) {
      loadData();
    }
  }, [isActive]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await getBuildings();
      setBuildings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load buildings");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setName("");
    setIsDialogOpen(true);
  }

  function openEdit(b: Building) {
    setEditingId(b.id);
    setName(b.name);
    setIsDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      if (editingId) {
        await updateBuilding(editingId, { name });
      } else {
        await createBuilding({ name });
      }
      setIsDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save building");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this building?")) return;
    try {
      await deleteBuilding(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete building");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Buildings</h2>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Building
        </Button>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-3 rounded-md text-sm">{error}</div>}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : buildings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No buildings found.
                </TableCell>
              </TableRow>
            ) : (
              buildings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Building" : "Add Building"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Building Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="e.g. Main Office" 
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
