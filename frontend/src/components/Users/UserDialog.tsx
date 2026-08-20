"use client";

import React, { useState, useEffect } from "react";
import { createUser, updateUser, User } from '@/services/users';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface UserDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserDialog({ user, isOpen, onClose, onSuccess }: UserDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("STAFF");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setPassword(""); // Don't show password
      setRole(user.role);
    } else {
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
    }
    setError("");
  }, [user, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: any = { fullName, email, role };
      if (password) {
        payload.password = password;
      }

      if (user) {
        await updateUser(user.id, payload);
      } else {
        if (!password) {
          throw new Error("Lütfen bir şifre belirleyin");
        }
        await createUser(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Kullanıcı Düzenle" : "Kullanıcı Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && <div className="text-red-500 bg-red-50 p-2 text-sm rounded">{error}</div>}
          
          <div className="space-y-2">
            <Label>Ad Soyad <span className="text-red-500">*</span></Label>
            <Input 
              required 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="Örn. Vahap Akgül" 
            />
          </div>

          <div className="space-y-2">
            <Label>E-posta <span className="text-red-500">*</span></Label>
            <Input 
              required 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Örn. personel@dtso.org.tr" 
            />
          </div>

          <div className="space-y-2">
            <Label>Şifre {user ? "(Değiştirmek istemiyorsanız boş bırakın)" : <span className="text-red-500">*</span>}</Label>
            <Input 
              type="password"
              required={!user}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>

          <div className="space-y-2">
            <Label>Rol <span className="text-red-500">*</span></Label>
            <Select value={role} onValueChange={(val) => setRole(val || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">Temizlik Personeli (STAFF)</SelectItem>
                <SelectItem value="ADMIN">Yönetici (ADMIN)</SelectItem>
                <SelectItem value="SUPERVISOR">Denetmen (SUPERVISOR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>İptal</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
