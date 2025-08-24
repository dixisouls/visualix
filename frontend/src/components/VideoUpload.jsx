import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileVideo,
  CheckCircle,
  AlertCircle,
  X,
  Loader,
  Film,
  HardDrive,
  Clock,
  Monitor,
  ArrowRight,
} from "lucide-react";
import { useJob } from "../context/JobContext";
import { apiService } from "../services/api";
import toast from "react-hot-toast";

const VideoUpload = () => {
  const { uploadVideo, loading, supportedFormats, currentJob } = useJob();
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const file = rejectedFiles[0];
        const error = file.errors[0];

        if (error.code === "file-too-large") {
          toast.error(
            `File is too large. Maximum size is ${supportedFormats.max_file_size_mb}MB`
          );
        } else if (error.code === "file-invalid-type") {
          toast.error(
            `Unsupported file type. Supported formats: ${supportedFormats.supported_formats.join(
              ", "
            )}`
          );
        } else {
          toast.error("File upload failed. Please try again.");
        }
        return;
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        // Validate file with our service
        const validation = apiService.isValidVideoFile(
          file,
          supportedFormats.supported_formats
        );
        if (!validation.valid) {
          toast.error(validation.error);
          return;
        }

        try {
          setUploadProgress(0);
          await uploadVideo(file);
        } catch (error) {
          console.error("Upload error:", error);
        }
      }
    },
    [uploadVideo, supportedFormats]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    onDrop,
    accept: {
      "video/*": supportedFormats.supported_formats.map(
        (format) => `.${format}`
      ),
    },
    maxFiles: 1,
    maxSize: supportedFormats.max_file_size,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    disabled: loading || !!currentJob,
  });

  // If we already have a job, show success state
  if (currentJob) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success-600" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Upload Successful!
        </h3>

        <p className="text-gray-600 mb-6">
          Your video has been uploaded and is ready for processing.
        </p>

        {/* Video Details */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-4 min-w-0">
            <FileVideo className="w-6 h-6 text-gray-600" />
            <span className="font-medium text-gray-900 truncate text-sm sm:text-base max-w-[200px] sm:max-w-xs">
              {currentJob.video_metadata?.filename}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
            <div className="text-center min-w-0">
              <Monitor className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <div className="font-medium text-gray-900 truncate">
                {currentJob.video_metadata?.width}×
                {currentJob.video_metadata?.height}
              </div>
              <div className="text-gray-500 truncate">Resolution</div>
            </div>

            <div className="text-center min-w-0">
              <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <div className="font-medium text-gray-900 truncate">
                {currentJob.video_metadata?.duration
                  ? apiService.formatDuration(
                      currentJob.video_metadata.duration
                    )
                  : "Unknown"}
              </div>
              <div className="text-gray-500 truncate">Duration</div>
            </div>

            <div className="text-center min-w-0">
              <HardDrive className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <div className="font-medium text-gray-900 truncate">
                {currentJob.video_metadata?.size
                  ? apiService.formatFileSize(currentJob.video_metadata.size)
                  : "Unknown"}
              </div>
              <div className="text-gray-500 truncate">File Size</div>
            </div>

            <div className="text-center min-w-0">
              <Film className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <div className="font-medium text-gray-900 truncate">
                {currentJob.video_metadata?.fps
                  ? `${Math.round(currentJob.video_metadata.fps)} fps`
                  : "Unknown"}
              </div>
              <div className="text-gray-500 truncate">Frame Rate</div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center text-primary-600 font-medium"
        >
          <span>Ready for AI processing</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`upload-zone cursor-pointer transition-all duration-200 ${
          isDragActive && !isDragReject
            ? "upload-zone-active scale-102"
            : isDragReject
            ? "upload-zone-error"
            : "hover:border-primary-300 hover:bg-primary-25"
        } ${loading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          {/* Icon */}
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isDragActive ? "bg-primary-100 scale-110" : "bg-gray-100"
            }`}
          >
            {loading ? (
              <Loader className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 animate-spin" />
            ) : isDragActive ? (
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            ) : (
              <FileVideo className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
            )}
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h3
              className={`text-lg sm:text-xl font-semibold transition-colors ${
                isDragActive ? "text-primary-700" : "text-gray-900"
              }`}
            >
              {loading
                ? "Uploading..."
                : isDragActive
                ? "Drop your video here"
                : "Upload your video"}
            </h3>

            <p className="text-sm sm:text-base text-gray-600 px-2 sm:px-0">
              {loading
                ? "Processing your file..."
                : "Drag and drop your video file or click to browse"}
            </p>
          </div>

          {/* Upload Progress */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-xs mx-auto"
              >
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-2 text-center">
                  {uploadProgress}% uploaded
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Browse Button */}
          {!loading && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary px-6 py-3 mx-auto block flex flex-col items-center space-y-1"
            >
              <Upload className="w-4 h-4" />
              Browse Files
            </motion.button>
          )}
        </div>
      </div>

      {/* File Requirements */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-gray-600" />
          File Requirements
        </h4>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700 mb-2">
              Supported Formats
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {supportedFormats.supported_formats.map((format) => (
                <span
                  key={format}
                  className="px-2 py-1 bg-white rounded-lg text-gray-600 uppercase font-mono text-xs flex-shrink-0"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="font-medium text-gray-700 mb-2">
              File Size Limit
            </div>
            <div className="text-gray-600">
              Maximum {supportedFormats.max_file_size_mb}MB per file
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 pt-4 border-t border-gray-200 hidden sm:block">
          <div className="font-medium text-gray-700 mb-2">
            💡 Tips for Best Results
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Higher resolution (1080p+) works best</li>
            <li>• Good lighting and contrast recommended</li>
            <li>• Shorter videos process faster</li>
            <li>• MP4 format is optimal</li>
          </ul>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {fileRejections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-error-50 border border-error-200 rounded-xl p-4"
          >
            <div className="flex items-start space-x-3">
              <X className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-error-800 mb-1">
                  Upload Failed
                </h4>
                {fileRejections.map((rejection, index) => (
                  <div key={index} className="text-sm text-error-700">
                    <span className="font-medium">{rejection.file.name}:</span>
                    {rejection.errors.map((error, errorIndex) => (
                      <div key={errorIndex} className="ml-2">
                        {error.code === "file-too-large" &&
                          `File is too large (${apiService.formatFileSize(
                            rejection.file.size
                          )}). Maximum size is ${
                            supportedFormats.max_file_size_mb
                          }MB.`}
                        {error.code === "file-invalid-type" &&
                          "Unsupported file type. Please choose a video file."}
                        {error.code === "too-many-files" &&
                          "Only one file can be uploaded at a time."}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoUpload;
