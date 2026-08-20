"use client";

import React, { useEffect, useState } from "react";
import { Floor, Building, getFloors, getBuildings, createFloor, updateFloor, deleteFloor } from "@/services/organizations";
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
      setError(err.message || "Katlar yüklenemedi");
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
      setError(err.message || "Kat kaydedilemedi");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu katı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteFloor(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Kat silinemedi");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Katlar</h2>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Kat Ekle
        </Button>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-3 rounded-md text-sm">{error}</div>}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bina</TableHead>
              <TableHead>Adı</TableHead>
              <TableHead>Seviye</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
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
                  Kat bulunamadı.
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
            <DialogTitle>{editingId ? "Kat Düzenle" : "Kat Ekle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            
            <div className="space-y-2">
              <Label>Bina (İsteğe Bağlı)</Label>
              <Select value={buildingId} onValueChange={(val) => setBuildingId(val || "none")}>
                <SelectTrigger>
                  <SelectValue placeholder="Bir bina seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Yok (Bağımsız)</SelectItem>
                  {buildings.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Kat Adı</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="Örn. Zemin Kat" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="level">Seviye (Sayı)</Label>
              <Input 
                id="level" 
                type="number"
                value={level} 
                onChange={(e) => setLevel(parseInt(e.target.value, 10))} 
                required 
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
