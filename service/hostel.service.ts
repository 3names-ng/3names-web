import { api } from "./api";

export interface CreateHostelFormPayload {
  hostelName?: string;
  title?: string;
  description?: string;
  address?: string;
  location?: string;
  city?: string;
  state?: string;
  school?: string;
  monthlyRent?: string | number;
  price?: string | number;
  serviceCharge?: string | number;
  cautionFee?: string | number;
  roomType?: string;
  gender?: string;
  capacity?: string | number;
  availableRooms?: string | number;
  bedrooms?: string;
  bathrooms?: string;
  amenities?: string[];
  curfew?: string;
  visitorsAllowed?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  lookingForRoommate?: boolean;
  contactName?: string;
  phoneNumber?: string;
  contactPhone?: string;
  whatsapp?: string;
  email?: string;
  contactEmail?: string;
  photos?: string[];
  status?: string;
  isAvailable?: boolean;
}

export type UpdateHostelFormPayload = Partial<CreateHostelFormPayload>;

/**
 * Helper to construct FormData from JSON payload & images
 */
function buildHostelFormData(payload: CreateHostelFormPayload): FormData {
  const formData = new FormData();

  if (payload.photos) {
    payload.photos.forEach((photoUri, index) => {
      // If it's a remote URL (Cloudinary), send as imageUrls
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

  // Append remaining fields
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "photos") return;

    // Direct mapping fallback for backend field names
    let fieldKey = key;
    if (key === "hostelName") fieldKey = "hostelName";
    if (key === "phoneNumber") fieldKey = "contactPhone";
    if (key === "email") fieldKey = "contactEmail";
    if (key === "monthlyRent" && !payload.price) fieldKey = "price";

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(`${fieldKey}[]`, item));
    } else if (value !== undefined && value !== null) {
      formData.append(fieldKey, String(value));
    }
  });

  return formData;
}

export const hostelService = {
  /**
   * POST /hostels - Create a hostel listing with images
   */
  async createHostel(payload: CreateHostelFormPayload) {
    const formData = buildHostelFormData(payload);
    const response = await api.post("/hostels", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * GET /hostels - List all hostel listings for the user's current school
   */
  async getAllHostels() {
    const response = await api.get("/hostels");
    return response.data;
  },

  /**
   * GET /hostels/:id - Get hostel listing by ID
   */
  async getHostelById(id: string) {
    const response = await api.get(`/hostels/${id}`);
    return response.data;
  },

  /**
   * GET /hostels/my-listings - List my own listings, regardless of moderation status
   */
  async getMyListings() {
    const response = await api.get("/hostels/my-listings");
    return response.data;
  },

  /**
   * PATCH /hostels/:id - Update hostel listing
   */
  async updateHostel(id: string, payload: UpdateHostelFormPayload) {
    const formData = buildHostelFormData(payload);
    const response = await api.patch(`/hostels/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * PATCH /hostels/:id/taken - Mark hostel listing as taken
   */
  async markAsTaken(id: string) {
    const response = await api.patch(`/hostels/${id}/taken`);
    return response.data;
  },

  /**
   * PATCH /hostels/:id/available - Mark hostel listing as available
   */
  async markAsAvailable(id: string) {
    const response = await api.patch(`/hostels/${id}/available`);
    return response.data;
  },

  /**
   * PATCH /hostels/:id/unavailable - Mark hostel listing as unavailable
   */
  async markAsUnavailable(id: string) {
    const response = await api.patch(`/hostels/${id}/unavailable`);
    return response.data;
  },

  /**
   * GET /hostels/:id/contact - Get seller contact details
   */
  async getContactInfo(id: string) {
    const response = await api.get(`/hostels/${id}/contact`);
    return response.data;
  },

  /**
   * PATCH /hostels/:id/like - Toggle like/unlike status
   */
  async toggleLike(id: string) {
    const response = await api.patch(`/hostels/${id}/like`);
    return response.data;
  },

  /**
   * DELETE /hostels/:id - Delete hostel listing
   */
  async deleteHostel(id: string) {
    const response = await api.delete(`/hostels/${id}`);
    return response.data;
  },
};