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
    processVideo,
    checkJobStatus,
    deleteJob,
    downloadVideo,
    clearError,
  } = useJob();

  const [activeTab, setActiveTab] = useState("upload");
  const [prompt, setPrompt] = useState("");
  const [statusPolling, setStatusPolling] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-switch tabs based on job state
  useEffect(() => {
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
  }, [currentJob]);

  // Status polling for active jobs
  useEffect(() => {
    if (currentJob && currentJob.status === "processing") {
      const pollInterval = setInterval(async () => {
        try {
          await checkJobStatus(currentJob.job_id);
        } catch (error) {
          console.error("Status polling error:", error);
        }
      }, 2000); // Poll every 2 seconds

      setStatusPolling(pollInterval);

      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      };
    } else if (statusPolling) {
      clearInterval(statusPolling);
      setStatusPolling(null);
    }
  }, [currentJob, checkJobStatus]);

  // Handle video processing
  const handleProcessVideo = async () => {
    if (!currentJob || !prompt.trim()) {
      toast.error("Please provide processing instructions");
      return;
    }

    try {
      await processVideo(currentJob.job_id, prompt.trim());
      setActiveTab("status");
    } catch (error) {
      console.error("Processing error:", error);
    }
  };

  // Handle job deletion
  const handleDeleteJob = async () => {
    if (!currentJob) return;

    try {
      await deleteJob(currentJob.job_id);
      setPrompt("");
      setActiveTab("upload");
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

    switch (tabId) {
      case "upload":
        return "completed";
      case "prompt":
        if (currentJob.prompt) return "completed";
        if (currentJob.status === "pending") return "active";
        return "disabled";
      case "status":
        if (
          currentJob.status === "processing" ||
          currentJob.status === "completed" ||
          currentJob.status === "failed"
        ) {
          return "active";
        }
        return currentJob.prompt ? "ready" : "disabled";
      default:
        return "disabled";
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            AI Video Processing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
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

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Processing Panel */}
          <div className="lg:col-span-8">
            {/* Progress Tabs */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Processing Steps
                </h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="btn-ghost flex items-center space-x-2"
                >
                  <History className="w-4 h-4" />
                  <span>History</span>
                </button>
              </div>

              <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide pb-4">
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
                          }
                        }}
                        disabled={status === "disabled"}
                        className={`relative flex items-center space-x-3 px-6 py-4 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
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
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <Icon
                              className={`w-5 h-5 ${
                                isActive ? "text-white" : ""
                              }`}
                            />
                          )}
                        </div>

                        <div className="text-left">
                          <div className="font-semibold">{tab.name}</div>
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
                          className={`w-8 h-0.5 ${
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === "upload" && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8"
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
                    className="p-8"
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
                    className="p-8"
                  >
                    <ProcessingStatus
                      job={currentJob}
                      onDownload={handleDownloadVideo}
                      onDelete={handleDeleteJob}
                      onRetry={() => setActiveTab("prompt")}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Current Job Info */}
            {currentJob && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileVideo className="w-5 h-5 mr-2 text-primary-600" />
                  Current Job
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Video</div>
                    <div className="font-medium text-gray-900 truncate">
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
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="text-sm font-medium">
                          {currentJob.video_metadata.duration
                            ? `${Math.round(
                                currentJob.video_metadata.duration
                              )}s`
                            : "Unknown"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Resolution</div>
                        <div className="text-sm font-medium">
                          {currentJob.video_metadata.width}x
                          {currentJob.video_metadata.height}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Video Preview */}
            {currentJob && <VideoPreview job={currentJob} />}

            {/* Quick Actions */}
            {currentJob && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
                  Quick Actions
                </h3>

                <div className="space-y-3">
                  {currentJob.status === "completed" && (
                    <button
                      onClick={handleDownloadVideo}
                      className="w-full btn-success flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Video</span>
                    </button>
                  )}

                  {currentJob.status === "failed" && (
                    <button
                      onClick={() => setActiveTab("prompt")}
                      className="w-full btn-primary flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Try Again</span>
                    </button>
                  )}

                  {currentJob.status !== "processing" && (
                    <button
                      onClick={handleDeleteJob}
                      className="w-full btn-danger flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Job</span>
                    </button>
                  )}
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
