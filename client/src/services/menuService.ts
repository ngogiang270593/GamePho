import apiClient from './apiClient';

export type MenuItem = { id: number; name: string; price: number };

export async function getMenu(): Promise<MenuItem[]> {
  const response = await apiClient.get<MenuItem[]>('/menu');
  return response.data;
}
