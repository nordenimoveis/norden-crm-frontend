'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, getUsers, updateUser, type CreateUserInput, type UpdateUserInput } from '@/lib/api/users';

export function useUsers(enabled = true) {
  return useQuery({ queryKey: ['users'], queryFn: getUsers, enabled });
}

export function useUserMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['users'] });
    qc.invalidateQueries({ queryKey: ['brokers'] });
  };
  const create = useMutation({ mutationFn: (i: CreateUserInput) => createUser(i), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: (v: { id: string; patch: UpdateUserInput }) => updateUser(v.id, v.patch),
    onSuccess: invalidate,
  });
  return { create, update };
}
