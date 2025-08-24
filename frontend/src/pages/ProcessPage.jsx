import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Play,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  AlertTriangle,
  FileVideo,
  Sparkles,
  Wand2,
  ArrowRight,
  BarChart3,
  Settings,
  Eye,
  History,
} from "lucide-react";
import { useJob } from "../context/JobContext";
import toast from "react-hot-toast";

// Components
import VideoUpload from "../components/VideoUpload";
import PromptInput from "../components/PromptInput";
import ProcessingStatus from "../components/ProcessingStatus";
import VideoPreview from "../components/VideoPreview";
import JobHistory from "../components/JobHistory";

const ProcessPage = () => {
  const {
    currentJob,
    loading,
    error,
    submitPrompt,
    forceStatusUpdate,
    processVideo,
    checkJobStatus,
    deleteJob,
    downloadVideo,
    clearError,
  } = useJob();

  // Debug current job state
  console.log("🎬 ProcessPage currentJob:", currentJob);

  const [activeTab, setActiveTab] = useState("upload");
  const [prompt, setPrompt] = useState("");
  const [statusPolling, setStatusPolling] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [manualTabSwitch, setManualTabSwitch] = useState(false);

  // Auto-switch tabs based on job state (but respect manual switches)
  useEffect(() => {
    // Don't auto-switch if user manually switched tabs
    if (manualTabSwitch) return;

    if (currentJob) {
      if (currentJob.status === "pending" && !currentJob.prompt) {
        setActiveTab("prompt");
      } else if (
        currentJob.status === "processing" ||
        currentJob.status === "completed"
      ) {
        setActiveTab("status");
      }
    } else {
      setActiveTab("upload");
    }
  }, [currentJob, manualTabSwitch]);

  // Reset manual tab switch when job changes (new upload)
  useEffect(() => {
    if (currentJob && currentJob.status === "pending" && !currentJob.prompt) {
      setManualTabSwitch(false); // Allow auto-switching for new jobs
    }
  }, [currentJob?.job_id]); // Only trigger when job_id changes (new job)

  // Only check status when job might be completed (no more continuous polling)
  useEffect(() => {
    console.log(
      "🔄 Polling effect triggered - currentJob status:",
      currentJob?.status
    );
    if (currentJob && currentJob.status === "processing") {
      console.log("⏰ Starting status polling for job:", currentJob.job_id);
      // Set a longer interval to just check if processing is complete
      const checkInterval = setInterval(async () => {
        try {
          console.log("📡 Polling: Checking job status...");
          const status = await checkJobStatus(currentJob.job_id);
          console.log("📊 Polling: Got status:", status.status);
          // Only stop polling if job is no longer processing
          if (status.status !== "processing") {
            console.log("🏁 Polling: Job completed, stopping polling");
            clearInterval(checkInterval);
            setStatusPolling(null);
          }
        } catch (error) {
          console.error("Status check error:", error);
        }
      }, 5000); // Check every 5 seconds (less frequent)

      setStatusPolling(checkInterval);

      return () => {
        if (checkInterval) {
          clearInterval(checkInterval);
        }
      };
    } else if (statusPolling) {
      console.log("🚫 Polling: Clearing existing polling");
      clearInterval(statusPolling);
      setStatusPolling(null);
    }
  }, [currentJob, checkJobStatus]);

  // Handle video processing - NEW TWO PHASE APPROACH
  const handleProcessVideo = async () => {
    if (!currentJob || !prompt.trim()) {
      toast.error("Please provide processing instructions");
      return;
    }

    try {
      console.log("🚀 Starting processing for job:", currentJob.job_id);
      console.log("📝 Prompt:", prompt.trim());

      // PHASE 1: Submit prompt (immediate UI update)
      console.log("📝 Phase 1: Submitting prompt for UI update");
      const updatedJob = submitPrompt(currentJob.job_id, prompt.trim());

      // Give a brief moment for the UI to show describe tab as completed
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Switch to monitor tab
      console.log("🎯 Switching to status tab - prompt submitted");
      setActiveTab("status");
      setManualTabSwitch(true);

      // PHASE 2: Start actual backend processing (no delay)
      console.log("🔄 Phase 2: Starting backend processing immediately");

      // FORCE immediate UI update to "processing" before API call
      console.log("⚡ FORCING immediate status to 'processing' for better UX");
      const forceProcessingState = {
        ...currentJob,
        status: "processing",
        message: "AI processing started - sit back and relax!",
        prompt: prompt.trim(),
      };

      // Force immediate UI update
      forceStatusUpdate(forceProcessingState);

      // Give UI time to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await processVideo(currentJob.job_id, prompt.trim());

      console.log("✅ Process response:", result);
      console.log("📊 Result status:", result.status);
      console.log("🎯 Expected: processing, Actual:", result.status);
    } catch (error) {
      console.error("❌ Processing error:", error);
      setManualTabSwitch(false);
    }
  };

  // Handle job deletion
  const handleDeleteJob = async () => {
    if (!currentJob) return;

    try {
      await deleteJob(currentJob.job_id);
      setPrompt("");
      setActiveTab("upload");
      setManualTabSwitch(false); // Reset manual switch when job is deleted
      toast.success("Job deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Handle video download
  const handleDownloadVideo = async () => {
    if (!currentJob || currentJob.status !== "completed") return;

    try {
      const filename = `${
        currentJob.video_metadata.filename.split(".")[0]
      }_processed.mp4`;
      await downloadVideo(currentJob.job_id, filename);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const tabs = [
    {
      id: "upload",
      name: "Upload",
      icon: Upload,
      description: "Select your video file",
    },
    {
      id: "prompt",
      name: "Describe",
      icon: Wand2,
      description: "Tell us what you want",
    },
    {
      id: "status",
      name: "Process",
      icon: Settings,
      description: "Monitor progress",
    },
  ];

  const getTabStatus = (tabId) => {
    if (!currentJob) {
      return tabId === "upload" ? "active" : "disabled";
    }

    console.log("🎯 getTabStatus for", tabId, "- Job:", {
      status: currentJob.status,
      hasPrompt: !!currentJob.prompt,
      prompt: currentJob.prompt,
    });

    switch (tabId) {
      case "upload":
        return "completed";
      case "prompt":
        if (currentJob.prompt) {
          console.log(
            "✅ Prompt tab should show completed - has prompt:",
            currentJob.prompt
          );
          return "completed";
        }
        if (currentJob.status === "pending") return "active";
        return "disabled";
      case "status":
        if (
          currentJob.status === "processing" ||
          currentJob.status === "completed" ||
          currentJob.status === "failed"
        ) {
          console.log(
            "✅ Status tab should show active - status:",
            currentJob.status
          );
          return "active";
        }
        return currentJob.prompt ? "ready" : "disabled";
      default:
        return "disabled";
    }
  };

  return (
    <div className="min-h-screen pt-4 sm:pt-8 pb-8 sm:pb-16 px-2 sm:px-0">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 w-full overflow-hidden">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12 px-2">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
          >
            AI Video Processing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4"
          >
            Transform your videos with the power of AI. Upload, describe your
            vision, and let our intelligent system create magic.
          </motion.p>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <div className="bg-error-50 border border-error-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-error-800 font-medium">
                    Processing Error
                  </h3>
                  <p className="text-error-700 text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-error-600 hover:text-error-800 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 w-full max-w-full">
          {/* Main Processing Panel */}
          <div className="w-full lg:col-span-8 order-1 lg:order-none overflow-hidden">
            {/* Progress Tabs */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Processing Steps
                </h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="btn-ghost flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base px-2 sm:px-3"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </button>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 overflow-x-auto scrollbar-hide pb-4">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const status = getTabStatus(tab.id);
                  const isActive = activeTab === tab.id;

                  return (
                    <React.Fragment key={tab.id}>
                      <button
                        onClick={() => {
                          if (status !== "disabled") {
                            setActiveTab(tab.id);
                            setManualTabSwitch(true);
                          }
                        }}
                        disabled={status === "disabled"}
                        className={`relative flex items-center space-x-1 sm:space-x-2 lg:space-x-3 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl font-medium transition-all duration-200 whitespace-nowrap text-xs sm:text-sm lg:text-base ${
                          isActive
                            ? "bg-primary-600 text-white shadow-lg"
                            : status === "completed"
                            ? "bg-success-100 text-success-700 hover:bg-success-200"
                            : status === "ready"
                            ? "bg-warning-100 text-warning-700 hover:bg-warning-200"
                            : status === "disabled"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                            status === "completed"
                              ? "bg-success-600"
                              : status === "ready"
                              ? "bg-warning-600"
                              : isActive
                              ? "bg-white/20"
                              : "bg-transparent"
                          }`}
                        >
                          {status === "completed" ? (
                            <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                          ) : (
                            <Icon
                              className={`w-3 h-3 sm:w-5 sm:h-5 ${
                                isActive ? "text-white" : ""
                              }`}
                            />
                          )}
                        </div>

                        <div className="text-left hidden lg:block">
                          <div className="font-semibold text-sm">{tab.name}</div>
                          <div
                            className={`text-xs ${
                              isActive ? "text-white/80" : "text-gray-500"
                            }`}
                          >
                            {tab.description}
                          </div>
                        </div>
                      </button>

                      {/* Connector */}
                      {index < tabs.length - 1 && (
                        <div
                          className={`w-2 sm:w-4 lg:w-8 h-0.5 ${
                            getTabStatus(tabs[index + 1].id) === "completed"
                              ? "bg-success-300"
                              : "bg-gray-300"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden w-full max-w-full">
              <AnimatePresence mode="wait">
                {activeTab === "upload" && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 sm:p-6 lg:p-8"
                  >
                    <VideoUpload />
                  </motion.div>
                )}

                {activeTab === "prompt" && (
                  <motion.div
                    key="prompt"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 sm:p-6 lg:p-8"
                  >
                    <PromptInput
                      prompt={prompt}
                      onPromptChange={setPrompt}
                      onProcess={handleProcessVideo}
                      loading={loading}
                      disabled={!currentJob || currentJob.status !== "pending"}
                    />
                  </motion.div>
                )}

                {activeTab === "status" && (
                  <motion.div
                    key="status"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 sm:p-6 lg:p-8"
                  >
                    <ProcessingStatus
                      job={currentJob}
                      onDownload={handleDownloadVideo}
                      onDelete={handleDeleteJob}
                      onRetry={() => {
                        setActiveTab("prompt");
                        setManualTabSwitch(true);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:col-span-4 space-y-4 lg:space-y-6 order-2 lg:order-none overflow-hidden">
            {/* Current Job Info */}
            {currentJob && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6 w-full max-w-full overflow-hidden"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileVideo className="w-5 h-5 mr-2 text-primary-600" />
                  Current Job
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Video</div>
                    <div className="font-medium text-gray-900 truncate text-sm sm:text-base break-all">
                      {currentJob.video_metadata?.filename || "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <div
                      className={`inline-flex items-center space-x-2 status-badge ${
                        currentJob.status === "pending"
                          ? "status-pending"
                          : currentJob.status === "processing"
                          ? "status-processing"
                          : currentJob.status === "completed"
                          ? "status-completed"
                          : "status-failed"
                      }`}
                    >
                      {currentJob.status === "processing" ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : currentJob.status === "completed" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : currentJob.status === "failed" ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span className="capitalize">{currentJob.status}</span>
                    </div>
                  </div>

                  {currentJob.progress > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Progress</div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${currentJob.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {currentJob.progress}%
                      </div>
                    </div>
                  )}

                  {currentJob.video_metadata && (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 border-t border-gray-100">
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="text-xs sm:text-sm font-medium truncate">
                          {currentJob.video_metadata.duration
                            ? `${Math.round(
                                currentJob.video_metadata.duration
                              )}s`
                            : "Unknown"}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">Resolution</div>
                        <div className="text-xs sm:text-sm font-medium truncate">
                          {currentJob.video_metadata.width}×{currentJob.video_metadata.height}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Video Preview */}
            {currentJob && <VideoPreview job={currentJob} />}

            {/* Results Disclaimer */}
            {currentJob && currentJob.status === "completed" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-lg border border-blue-100 p-6"
              >
                <div>
                  <div className="w-full">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                      Important: About Your Results
                    </h4>
                    <div className="text-gray-700 space-y-2 mb-4">
                      <p className="text-sm leading-relaxed">
                        <strong>This is not generative editing.</strong>{" "}
                        VisualiX uses traditional computer vision and image
                        processing techniques guided by AI to transform your
                        original video content.
                      </p>
                      <p className="text-sm leading-relaxed text-gray-600">
                        Results are based on applying filters, effects, and
                        transformations to your existing footage. The output may
                        differ from your expectations as AI interpretation can
                        vary.
                      </p>
                    </div>

                    {/* Key Points */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Original content preserved</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        <span>AI-guided processing</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Non-generative approach</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                        <span>Results may vary</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Job History Modal */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowHistory(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              >
                <JobHistory onClose={() => setShowHistory(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProcessPage;
