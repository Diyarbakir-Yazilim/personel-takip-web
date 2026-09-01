"use client";

import React, { useEffect, useState } from "react";
import { Zone, Floor, getZones, getFloors, createZone, updateZone, deleteZone } from "@/services/organizations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit2, Plus, Loader2, QrCode } from "lucide-react";
import { QrCodeDialog } from "./QrCodeDialog";

export function ZonesTab({ isActive }: { isActive: boolean }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qrZone, setQrZone] = useState<Zone | null>(null);
  
  // Form State (Dakika bazlı)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [floorId, setFloorId] = useState<string>("");
  const [minDurationMin, setMinDurationMin] = useState<number | "">("");
  const [maxDurationMin, setMaxDurationMin] = useState<number | "">("");
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
      setError(err.message || "Odalar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setName("");
    setCode("");
    setFloorId("");
    setMinDurationMin("");
    setMaxDurationMin("");
    setIsDialogOpen(true);
  }

  function openEdit(z: Zone) {
    setEditingId(z.id);
    setName(z.name);
    setCode(z.code);
    setFloorId(z.floorId);
    // Backend'den direkt dakika olarak geldiği varsayılıyor
    setMinDurationMin((z as any).minDurationMin ?? "");
    setMaxDurationMin((z as any).maxDurationMin ?? "");
    setIsDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!floorId) {
      setError("Lütfen bir kat seçin.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      const data = {
        floorId,
        code,
        name,
        minDurationMin: minDurationMin === "" ? undefined : Number(minDurationMin),
        maxDurationMin: maxDurationMin === "" ? undefined : Number(maxDurationMin),
      };

      if (editingId) {
        await updateZone(editingId, data as any);
      } else {
        await createZone(data as any);
      }
      setIsDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Oda kaydedilemedi");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu odayı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteZone(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Oda silinemedi");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Odalar</h2>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Oda Ekle
        </Button>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-3 rounded-md text-sm">{error}</div>}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kat</TableHead>
              <TableHead>Kod</TableHead>
              <TableHead>Adı</TableHead>
              <TableHead>Süre Sınırları</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
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
                  Oda bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              zones.map((z: any) => (
                <TableRow key={z.id}>
                  <TableCell>
                    {z.floor?.building?.name ? `${z.floor.building.name} - ` : ""}
                    {z.floor?.name || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{z.code}</TableCell>
                  <TableCell className="font-medium">{z.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    Min: {z.minDurationMin ?? "-"} dk | Max: {z.maxDurationMin ?? "-"} dk
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setQrZone(z)} title="QR Kod Üret">
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(z)} title="Düzenle">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(z.id)} title="Sil">
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
            <DialogTitle>{editingId ? "Oda Düzenle" : "Oda Ekle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            
            <div className="space-y-2">
              <Label>Kat <span className="text-red-500">*</span></Label>
              <Select value={floorId} onValueChange={(val) => setFloorId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Bir kat seçin" />
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
                <Label htmlFor="code">Oda Kodu <span className="text-red-500">*</span></Label>
                <Input 
                  id="code" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.toUpperCase())} 
                  required 
                  placeholder="Örn. ODA-01" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Oda Adı <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="Örn. Toplantı Odası" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minDuration">Min Süre (Dakika)</Label>
                <Input 
                  id="minDuration" 
                  type="number"
                  value={minDurationMin} 
                  onChange={(e) => setMinDurationMin(e.target.value ? Number(e.target.value) : "")} 
                  placeholder="Örn. 5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDuration">Max Süre (Dakika)</Label>
                <Input 
                  id="maxDuration" 
                  type="number"
                  value={maxDurationMin} 
                  onChange={(e) => setMaxDurationMin(e.target.value ? Number(e.target.value) : "")} 
                  placeholder="Örn. 60"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
              <Button type="submit" disabled={isSubmitting || !floorId}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <QrCodeDialog 
        zone={qrZone} 
        isOpen={!!qrZone} 
        onClose={() => setQrZone(null)} 
      />
    </div>
  );
}