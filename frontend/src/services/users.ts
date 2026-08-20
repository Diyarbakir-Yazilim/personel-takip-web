import { apiRequest } from '@/services/apiClient';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'STAFF';
  createdAt: string;
  updatedAt: string;
}

export async function getUsers(): Promise<User[]> {
  const res = await apiRequest<User[]>('/users');
  return res.data || [];
}

export async function createUser(userData: any): Promise<User> {
  const res = await apiRequest<User>('/users', {
    method: 'POST',
    body: userData,
  });
  return res.data as User;
}

export async function updateUser(id: string, userData: any): Promise<User> {
  const res = await apiRequest<User>(`/users/${id}`, {
    method: 'PATCH',
    body: userData,
  });
  return res.data as User;
}

export async function deleteUser(id: string): Promise<void> {
  await apiRequest(`/users/${id}`, {
    method: 'DELETE',
  });
}
