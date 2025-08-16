import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Download,
  Share2,
  FileVideo,
  Monitor,
  Clock,
  HardDrive,
  Film,
  Loader,
  AlertCircle,
} from "lucide-react";
import { apiService } from "../services/api";

const VideoPreview = ({ job }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  if (!job) return null;

  const canPreview = job.status === "completed" && job.output_url;
  const videoMetadata = job.video_metadata;

  const handlePreviewToggle = () => {
    if (canPreview) {
      setShowPreview(!showPreview);
      setPreviewError(null);
    }
  };

  const handleVideoError = () => {
    setPreviewError("Unable to load video preview");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <FileVideo className="w-5 h-5 mr-2 text-primary-600" />
            Video Preview
          </h3>

          {canPreview && (
            <button
              onClick={handlePreviewToggle}
              className={`btn-ghost px-3 py-2 text-sm flex items-center space-x-2 ${
                showPreview ? "text-primary-600" : ""
              }`}
            >
              {showPreview ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>{showPreview ? "Hide" : "Show"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Video Information */}
        <div className="space-y-4">
          {/* File Info */}
          <div>
            <div className="text-sm text-gray-500 mb-2">Original File</div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-900 truncate">
                {videoMetadata?.filename || "Unknown filename"}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {videoMetadata?.format && (
                  <span className="uppercase">{videoMetadata.format}</span>
                )}
                {videoMetadata?.size && (
                  <span className="ml-2">
                    • {apiService.formatFileSize(videoMetadata.size)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Technical Details */}
          {videoMetadata && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Monitor className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="font-medium text-gray-900">
                  {videoMetadata.width}×{videoMetadata.height}
                </div>
                <div className="text-xs text-gray-500">Resolution</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="font-medium text-gray-900">
                  {videoMetadata.duration
                    ? apiService.formatDuration(videoMetadata.duration)
                    : "Unknown"}
                </div>
                <div className="text-xs text-gray-500">Duration</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Film className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="font-medium text-gray-900">
                  {videoMetadata.fps
                    ? `${Math.round(videoMetadata.fps)}`
                    : "Unknown"}
                </div>
                <div className="text-xs text-gray-500">FPS</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <HardDrive className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="font-medium text-gray-900">
                  {videoMetadata.bitrate
                    ? `${Math.round(videoMetadata.bitrate / 1000)}k`
                    : "Unknown"}
                </div>
                <div className="text-xs text-gray-500">Bitrate</div>
              </div>
            </div>
          )}

          {/* Status-based Content */}
          {job.status === "pending" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-warning-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-warning-600" />
              </div>
              <p className="text-gray-600">
                Video uploaded, ready for processing
              </p>
            </div>
          )}

          {job.status === "processing" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader className="w-8 h-8 text-primary-600" />
                </motion.div>
              </div>
              <p className="text-gray-600 mb-2">Processing your video...</p>
              {job.progress > 0 && (
                <div className="w-32 mx-auto">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {job.progress}%
                  </div>
                </div>
              )}
            </div>
          )}

          {job.status === "failed" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-error-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-error-600" />
              </div>
              <p className="text-gray-600">Processing failed</p>
              {job.error && (
                <p className="text-sm text-error-600 mt-1">{job.error}</p>
              )}
            </div>
          )}

          {job.status === "completed" && !showPreview && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Play className="w-8 h-8 text-success-600" />
              </div>
              <p className="text-gray-600 mb-3">Processing complete!</p>
              <button
                onClick={handlePreviewToggle}
                className="btn-primary px-4 py-2 text-sm flex items-center space-x-2 mx-auto"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Result</span>
              </button>
            </div>
          )}
        </div>

        {/* Video Preview Player */}
        <AnimatePresence>
          {showPreview && canPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 border-t border-gray-100 pt-4"
            >
              <div className="relative bg-black rounded-lg overflow-hidden">
                {previewError ? (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center text-white">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-75" />
                      <p className="text-sm opacity-75">{previewError}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      className="w-full aspect-video object-contain"
                      onError={handleVideoError}
                      controls
                      preload="metadata"
                    >
                      <source
                        src={`${
                          process.env.REACT_APP_API_URL ||
                          "http://localhost:8000/api/v1"
                        }${job.output_url}`}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>

                    {/* Custom Overlay Controls (if needed) */}
                    <div className="absolute bottom-4 right-4 flex space-x-2">
                      <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
                      >
                        {isFullscreen ? (
                          <Minimize className="w-4 h-4" />
                        ) : (
                          <Maximize className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Preview Actions */}
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => {
                    // Download functionality
                    const link = document.createElement("a");
                    link.href = `${
                      process.env.REACT_APP_API_URL ||
                      "http://localhost:8000/api/v1"
                    }${job.output_url}`;
                    link.download = `${
                      videoMetadata?.filename?.split(".")[0] || "processed"
                    }_result.mp4`;
                    link.click();
                  }}
                  className="flex-1 btn-primary py-2 text-sm flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => {
                    // Share functionality (could implement sharing to social media, etc.)
                    if (navigator.share) {
                      navigator.share({
                        title: "Processed Video",
                        text: "Check out my AI-processed video!",
                        url: window.location.href,
                      });
                    } else {
                      // Fallback: copy link to clipboard
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied to clipboard!");
                    }
                  }}
                  className="flex-1 btn-ghost py-2 text-sm flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default VideoPreview;
