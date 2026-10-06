import { api } from "./api";

export const schoolService = {
  getSchools: async () => {
    const response = await api.get("/schools");
    return response.data;
  },

  getFaculties: async (schoolId?: string) => {
    const response = await api.get("/faculties", {
      params: {
        schoolId,
      },
    });

    return response.data;
  },

  getDepartments: async (facultyId?: string) => {
    const response = await api.get("/departments", {
      params: {
        facultyId,
      },
    });

    return response.data;
  },
};