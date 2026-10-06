'use client';

import { apiFetch } from './client';
import type { Product } from '@/lib/types';

export const getProducts = () => apiFetch<Product[]>('products');

export const createProduct = (input: { name: string; aliases?: string[] }) =>
  apiFetch<Product>('products', { method: 'POST', body: JSON.stringify(input) });

export const updateProduct = (id: string, patch: { name?: string; aliases?: string[]; active?: boolean }) =>
  apiFetch<Product>(`products/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });

export const deleteProduct = (id: string) => apiFetch<void>(`products/${id}`, { method: 'DELETE' });

/** Reconhece o empreendimento nas conversas de leads existentes sem produto. */
export const rescanProducts = () =>
  apiFetch<{ scanned: number; tagged: number }>('products/rescan', { method: 'POST', body: JSON.stringify({}) });
