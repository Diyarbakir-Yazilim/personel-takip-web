/**
 * Helper to get the JWT token from cookies (or localStorage if used).
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  // Try to get token from cookies
  const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
  if (match) return match[2];
  // Fallback to localStorage
  return localStorage.getItem("token");
}

function getApiBaseUrl(): string {
  // Use Next.js proxy route if you have one, or direct backend URL
  // We'll use the proxy route to avoid CORS, or direct depending on setup.
  // The tasks use /api/tasks (proxy) or process.env.NEXT_PUBLIC_API_URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  return baseUrl ? baseUrl.replace(/\/$/, "") : "/api";
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  // Determine if we are hitting /api proxy or direct backend
  const baseUrl = getApiBaseUrl();
  const url = baseUrl.includes("http") ? `${baseUrl}${endpoint}` : `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = Array.isArray(errorData.message) ? errorData.message.join(", ") : errorData.message;
      }
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMessage);
  }

  // Return empty object for 204 or empty response
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {};
  }

  return response.json();
}

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
  return fetchWithAuth("/organizations/buildings");
}

export async function createBuilding(data: { name: string }): Promise<Building> {
  return fetchWithAuth("/organizations/buildings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBuilding(id: string, data: { name: string }): Promise<Building> {
  return fetchWithAuth(`/organizations/buildings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteBuilding(id: string): Promise<Building> {
  return fetchWithAuth(`/organizations/buildings/${id}`, {
    method: "DELETE",
  });
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
  return fetchWithAuth(`/organizations/floors${query}`);
}

export async function createFloor(data: { buildingId?: string; name: string; level: number }): Promise<Floor> {
  return fetchWithAuth("/organizations/floors", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFloor(id: string, data: Partial<{ buildingId: string; name: string; level: number }>): Promise<Floor> {
  return fetchWithAuth(`/organizations/floors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteFloor(id: string): Promise<Floor> {
  return fetchWithAuth(`/organizations/floors/${id}`, {
    method: "DELETE",
  });
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
  return fetchWithAuth(`/organizations/zones${query}`);
}

export async function createZone(data: { 
  floorId: string; 
  code: string; 
  name: string; 
  minDurationSec?: number; 
  maxDurationSec?: number 
}): Promise<Zone> {
  return fetchWithAuth("/organizations/zones", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateZone(id: string, data: Partial<{ 
  floorId: string; 
  code: string; 
  name: string; 
  minDurationSec: number; 
  maxDurationSec: number 
}>): Promise<Zone> {
  return fetchWithAuth(`/organizations/zones/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteZone(id: string): Promise<Zone> {
  return fetchWithAuth(`/organizations/zones/${id}`, {
    method: "DELETE",
  });
}
