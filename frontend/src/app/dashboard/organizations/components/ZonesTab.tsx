"use client";

import React, { useEffect, useState } from "react";
import { Zone, Floor, getZones, getFloors, createZone, updateZone, deleteZone } from "@/api/organizations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";

export function ZonesTab({ isActive }: { isActive: boolean }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [floorId, setFloorId] = useState<string>("");
  const [minDurationSec, setMinDurationSec] = useState<number | "">("");
  const [maxDurationSec, setMaxDurationSec] = useState<number | "">("");
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
      const [zData, fData] = await Promise.all([getZones(), getFloors()]);
      setZones(zData);
      setFloors(fData);
    } catch (err: any) {
      setError(err.message || "Failed to load zones");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setName("");
    setCode("");
    setFloorId("");
    setMinDurationSec("");
    setMaxDurationSec("");
    setIsDialogOpen(true);
  }

  function openEdit(z: Zone) {
    setEditingId(z.id);
    setName(z.name);
    setCode(z.code);
    setFloorId(z.floorId);
    setMinDurationSec(z.minDurationSec ?? "");
    setMaxDurationSec(z.maxDurationSec ?? "");
    setIsDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!floorId) {
      setError("Please select a floor.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      const data = {
        floorId,
        code,
        name,
        minDurationSec: minDurationSec === "" ? undefined : Number(minDurationSec),
        maxDurationSec: maxDurationSec === "" ? undefined : Number(maxDurationSec),
      };

      if (editingId) {
        await updateZone(editingId, data as any);
      } else {
        await createZone(data as any);
      }
      setIsDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save zone");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this zone?")) return;
    try {
      await deleteZone(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete zone");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Zones</h2>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Zone
        </Button>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-3 rounded-md text-sm">{error}</div>}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Floor</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Duration Limits</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No zones found.
                </TableCell>
              </TableRow>
            ) : (
              zones.map((z) => (
                <TableRow key={z.id}>
                  <TableCell>
                    {z.floor?.building?.name ? `${z.floor.building.name} - ` : ""}
                    {z.floor?.name || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{z.code}</TableCell>
                  <TableCell className="font-medium">{z.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    Min: {z.minDurationSec ?? "-"}s | Max: {z.maxDurationSec ?? "-"}s
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(z)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(z.id)}>
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
            <DialogTitle>{editingId ? "Edit Zone" : "Add Zone"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            
            <div className="space-y-2">
              <Label>Floor <span className="text-red-500">*</span></Label>
              <Select value={floorId} onValueChange={(val) => setFloorId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.building?.name ? `${f.building.name} - ` : ""}{f.name} (Lvl {f.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Zone Code <span className="text-red-500">*</span></Label>
                <Input 
                  id="code" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.toUpperCase())} 
                  required 
                  placeholder="e.g. Z-01" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Zone Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="e.g. Entrance" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minDuration">Min Duration (sec)</Label>
                <Input 
                  id="minDuration" 
                  type="number"
                  value={minDurationSec} 
                  onChange={(e) => setMinDurationSec(e.target.value ? Number(e.target.value) : "")} 
                  placeholder="e.g. 60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDuration">Max Duration (sec)</Label>
                <Input 
                  id="maxDuration" 
                  type="number"
                  value={maxDurationSec} 
                  onChange={(e) => setMaxDurationSec(e.target.value ? Number(e.target.value) : "")} 
                  placeholder="e.g. 3600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !floorId}>
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
