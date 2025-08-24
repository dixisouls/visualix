import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  History,
  FileVideo,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  Monitor,
  HardDrive,
  MoreVertical,
  Play,
  ArrowRight,
} from "lucide-react";
import { useJob } from "../context/JobContext";
import { apiService } from "../services/api";

const JobHistory = ({ onClose }) => {
  const { jobHistory, setCurrentJob, deleteJob, downloadVideo } = useJob();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedJob, setSelectedJob] = useState(null);

  const statusOptions = [
    { value: "all", label: "All Status", count: jobHistory.length },
    {
      value: "completed",
      label: "Completed",
      count: jobHistory.filter((j) => j.status === "completed").length,
    },
    {
      value: "processing",
      label: "Processing",
      count: jobHistory.filter((j) => j.status === "processing").length,
    },
    {
      value: "failed",
      label: "Failed",
      count: jobHistory.filter((j) => j.status === "failed").length,
    },
    {
      value: "pending",
      label: "Pending",
      count: jobHistory.filter((j) => j.status === "pending").length,
    },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "status", label: "By Status" },
    { value: "name", label: "By Name" },
  ];

  // Filter and sort jobs
  const filteredJobs = jobHistory
    .filter((job) => {
      const matchesSearch =
        job.video_metadata?.filename
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        job.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.job_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at || b.updated_at) -
            new Date(a.created_at || a.updated_at)
          );
        case "oldest":
          return (
            new Date(a.created_at || a.updated_at) -
            new Date(b.created_at || b.updated_at)
          );
        case "status":
          return a.status.localeCompare(b.status);
        case "name":
          return (a.video_metadata?.filename || "").localeCompare(
            b.video_metadata?.filename || ""
          );
        default:
          return 0;
      }
    });

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleJobSelect = (job) => {
    setCurrentJob(job);
    onClose();
  };

  const handleJobAction = async (action, job) => {
    try {
      switch (action) {
        case "download":
          if (job.status === "completed") {
            const filename = "processed_result.mp4";
            await downloadVideo(job.job_id, filename);
          }
          break;
        case "delete":
          await deleteJob(job.job_id);
          break;
        case "select":
          handleJobSelect(job);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Job History</h2>
            <p className="text-sm text-gray-600">
              {jobHistory.length} total jobs
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-gray-200 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by filename, prompt, or job ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Job List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <FileVideo className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {jobHistory.length === 0 ? "No Jobs Yet" : "No Matching Jobs"}
            </h3>
            <p className="text-gray-600 max-w-sm">
              {jobHistory.length === 0
                ? "Start by uploading a video to see your processing history here."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <AnimatePresence>
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.job_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-4">
                    {/* Status Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        job.status === "completed"
                          ? "bg-success-100"
                          : job.status === "processing"
                          ? "bg-primary-100"
                          : job.status === "failed"
                          ? "bg-error-100"
                          : "bg-warning-100"
                      }`}
                    >
                      {job.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-success-600" />
                      ) : job.status === "processing" ? (
                        <Loader className="w-5 h-5 text-primary-600 animate-spin" />
                      ) : job.status === "failed" ? (
                        <XCircle className="w-5 h-5 text-error-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-warning-600" />
                      )}
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {job.video_metadata?.filename || 
                             (job.job_id ? `Video-${job.job_id.slice(0, 8)}` : "Unknown Video")}
                          </h4>
                          <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(job.created_at || job.updated_at)}
                            </span>
                            {job.video_metadata?.size && (
                              <span className="flex items-center">
                                <HardDrive className="w-3 h-3 mr-1" />
                                {apiService.formatFileSize(
                                  job.video_metadata.size
                                )}
                              </span>
                            )}
                            {job.video_metadata?.width &&
                              job.video_metadata?.height && (
                                <span className="flex items-center">
                                  <Monitor className="w-3 h-3 mr-1" />
                                  {job.video_metadata.width}×
                                  {job.video_metadata.height}
                                </span>
                              )}
                          </div>
                        </div>

                        <div
                          className={`status-badge ${apiService.getStatusColor(
                            job.status
                          )} text-xs`}
                        >
                          {job.status}
                        </div>
                      </div>

                      {/* Prompt */}
                      {job.prompt && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg italic line-clamp-2">
                            "{job.prompt}"
                          </p>
                        </div>
                      )}

                      {/* Progress for processing jobs */}
                      {job.status === "processing" && job.progress > 0 && (
                        <div className="mb-3">
                          <div className="progress-bar h-1">
                            <div
                              className="progress-fill"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {job.progress}% complete
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleJobAction("select", job)}
                          className="btn-primary px-3 py-1.5 text-xs flex items-center space-x-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Select</span>
                        </button>

                        {job.status === "completed" && (
                          <button
                            onClick={() => handleJobAction("download", job)}
                            className="btn-ghost px-3 py-1.5 text-xs flex items-center space-x-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        )}

                        {job.status !== "processing" && (
                          <button
                            onClick={() => handleJobAction("delete", job)}
                            className="btn-ghost px-3 py-1.5 text-xs text-error-600 hover:bg-error-50 flex items-center space-x-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {filteredJobs.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredJobs.length} of {jobHistory.length} jobs
            </span>
            <button
              onClick={onClose}
              className="btn-primary px-4 py-2 text-sm flex items-center space-x-2"
            >
              <span>Close</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobHistory;
