import { apiClient } from './client';
import { NFTTemplate, ApiResponse, PaginatedResponse, Event, Merchant } from '@/types';

export const templatesApi = {
  getTemplates: async (params?: {
    page?: number;
    pageSize?: number;
    merchantId?: string;
  }): Promise<ApiResponse<PaginatedResponse<NFTTemplate>>> => {
    return await apiClient.get('/templates', params);
  },

  getTemplate: async (id: number): Promise<ApiResponse<NFTTemplate>> => {
    return await apiClient.get(`/templates/${id}`);
  },

  createTemplate: async (data: {
    name: string;
    description: string;
    image: string;
    price: string;
    benefits: string[];
    supply: number;
  }): Promise<ApiResponse<NFTTemplate>> => {
    return await apiClient.post('/templates', data);
  },

  updateTemplate: async (
    id: number,
    data: Partial<NFTTemplate>
  ): Promise<ApiResponse<NFTTemplate>> => {
    return await apiClient.put(`/templates/${id}`, data);
  },

  deleteTemplate: async (id: number): Promise<ApiResponse<void>> => {
    return await apiClient.delete(`/templates/${id}`);
  }
};

export const eventsApi = {
  getEvents: async (params?: {
    page?: number;
    pageSize?: number;
    merchantId?: string;
  }): Promise<ApiResponse<PaginatedResponse<Event>>> => {
    return await apiClient.get('/events', params);
  },

  getEvent: async (id: string): Promise<ApiResponse<Event>> => {
    return await apiClient.get(`/events/${id}`);
  },

  createEvent: async (data: {
    name: string;
    description: string;
    date: string;
    location: string;
    price: string;
    capacity: number;
    templateId: number;
  }): Promise<ApiResponse<Event>> => {
    return await apiClient.post('/events', data);
  },

  updateEvent: async (
    id: string,
    data: Partial<Event>
  ): Promise<ApiResponse<Event>> => {
    return await apiClient.put(`/events/${id}`, data);
  },

  deleteEvent: async (id: string): Promise<ApiResponse<void>> => {
    return await apiClient.delete(`/events/${id}`);
  },

  bookEvent: async (id: string): Promise<ApiResponse<void>> => {
    return await apiClient.post(`/events/${id}/book`);
  }
};

export const merchantsApi = {
  getMerchants: async (params?: {
    page?: number;
    pageSize?: number;
    verified?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<Merchant>>> => {
    return await apiClient.get('/merchants', params);
  },

  getMerchant: async (id: string): Promise<ApiResponse<Merchant>> => {
    return await apiClient.get(`/merchants/${id}`);
  },

  createMerchant: async (data: {
    name: string;
    email: string;
    address: string;
  }): Promise<ApiResponse<Merchant>> => {
    return await apiClient.post('/merchants', data);
  },

  updateMerchant: async (
    id: string,
    data: Partial<Merchant>
  ): Promise<ApiResponse<Merchant>> => {
    return await apiClient.put(`/merchants/${id}`, data);
  },

  verifyMerchant: async (id: string): Promise<ApiResponse<void>> => {
    return await apiClient.post(`/merchants/${id}/verify`);
  },

  deleteMerchant: async (id: string): Promise<ApiResponse<void>> => {
    return await apiClient.delete(`/merchants/${id}`);
  }
};