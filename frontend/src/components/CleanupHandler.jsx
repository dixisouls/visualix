import { useEffect } from "react";

const CleanupHandler = () => {
  useEffect(() => {
    console.log("🧹 Automatic cleanup service active - all files cleared every hour on the server");
    
    return () => {
      console.log("🧹 CleanupHandler unmounted");
    };
  }, []);

  // This component doesn't render anything but logs that automatic cleanup is active
  return null;
};

export default CleanupHandler;
