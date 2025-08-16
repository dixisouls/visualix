import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Brain,
  Settings,
  Zap,
  Sparkles,
  Play,
  Pause,
  BarChart3,
  Timer,
  Cpu,
  ArrowRight,
  Eye,
  Activity,
} from "lucide-react";
import { apiService } from "../services/api";

const ProcessingStatus = ({ job, onDownload, onDelete, onRetry }) => {
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);
  const [processingStartTime, setProcessingStartTime] = useState(null);

  useEffect(() => {
    if (job?.status === "processing" && !processingStartTime) {
      setProcessingStartTime(Date.now());
    }
  }, [job?.status]);

  useEffect(() => {
    if (
      job?.status === "processing" &&
      processingStartTime &&
      job.progress > 0
    ) {
      const elapsedTime = (Date.now() - processingStartTime) / 1000;
      const estimatedTotal = (elapsedTime / job.progress) * 100;
      const remaining = Math.max(0, estimatedTotal - elapsedTime);
      setEstimatedTimeRemaining(remaining);
    }
  }, [job?.progress, processingStartTime]);

  if (!job) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Job Selected
        </h3>
        <p className="text-gray-600">
          Upload a video and provide processing instructions to get started.
        </p>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (job.status) {
      case "pending":
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
          title: "Processing in Progress",
          description:
            "Our AI is analyzing your request and applying the selected tools.",
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

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {statusInfo.title}
        </h3>
        <p className="text-gray-600 mb-4">{statusInfo.description}</p>

        {/* Progress Bar for Processing */}
        {job.status === "processing" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-4"
          >
            <div className="progress-bar mb-2">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${job.progress || 0}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{job.progress || 0}% complete</span>
              {estimatedTimeRemaining && (
                <span>~{Math.ceil(estimatedTimeRemaining)}s remaining</span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Job Details */}
      <div className="bg-gray-50 rounded-xl p-6">
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

      {/* Current Processing Step */}
      {job.status === "processing" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center"
            >
              <Activity className="w-4 h-4 text-white" />
            </motion.div>
            <h4 className="font-semibold text-gray-900">
              AI Processing in Progress
            </h4>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {job.message ||
              "Our AI is analyzing your video and applying the selected processing tools..."}
          </p>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Brain className="w-4 h-4" />
              <span>Gemini AI</span>
            </div>
            <div className="flex items-center space-x-1">
              <Cpu className="w-4 h-4" />
              <span>OpenCV Tools</span>
            </div>
            <div className="flex items-center space-x-1">
              <Timer className="w-4 h-4" />
              <span>Real-time Processing</span>
            </div>
          </div>
        </motion.div>
      )}

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
            className="w-full btn-success py-4 text-lg flex items-center justify-center space-x-3"
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
            className="w-full btn-primary py-4 text-lg flex items-center justify-center space-x-3"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </motion.button>
        )}

        {/* Secondary Actions */}
        <div className="flex space-x-3">
          {job.status === "completed" && (
            <button
              onClick={() => {
                /* TODO: Implement preview */
              }}
              className="flex-1 btn-ghost py-3 flex items-center justify-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
          )}

          {job.status !== "processing" && (
            <button
              onClick={onDelete}
              className="flex-1 btn-danger py-3 flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Processing Tips */}
      {job.status === "processing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="bg-blue-50 rounded-xl p-4"
        >
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            While You Wait...
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Processing time depends on video length and complexity</li>
            <li>
              • Our AI automatically optimizes the workflow for best results
            </li>
            <li>
              • You can safely leave this page - processing continues in the
              background
            </li>
            <li>
              • Higher resolution videos may take longer but produce better
              results
            </li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default ProcessingStatus;
