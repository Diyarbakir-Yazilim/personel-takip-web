"use client";

import React, { useEffect, useState } from "react";
import { Floor, Building, getFloors, getBuildings, createFloor, updateFloor, deleteFloor } from "@/api/organizations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";

export function FloorsTab({ isActive }: { isActive: boolean }) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<number>(1);
  const [buildingId, setBuildingId] = useState<string>("none");
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
      const [fData, bData] = await Promise.all([getFloors(), getBuildings()]);
      setFloors(fData);
      setBuildings(bData);
    } catch (err: any) {
      setError(err.message || "Failed to load floors");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setName("");
    setLevel(1);
    setBuildingId("none");
    setIsDialogOpen(true);
  }

  function openEdit(f: Floor) {
    setEditingId(f.id);
    setName(f.name);
    setLevel(f.level);
    setBuildingId(f.buildingId || "none");
    setIsDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const bId = buildingId === "none" ? undefined : buildingId;
      if (editingId) {
        await updateFloor(editingId, { name, level, buildingId: bId });
      } else {
        await createFloor({ name, level, buildingId: bId });
      }
      setIsDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save floor");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this floor?")) return;
    try {
      await deleteFloor(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete floor");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Floors</h2>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Floor
        </Button>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-3 rounded-md text-sm">{error}</div>}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Building</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : floors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No floors found.
                </TableCell>
              </TableRow>
            ) : (
              floors.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.building?.name || "-"}</TableCell>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>{f.level}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(f)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(f.id)}>
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
            <DialogTitle>{editingId ? "Edit Floor" : "Add Floor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            
            <div className="space-y-2">
              <Label>Building (Optional)</Label>
              <Select value={buildingId} onValueChange={(val) => setBuildingId(val || "none")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Standalone)</SelectItem>
                  {buildings.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Floor Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="e.g. Ground Floor" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="level">Level (Number)</Label>
              <Input 
                id="level" 
                type="number"
                value={level} 
                onChange={(e) => setLevel(parseInt(e.target.value, 10))} 
                required 
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
