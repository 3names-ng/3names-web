import { api } from "./api";

export interface Job {
  id: string;
  title: string;
  description?: string;
  company: string;
  companyLogo?: string;
  location?: string;
  type: string;
  salary?: string;
  requirements?: string[];
  benefits?: string[];
  contactEmail?: string;
  contactPhone?: string;
  status: string;
  applicationsCount: number;
  postedById: string;
  postedBy?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  coverLetter?: string;
  resumeUrl?: string;
  status: string;
  createdAt: string;
  job?: Job;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}

export interface JobsResponse {
  items: Job[];
  total: number;
  page: number;
  totalPages: number;
}

export const jobsService = {
  /** List jobs with optional filters */
  listJobs: async (params: {
    q?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<JobsResponse> => {
    const response = await api.get<JobsResponse>("/jobs", { params });
    return response.data;
  },

  /** Get a single job by ID */
  getJob: async (id: string): Promise<Job> => {
    const response = await api.get<Job>(`/jobs/${id}`);
    return response.data;
  },

  /** Post a new job */
  createJob: async (data: Partial<Job>): Promise<Job> => {
    const response = await api.post<Job>("/jobs", data);
    return response.data;
  },

  /** Update a job */
  updateJob: async (id: string, data: Partial<Job>): Promise<Job> => {
    const response = await api.put<Job>(`/jobs/${id}`, data);
    return response.data;
  },

  /** Delete a job */
  deleteJob: async (id: string): Promise<void> => {
    await api.delete(`/jobs/${id}`);
  },

  /** Apply to a job */
  applyToJob: async (
    jobId: string,
    data: { coverLetter?: string; resumeUrl?: string }
  ): Promise<JobApplication> => {
    const response = await api.post<JobApplication>(`/jobs/${jobId}/apply`, data);
    return response.data;
  },

  /** Get applications for a job (poster only) */
  getApplications: async (jobId: string): Promise<JobApplication[]> => {
    const response = await api.get<JobApplication[]>(`/jobs/${jobId}/applications`);
    return response.data;
  },

  /** Update application status */
  updateApplicationStatus: async (
    appId: string,
    status: string
  ): Promise<JobApplication> => {
    const response = await api.put<JobApplication>(`/jobs/applications/${appId}/status`, { status });
    return response.data;
  },

  /** Get my posted jobs */
  myPostings: async (): Promise<Job[]> => {
    const response = await api.get<Job[]>("/jobs/my-postings");
    return response.data;
  },

  /** Get my applications */
  myApplications: async (): Promise<JobApplication[]> => {
    const response = await api.get<JobApplication[]>("/jobs/my-applications");
    return response.data;
  },
};
