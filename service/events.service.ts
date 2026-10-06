import { api } from "./api";

export type EventCategory =
  | 'All'
  | 'Academic'
  | 'Social'
  | 'Sports'
  | 'Arts'
  | 'Professional';

export interface Event {
  id: string;
  creatorId: string;
  schoolId: string;
  title: string;
  description: string;
  coverImage?: string;
  date: string;
  time: string;
  location: string;
  category: EventCategory;
  isFeatured?: boolean;
  isPast?: boolean;
  goingCount?: number;
  interestedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: EventCategory;
  isFeatured?: boolean;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const EventsApi = {
  findAll: async (
    category?: EventCategory,
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Event>> => {
    const { data } = await api.get("/events", {
      params: {
        ...(category && category !== "All" ? { category } : {}),
        page: pagination.page,
        limit: pagination.limit,
      },
    });
    return data;
  },

  findUpcoming: async (
    category?: EventCategory,
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Event>> => {
    const { data } = await api.get("/events/upcoming", {
      params: {
        ...(category && category !== "All" ? { category } : {}),
        page: pagination.page,
        limit: pagination.limit,
      },
    });
    return data;
  },

  findPast: async (
    category?: EventCategory,
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Event>> => {
    const { data } = await api.get("/events/past", {
      params: {
        ...(category && category !== "All" ? { category } : {}),
        page: pagination.page,
        limit: pagination.limit,
      },
    });
    return data;
  },

  getDetail: async (id: string): Promise<Event> => {
    const { data } = await api.get(`/events/${id}`);
    return data;
  },

  createEvent: async (
    payload: CreateEventPayload,
    coverImage?: ImageFile
  ): Promise<Event> => {
    if (coverImage) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined) formData.append(key, String(val));
      });
      formData.append("image", {
        uri: coverImage.uri,
        name: coverImage.name || "cover.jpg",
        type: coverImage.type || "image/jpeg",
      } as any);

      const { data } = await api.post("/events", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    }

    const { data } = await api.post("/events", payload);
    return data;
  },

  updateEvent: async (
    id: string,
    payload: UpdateEventPayload,
    coverImage?: ImageFile
  ): Promise<Event> => {
    if (coverImage) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined) formData.append(key, String(val));
      });
      formData.append("image", {
        uri: coverImage.uri,
        name: coverImage.name || "cover.jpg",
        type: coverImage.type || "image/jpeg",
      } as any);

      const { data } = await api.patch(`/events/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    }

    const { data } = await api.patch(`/events/${id}`, payload);
    return data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  toggleRsvp: async (id: string): Promise<Event> => {
    const { data } = await api.patch(`/events/${id}/rsvp`);
    return data;
  },
};
