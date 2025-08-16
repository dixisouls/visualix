import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CleanupHandler from "./components/CleanupHandler";

// Pages
import HomePage from "./pages/HomePage";
import ToolsPage from "./pages/ToolsPage";
import ProcessPage from "./pages/ProcessPage";
import NotFoundPage from "./pages/NotFoundPage";

// Context
import { JobProvider } from "./context/JobContext";

function App() {
  useEffect(() => {
    // Prevent default drag and drop behavior on the document
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      document.addEventListener(eventName, preventDefaults, false);
    });

    return () => {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        document.removeEventListener(eventName, preventDefaults, false);
      });
    };
  }, []);

  return (
    <JobProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          {/* Background Effects */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse-slow" />
          </div>

          {/* Main App Structure */}
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />

            <motion.main
              className="flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/process" element={<ProcessPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </motion.main>

            <Footer />
          </div>

          {/* Global Components */}
          <CleanupHandler />

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#fff",
                color: "#374151",
                borderRadius: "12px",
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
                fontWeight: "500",
                padding: "12px 16px",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
              loading: {
                iconTheme: {
                  primary: "#3b82f6",
                  secondary: "#fff",
                },
              },
            }}
          />
        </div>
      </Router>
    </JobProvider>
  );
}

export default App;
