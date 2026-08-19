import { apiRequest } from '@/services/apiClient';

// -----------------------------------------------------
// BUILDINGS
// -----------------------------------------------------

export type Building = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export async function getBuildings(): Promise<Building[]> {
  return apiRequest<Building[]>("/organizations/buildings").then(res => res.data || []);
}

export async function createBuilding(data: { name: string }): Promise<Building> {
  return apiRequest<Building>("/organizations/buildings", {
    method: "POST",
    body: data,
  }).then(res => res.data as Building);
}

export async function updateBuilding(id: string, data: { name: string }): Promise<Building> {
  return apiRequest<Building>(`/organizations/buildings/${id}`, {
    method: "PATCH",
    body: data,
  }).then(res => res.data as Building);
}

export async function deleteBuilding(id: string): Promise<Building> {
  return apiRequest<Building>(`/organizations/buildings/${id}`, {
    method: "DELETE",
  }).then(res => res.data as Building);
}

// -----------------------------------------------------
// FLOORS
// -----------------------------------------------------

export type Floor = {
  id: string;
  buildingId: string | null;
  name: string;
  level: number;
  createdAt: string;
  updatedAt: string;
  building?: { name: string };
};

export async function getFloors(buildingId?: string): Promise<Floor[]> {
  const query = buildingId ? `?buildingId=${buildingId}` : "";
  return apiRequest<Floor[]>(`/organizations/floors${query}`).then(res => res.data || []);
}

export async function createFloor(data: { buildingId?: string; name: string; level: number }): Promise<Floor> {
  return apiRequest<Floor>("/organizations/floors", {
    method: "POST",
    body: data,
  }).then(res => res.data as Floor);
}

export async function updateFloor(id: string, data: Partial<{ buildingId: string; name: string; level: number }>): Promise<Floor> {
  return apiRequest<Floor>(`/organizations/floors/${id}`, {
    method: "PATCH",
    body: data,
  }).then(res => res.data as Floor);
}

export async function deleteFloor(id: string): Promise<Floor> {
  return apiRequest<Floor>(`/organizations/floors/${id}`, {
    method: "DELETE",
  }).then(res => res.data as Floor);
}

// -----------------------------------------------------
// ZONES
// -----------------------------------------------------

export type Zone = {
  id: string;
  floorId: string;
  code: string;
  name: string;
  minDurationSec: number | null;
  maxDurationSec: number | null;
  createdAt: string;
  updatedAt: string;
  floor?: { name: string; building?: { name: string } };
};

export async function getZones(floorId?: string): Promise<Zone[]> {
  const query = floorId ? `?floorId=${floorId}` : "";
  return apiRequest<Zone[]>(`/organizations/zones${query}`).then(res => res.data || []);
}

export async function createZone(data: { 
  floorId: string; 
  code: string; 
  name: string; 
  minDurationSec?: number; 
  maxDurationSec?: number 
}): Promise<Zone> {
  return apiRequest<Zone>("/organizations/zones", {
    method: "POST",
    body: data,
  }).then(res => res.data as Zone);
}

export async function updateZone(id: string, data: Partial<{ 
  floorId: string; 
  code: string; 
  name: string; 
  minDurationSec: number; 
  maxDurationSec: number 
}>): Promise<Zone> {
  return apiRequest<Zone>(`/organizations/zones/${id}`, {
    method: "PATCH",
    body: data,
  }).then(res => res.data as Zone);
}

export async function deleteZone(id: string): Promise<Zone> {
  return apiRequest<Zone>(`/organizations/zones/${id}`, {
    method: "DELETE",
  }).then(res => res.data as Zone);
}
