import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { apiService } from "../services/api";
import toast from "react-hot-toast";

// Job Context
const JobContext = createContext();

// Action types
const JobActions = {
  SET_CURRENT_JOB: "SET_CURRENT_JOB",
  UPDATE_JOB_STATUS: "UPDATE_JOB_STATUS",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  ADD_TO_HISTORY: "ADD_TO_HISTORY",
  REMOVE_FROM_HISTORY: "REMOVE_FROM_HISTORY",
  CLEAR_CURRENT_JOB: "CLEAR_CURRENT_JOB",
  SET_SUPPORTED_FORMATS: "SET_SUPPORTED_FORMATS",
};

// Initial state
const initialState = {
  currentJob: null,
  jobHistory: [],
  loading: false,
  error: null,
  supportedFormats: {
    supported_formats: ["mp4", "avi", "mov", "mkv", "webm"],
    max_file_size: 104857600,
    max_file_size_mb: 100,
  },
};

// Reducer
function jobReducer(state, action) {
  switch (action.type) {
    case JobActions.SET_CURRENT_JOB:
      return {
        ...state,
        currentJob: action.payload,
        error: null,
      };

    case JobActions.UPDATE_JOB_STATUS:
      console.log("🔄 REDUCER: UPDATE_JOB_STATUS called with:", action.payload);
      if (
        !state.currentJob ||
        state.currentJob.job_id !== action.payload.job_id
      ) {
        console.log("🚫 REDUCER: No current job or job ID mismatch");
        return state;
      }

      const newState = {
        ...state,
        currentJob: {
          ...state.currentJob,
          ...action.payload,
        },
      };
      console.log(
        "✅ REDUCER: Updated job status to:",
        newState.currentJob.status
      );
      return newState;

    case JobActions.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case JobActions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case JobActions.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case JobActions.ADD_TO_HISTORY:
      const existingIndex = state.jobHistory.findIndex(
        (job) => job.job_id === action.payload.job_id
      );

      if (existingIndex >= 0) {
        const updatedHistory = [...state.jobHistory];
        updatedHistory[existingIndex] = action.payload;
        return {
          ...state,
          jobHistory: updatedHistory,
        };
      }

      return {
        ...state,
        jobHistory: [action.payload, ...state.jobHistory.slice(0, 9)], // Keep last 10
      };

    case JobActions.REMOVE_FROM_HISTORY:
      return {
        ...state,
        jobHistory: state.jobHistory.filter(
          (job) => job.job_id !== action.payload
        ),
      };

    case JobActions.CLEAR_CURRENT_JOB:
      return {
        ...state,
        currentJob: null,
        error: null,
      };

    case JobActions.SET_SUPPORTED_FORMATS:
      return {
        ...state,
        supportedFormats: action.payload,
      };

    default:
      return state;
  }
}

// Provider component
export function JobProvider({ children }) {
  const [state, dispatch] = useReducer(jobReducer, initialState);

  // Load supported formats on mount
  useEffect(() => {
    const loadSupportedFormats = async () => {
      try {
        const formats = await apiService.getSupportedFormats();
        dispatch({ type: JobActions.SET_SUPPORTED_FORMATS, payload: formats });
      } catch (error) {
        console.error("Failed to load supported formats:", error);
      }
    };

    loadSupportedFormats();
  }, []);

  // Upload video file
  const uploadVideo = useCallback(async (file, description = "") => {
    dispatch({ type: JobActions.SET_LOADING, payload: true });
    dispatch({ type: JobActions.CLEAR_ERROR });

    try {
      const result = await apiService.uploadVideo(file, description);

      const jobData = {
        job_id: result.job_id,
        status: "pending",
        progress: 0,
        message: result.message,
        video_metadata: result.video_metadata,
        created_at: new Date().toISOString(),
        prompt: null,
        workflow_execution: null,
        output_url: null,
        error: null,
      };

      dispatch({ type: JobActions.SET_CURRENT_JOB, payload: jobData });
      dispatch({ type: JobActions.ADD_TO_HISTORY, payload: jobData });

      toast.success("Video uploaded successfully!");
      return result;
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Upload failed";
      dispatch({ type: JobActions.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: JobActions.SET_LOADING, payload: false });
    }
  }, []);

  // Submit prompt and prepare for processing (UI-first approach)
  const submitPrompt = useCallback(
    (jobId, prompt) => {
      console.log("📝 Submitting prompt:", { jobId, prompt });

      // Immediately update job state with prompt (UI-first)
      // Don't change status - keep current status to avoid confusion
      const updatedJob = {
        ...state.currentJob,
        prompt: prompt,
        message: "Preparing to process...",
        // Keep current status - don't set back to pending
      };

      console.log("🔄 Updating job with prompt:", updatedJob);
      dispatch({ type: JobActions.UPDATE_JOB_STATUS, payload: updatedJob });
      dispatch({ type: JobActions.ADD_TO_HISTORY, payload: updatedJob });

      console.log("✅ Prompt submitted successfully");
      return updatedJob;
    },
    [state.currentJob]
  );

  // Force immediate status update (for UX responsiveness)
  const forceStatusUpdate = useCallback((jobUpdate) => {
    console.log("⚡ FORCING immediate status update:", jobUpdate);
    dispatch({ type: JobActions.UPDATE_JOB_STATUS, payload: jobUpdate });
    dispatch({ type: JobActions.ADD_TO_HISTORY, payload: jobUpdate });
  }, []);

  // Start video processing (backend call)
  const processVideo = useCallback(
    async (jobId, prompt) => {
      dispatch({ type: JobActions.SET_LOADING, payload: true });
      dispatch({ type: JobActions.CLEAR_ERROR });

      try {
        console.log("🔄 Calling API processVideo:", { jobId, prompt });

        const result = await apiService.processVideo(jobId, prompt);

        console.log("📡 API Response:", result);

        // Update job with backend response
        const updatedJob = {
          ...state.currentJob,
          job_id: result.job_id || jobId,
          status: result.status || "processing",
          progress: result.progress || 0,
          message: result.message || "Processing started",
          prompt: prompt, // Ensure prompt is preserved
          workflow_execution: result.workflow_execution || null,
          output_url: result.output_url || null,
          error: result.error || null,
        };

        console.log("🔄 Updating job state:", updatedJob);
        console.log("🚀 IMMEDIATE STATUS UPDATE:", updatedJob.status);

        dispatch({ type: JobActions.UPDATE_JOB_STATUS, payload: updatedJob });
        dispatch({ type: JobActions.ADD_TO_HISTORY, payload: updatedJob });

        console.log(
          "✅ Job state updated successfully - Status should now be:",
          updatedJob.status
        );
        toast.success("Processing started!");
        return result;
      } catch (error) {
        console.error("❌ Process error:", error);
        const errorMessage =
          error.response?.data?.detail || error.message || "Processing failed";
        dispatch({ type: JobActions.SET_ERROR, payload: errorMessage });
        toast.error(errorMessage);
        throw error;
      } finally {
        dispatch({ type: JobActions.SET_LOADING, payload: false });
      }
    },
    [state.currentJob]
  );

  // Check job status
  const checkJobStatus = useCallback(
    async (jobId) => {
      try {
        const status = await apiService.getJobStatus(jobId);

        if (state.currentJob && state.currentJob.job_id === jobId) {
          dispatch({ type: JobActions.UPDATE_JOB_STATUS, payload: status });
        }

        dispatch({ type: JobActions.ADD_TO_HISTORY, payload: status });
        return status;
      } catch (error) {
        console.error("Failed to check job status:", error);
        throw error;
      }
    },
    [state.currentJob]
  );

  // Delete job
  const deleteJob = useCallback(
    async (jobId) => {
      try {
        await apiService.deleteJob(jobId);

        if (state.currentJob && state.currentJob.job_id === jobId) {
          dispatch({ type: JobActions.CLEAR_CURRENT_JOB });
        }

        dispatch({ type: JobActions.REMOVE_FROM_HISTORY, payload: jobId });
        toast.success("Job deleted successfully");
      } catch (error) {
        const errorMessage =
          error.response?.data?.detail || error.message || "Delete failed";
        toast.error(errorMessage);
        throw error;
      }
    },
    [state.currentJob]
  );

  // Download processed video
  const downloadVideo = useCallback(async (jobId, filename) => {
    try {
      await apiService.downloadVideo(jobId, filename);
      toast.success("Download started!");
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Download failed";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Set current job (for switching between jobs)
  const setCurrentJob = useCallback((job) => {
    dispatch({ type: JobActions.SET_CURRENT_JOB, payload: job });
  }, []);

  // Clear current job
  const clearCurrentJob = useCallback(() => {
    dispatch({ type: JobActions.CLEAR_CURRENT_JOB });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: JobActions.CLEAR_ERROR });
  }, []);

  const value = {
    // State
    currentJob: state.currentJob,
    jobHistory: state.jobHistory,
    loading: state.loading,
    error: state.error,
    supportedFormats: state.supportedFormats,

    // Actions
    uploadVideo,
    submitPrompt,
    forceStatusUpdate,
    processVideo,
    checkJobStatus,
    deleteJob,
    downloadVideo,
    setCurrentJob,
    clearCurrentJob,
    clearError,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

// Hook to use job context
export function useJob() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error("useJob must be used within a JobProvider");
  }
  return context;
}
