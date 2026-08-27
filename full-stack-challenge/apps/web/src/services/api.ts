import type {
  AuthLoginRequest,
  AuthLoginResponse,
  CreateMachineRequest,
  MachineDto,
  UpdateMachineRequest,
} from '@dynamox/shared';
import { apiRequest } from './apiClient';

export const authApi = {
  login: (payload: AuthLoginRequest) =>
    apiRequest<AuthLoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () =>
    apiRequest<void>('/api/auth/logout', {
      method: 'POST',
    }),
  me: () => apiRequest<{ user: AuthLoginResponse['user'] }>('/api/auth/me'),
};

export const machinesApi = {
  list: () => apiRequest<MachineDto[]>('/api/machines'),
  create: (payload: CreateMachineRequest) =>
    apiRequest<MachineDto>('/api/machines', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: UpdateMachineRequest) =>
    apiRequest<MachineDto>(`/api/machines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/machines/${id}`, {
      method: 'DELETE',
    }),
};
