'use client';

import { apiFetch } from './client';
import type { Role, User } from '@/lib/types';

export function getUsers(): Promise<User[]> {
  return apiFetch<User[]>('users');
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  inRotation?: boolean;
  chatwootAgentId?: number | null;
  chatwootToken?: string | null;
}

export function createUser(input: CreateUserInput): Promise<User> {
  return apiFetch<User>('users', { method: 'POST', body: JSON.stringify(input) });
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  active?: boolean;
  inRotation?: boolean;
  password?: string;
  chatwootAgentId?: number | null;
  chatwootToken?: string | null;
}

export function updateUser(id: string, patch: UpdateUserInput): Promise<User> {
  return apiFetch<User>(`users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}
