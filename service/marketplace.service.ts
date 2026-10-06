import { api } from "./api";

export interface CreateMarketplaceFormPayload {
  title?: string;
  category?: string;
  condition?: string;
  description?: string;
  price?: string | number;
  isNegotiable?: boolean;
  discountPrice?: string | number;
  brand?: string;
  model?: string;
  quantity?: string | number;
  location?: string;
  phone?: string;
  whatsApp?: string;
  preferredContact?: "Chat" | "Call" | "WhatsApp";
  photos?: string[];
  status?: string;
  isAvailable?: boolean;
}

export type UpdateMarketplaceFormPayload = Partial<CreateMarketplaceFormPayload>;

/**
 * Helper to construct FormData from JSON payload & images for marketplace items
 */
function buildMarketplaceFormData(payload: CreateMarketplaceFormPayload): FormData {
  const formData = new FormData();

  if (payload.photos) {
    payload.photos.forEach((photoUri, index) => {
      // Remote URLs (e.g. Cloudinary) -> send as imageUrls
      if (photoUri.startsWith("http://") || photoUri.startsWith("https://")) {
        formData.append("imageUrls[]", photoUri);
      } else {
        // Local file URI -> send to Multer under 'files'
        const fileExtension = photoUri.split(".").pop() || "jpg";
        const fileName = `photo_${Date.now()}_${index}.${fileExtension}`;

        formData.append("files", {
          uri: photoUri,
          name: fileName,
          type: `image/${fileExtension === "png" ? "png" : "jpeg"}`,
        } as any);
      }
    });
  }

  // Append remaining payload fields
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "photos") return;

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(`${key}[]`, item));
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return formData;
}

export const marketplaceService = {
  /**
   * POST /marketplace - Create a new marketplace item
   */
  async createItem(payload: CreateMarketplaceFormPayload) {
    const formData = buildMarketplaceFormData(payload);
    const response = await api.post("/marketplace", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
/**
 * GET /marketplace - List all items with pagination, search, and category filter
 */
async getAllItems(params?: { page?: number; limit?: number; search?: string; category?: string }) {
  const response = await api.get("/marketplace", { params });
  return response.data;
},
  /**
   * GET /marketplace/:id - Get marketplace item details by ID
   */
  async getItemById(id: string) {
    const response = await api.get(`/marketplace/${id}`);
    return response.data;
  },

  /**
   * GET /marketplace/my-listings - List my own items, regardless of moderation status
   */
  async getMyListings() {
    const response = await api.get("/marketplace/my-listings");
    return response.data;
  },

  /**
   * PATCH /marketplace/:id - Update marketplace item
   */
  async updateItem(id: string, payload: UpdateMarketplaceFormPayload) {
    const formData = buildMarketplaceFormData(payload);
    const response = await api.patch(`/marketplace/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * PATCH /marketplace/:id/sold - Mark item as sold
   */
  async markAsSold(id: string) {
    const response = await api.patch(`/marketplace/${id}/sold`);
    return response.data;
  },

  /**
   * PATCH /marketplace/:id/available - Mark item as available
   */
  async markAsAvailable(id: string) {
    const response = await api.patch(`/marketplace/${id}/available`);
    return response.data;
  },

  /**
   * PATCH /marketplace/:id/unavailable - Mark item as unavailable
   */
  async markAsUnavailable(id: string) {
    const response = await api.patch(`/marketplace/${id}/unavailable`);
    return response.data;
  },

  /**
   * GET /marketplace/:id/contact - Get seller contact information
   */
  async getContactInfo(id: string) {
    const response = await api.get(`/marketplace/${id}/contact`);
    return response.data;
  },

  /**
   * PATCH /marketplace/:id/like - Toggle like status on an item
   */
  async toggleLike(id: string) {
    const response = await api.patch(`/marketplace/${id}/like`);
    return response.data;
  },

  /**
   * DELETE /marketplace/:id - Delete item listing
   */
  async deleteItem(id: string) {
    const response = await api.delete(`/marketplace/${id}`);
    return response.data;
  },
};