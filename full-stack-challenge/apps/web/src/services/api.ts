import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AssociateSensorRequest,
  CreateMachineRequest,
  CreateMonitoringPointRequest,
  ListMonitoringPointsParams,
  MachineDto,
  MonitoringPointDto,
  PaginatedResponse,
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

function toQuery(params: ListMonitoringPointsParams): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.order) search.set('order', params.order);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const monitoringPointsApi = {
  list: (params: ListMonitoringPointsParams = {}) =>
    apiRequest<PaginatedResponse<MonitoringPointDto>>(
      `/api/monitoring-points${toQuery(params)}`
    ),
  create: (machineId: string, payload: CreateMonitoringPointRequest) =>
    apiRequest<MonitoringPointDto>(`/api/machines/${machineId}/monitoring-points`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/monitoring-points/${id}`, {
      method: 'DELETE',
    }),
  associateSensor: (pointId: string, payload: AssociateSensorRequest) =>
    apiRequest<MonitoringPointDto>(`/api/monitoring-points/${pointId}/sensor`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  removeSensor: (pointId: string) =>
    apiRequest<void>(`/api/monitoring-points/${pointId}/sensor`, {
      method: 'DELETE',
    }),
};
