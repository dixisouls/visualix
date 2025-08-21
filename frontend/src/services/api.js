import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1",
  timeout: 300000, // 5 minutes for video processing
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(
      "Response error:",
      error.response?.status,
      error.response?.data
    );

    if (error.response?.status === 413) {
      error.message = "File is too large. Please choose a smaller video file.";
    } else if (error.response?.status === 400) {
      error.message = error.response.data?.detail || "Bad request";
    } else if (error.response?.status === 404) {
      error.message = "Video or job not found";
    } else if (error.response?.status === 500) {
      error.message = "Server error. Please try again later.";
    } else if (error.code === "ECONNABORTED") {
      error.message = "Request timeout. Please try again.";
    } else if (!error.response) {
      error.message = "Network error. Please check your connection.";
    }

    return Promise.reject(error);
  }
);

export const apiService = {
  // Video endpoints
  async uploadVideo(file, description = "") {
    const formData = new FormData();
    formData.append("file", file);
    if (description) {
      formData.append("description", description);
    }

    const response = await api.post("/video/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      },
    });

    return response.data;
  },

  async processVideo(jobId, prompt) {
    console.log("🌐 API: Calling processVideo with:", { jobId, prompt });
    const startTime = Date.now();

    const response = await api.post("/video/process", {
      job_id: jobId,
      prompt: prompt,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log("📡 API: processVideo response:", response.data);
    console.log("🔍 API: Response status:", response.data.status);
    console.log("⏱️ API: Call duration:", duration + "ms");

    if (duration > 5000) {
      console.warn(
        "⚠️ API: processVideo took longer than 5 seconds - this might be the issue!"
      );
    }

    return response.data;
  },

  async downloadVideo(jobId, filename = "processed_video.mp4") {
    const response = await api.get(`/video/result/${jobId}`, {
      responseType: "blob",
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  },

  async deleteJob(jobId) {
    const response = await api.delete(`/video/upload/${jobId}`);
    return response.data;
  },

  async getSupportedFormats() {
    const response = await api.get("/video/formats");
    return response.data;
  },

  // Cleanup endpoints
  async getCleanupStatus() {
    const response = await api.get("/cleanup/status");
    return response.data;
  },

  async triggerManualCleanup() {
    const response = await api.post("/cleanup/manual");
    return response.data;
  },

  async getCleanupInfo() {
    const response = await api.get("/cleanup/info");
    return response.data;
  },

  // Job management endpoints
  async getJobStatus(jobId) {
    const response = await api.get(`/jobs/status/${jobId}`);
    return response.data;
  },

  async listJobs(filters = {}) {
    const params = new URLSearchParams();

    if (filters.status) {
      params.append("status", filters.status);
    }
    if (filters.limit) {
      params.append("limit", filters.limit);
    }
    if (filters.offset) {
      params.append("offset", filters.offset);
    }

    const response = await api.get(`/jobs/?${params.toString()}`);
    return response.data;
  },

  // Health check
  async healthCheck() {
    try {
      const response = await api.get("/health");
      return response.data;
    } catch (error) {
      console.error("Health check failed:", error);
      throw error;
    }
  },

  // Utility methods
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  formatDuration(seconds) {
    if (!seconds) return "Unknown";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }
  },

  isValidVideoFile(
    file,
    supportedFormats = ["mp4", "avi", "mov", "mkv", "webm"]
  ) {
    if (!file) return { valid: false, error: "No file provided" };

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension) {
      return { valid: false, error: "File has no extension" };
    }

    if (!supportedFormats.includes(extension)) {
      return {
        valid: false,
        error: `Unsupported format. Supported: ${supportedFormats.join(", ")}`,
      };
    }

    return { valid: true };
  },

  getStatusColor(status) {
    const statusColors = {
      pending: "text-warning-600 bg-warning-100",
      processing: "text-primary-600 bg-primary-100",
      completed: "text-success-600 bg-success-100",
      failed: "text-error-600 bg-error-100",
    };

    return statusColors[status] || "text-gray-600 bg-gray-100";
  },

  getStatusIcon(status) {
    const icons = {
      pending: "Clock",
      processing: "Loader",
      completed: "CheckCircle",
      failed: "XCircle",
    };

    return icons[status] || "HelpCircle";
  },
};

export default apiService;
