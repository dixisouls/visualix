import { useEffect } from "react";
import { useJob } from "../context/JobContext";
import { apiService } from "../services/api";

const CleanupHandler = () => {
  const { currentJob, jobHistory } = useJob();

  useEffect(() => {
    const cleanup = async () => {
      try {
        // Clean up current job if it exists and is not completed
        if (currentJob && currentJob.status !== "completed") {
          console.log("🧹 Cleaning up current job:", currentJob.job_id);
          await apiService.deleteJob(currentJob.job_id);
        }

        // Clean up any pending/processing jobs from history
        const jobsToCleanup = jobHistory.filter(
          (job) => job.status === "pending" || job.status === "processing"
        );

        for (const job of jobsToCleanup) {
          try {
            console.log("🧹 Cleaning up job from history:", job.job_id);
            await apiService.deleteJob(job.job_id);
          } catch (error) {
            console.error("Failed to cleanup job:", job.job_id, error);
          }
        }
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    };

    const handleBeforeUnload = (event) => {
      // Perform cleanup synchronously (limited by browser)
      if (currentJob && currentJob.status !== "completed") {
        // Use sendBeacon for more reliable cleanup on page unload
        const data = JSON.stringify({ job_id: currentJob.job_id });
        navigator.sendBeacon(
          `${
            process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1"
          }/video/upload/${currentJob.job_id}`,
          data
        );
      }

      // Standard beforeunload handling
      event.preventDefault();
      event.returnValue = "";
    };

    const handleUnload = () => {
      cleanup();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Page is being hidden (user switching tabs, etc.)
        // We don't cleanup here to avoid interrupting legitimate usage
        console.log("Page hidden, preserving jobs");
      }
    };

    // Handle page refresh/close
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    // Handle visibility changes (optional - for more advanced scenarios)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentJob, jobHistory]);

  // Also handle cleanup when the app is about to be unmounted
  useEffect(() => {
    return () => {
      // This runs when the component unmounts
      if (currentJob && currentJob.status !== "completed") {
        // Fire-and-forget cleanup
        apiService.deleteJob(currentJob.job_id).catch(console.error);
      }
    };
  }, [currentJob]);

  // Handle cleanup on navigation/route changes
  useEffect(() => {
    const handlePopState = () => {
      // Handle browser back/forward navigation
      console.log("Navigation detected");
      // We don't cleanup on navigation to allow users to navigate while processing
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default CleanupHandler;
