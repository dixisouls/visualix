import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Settings,
  Sparkles,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { apiService } from "../services/api";

const ProcessingStatus = ({ job, onDownload, onDelete, onRetry }) => {
  const [progressBar, setProgressBar] = useState(0);

  // Debug logging
  console.log("🎬 ProcessingStatus received job:", job);
  console.log("🔍 Job status:", job?.status, "| Has prompt:", !!job?.prompt);

  // Handle progress bar animation
  useEffect(() => {
    if (job?.status === "processing") {
      // Start slow progress animation
      const interval = setInterval(() => {
        setProgressBar(prev => {
          // Slow progress that approaches but never reaches 100%
          if (prev < 90) {
            return prev + 0.3; // Very slow increment
          }
          return prev;
        });
      }, 200); // Update every 200ms

      return () => clearInterval(interval);
    } else if (job?.status === "completed") {
      // Instantly complete the progress bar
      setProgressBar(100);
    } else {
      // Reset progress bar for other states
      setProgressBar(0);
    }
  }, [job?.status]);

  if (!job) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          No Job Selected
        </h3>
        <p className="text-gray-600">
          Upload a video and provide processing instructions to get started.
        </p>
      </div>
    );
  }

  const getStatusInfo = () => {
    console.log(
      "🎯 ProcessingStatus getStatusInfo - status:",
      job.status,
      "prompt:",
      job.prompt
    );
    switch (job.status) {
      case "pending":
        // If job has prompt but status is pending, show "preparing" instead of "ready"
        if (job.prompt) {
          return {
            icon: Clock,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            title: "Preparing to Process",
            description: "Initializing AI processing pipeline...",
            actionable: false,
          };
        }
        return {
          icon: Clock,
          color: "text-warning-600",
          bgColor: "bg-warning-100",
          title: "Ready to Process",
          description: "Your video is uploaded and ready for AI processing.",
          actionable: true,
        };
      case "processing":
        return {
          icon: Loader,
          color: "text-primary-600",
          bgColor: "bg-primary-100",
          title: "AI Processing",
          description: "Sit back and relax while we work on your video!",
          actionable: false,
        };
      case "completed":
        return {
          icon: CheckCircle,
          color: "text-success-600",
          bgColor: "bg-success-100",
          title: "Processing Complete!",
          description:
            "Your video has been successfully processed and is ready for download.",
          actionable: true,
        };
      case "failed":
        return {
          icon: XCircle,
          color: "text-error-600",
          bgColor: "bg-error-100",
          title: "Processing Failed",
          description:
            "An error occurred during processing. You can try again with different settings.",
          actionable: true,
        };
      default:
        return {
          icon: AlertTriangle,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          title: "Unknown Status",
          description: "Unable to determine the current status.",
          actionable: false,
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-20 h-20 ${statusInfo.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}
        >
          {job.status === "processing" ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <StatusIcon className={`w-10 h-10 ${statusInfo.color}`} />
            </motion.div>
          ) : (
            <StatusIcon className={`w-10 h-10 ${statusInfo.color}`} />
          )}
        </motion.div>

        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {statusInfo.title}
        </h3>
        <p className="text-gray-600 mb-4">{statusInfo.description}</p>

        {/* Progress Bar for Processing */}
        {job.status === "processing" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="my-8"
          >
            <div className="text-center mb-4">
              <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Processing your video...
              </p>
              <p className="text-sm text-gray-600">
                Higher resolution videos take longer to process ✨
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <motion.div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressBar}%` }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-600">{Math.round(progressBar)}% complete</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Job Details */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Job Details
        </h4>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Job ID</span>
            <span className="font-mono text-sm text-gray-900">
              {job.job_id.slice(0, 8)}...
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status</span>
            <span
              className={`status-badge ${apiService.getStatusColor(
                job.status
              )}`}
            >
              {job.status}
            </span>
          </div>

          {job.prompt && (
            <div className="border-t border-gray-200 pt-3">
              <div className="text-gray-600 mb-2">Processing Instructions</div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-900 italic">"{job.prompt}"</p>
              </div>
            </div>
          )}

          {job.workflow_execution && (
            <div className="border-t border-gray-200 pt-3">
              <div className="text-gray-600 mb-2">AI Analysis</div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                {job.workflow_execution.gemini_reasoning && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      AI Reasoning
                    </div>
                    <p className="text-sm text-gray-900">
                      {job.workflow_execution.gemini_reasoning}
                    </p>
                  </div>
                )}

                {job.workflow_execution.planned_tools && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Tools Selected
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {job.workflow_execution.planned_tools.map(
                        (tool, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs"
                          >
                            {tool}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {job.workflow_execution.total_execution_time && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Processing Time</span>
                    <span className="font-medium">
                      {job.workflow_execution.total_execution_time.toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Error Message */}
      {job.status === "failed" && job.error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error-50 border border-error-200 rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-error-800 mb-1">Error Details</h4>
              <p className="text-sm text-error-700">{job.error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Primary Actions */}
        {job.status === "completed" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDownload}
            className="w-full btn-success py-3 sm:py-4 text-base sm:text-lg flex items-center justify-center space-x-3"
          >
            <Download className="w-5 h-5" />
            <span>Download Processed Video</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}

        {job.status === "failed" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="w-full btn-primary py-3 sm:py-4 text-base sm:text-lg flex items-center justify-center space-x-3"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </motion.button>
        )}

        {/* Secondary Actions */}
        {job.status !== "processing" && (
          <div className="flex justify-center">
            <button
              onClick={onDelete}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center space-x-2 py-2"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete this job</span>
            </button>
          </div>
        )}
      </div>

      {/* Processing Tips */}
      {job.status === "processing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100"
        >
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            While We Work Our Magic...
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>AI analyzes your video frame by frame</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Smart algorithms optimize for best results</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>You can safely navigate away</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Processing continues in the background</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white/50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 font-medium text-center">
              ☕ Perfect time to grab a coffee! We'll have your video ready
              soon.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProcessingStatus;
