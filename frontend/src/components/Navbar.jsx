import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Home,
  Wrench,
  Play,
  Menu,
  X,
  Github,
  Sparkles,
} from "lucide-react";
import { useJob } from "../context/JobContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { currentJob } = useJob();

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Tools", href: "/tools", icon: Wrench },
    { name: "Process", href: "/process", icon: Play },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="relative bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </motion.div>
            <div className="hidden md:block">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                VisualiX
              </h1>
              <p className="text-xs text-gray-500 -mt-1">AI Video Editor</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 group ${
                    active
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active
                        ? "text-primary-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  />
                  <span>{item.name}</span>

                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary-100 rounded-xl -z-10"
                      initial={false}
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.4,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Current Job Status */}
          {currentJob && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden lg:flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-xl"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  currentJob.status === "processing"
                    ? "bg-primary-500 animate-pulse"
                    : currentJob.status === "completed"
                    ? "bg-success-500"
                    : currentJob.status === "failed"
                    ? "bg-error-500"
                    : "bg-warning-500"
                }`}
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900 truncate max-w-32">
                  {currentJob.video_metadata?.filename || "Unknown"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentJob.status}{" "}
                  {currentJob.progress > 0 && `(${currentJob.progress}%)`}
                </p>
              </div>
            </motion.div>
          )}

          {/* GitHub Link */}
          <div className="hidden lg:flex items-center space-x-4">
            <a
              href="https://github.com/dixisouls/visualix"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      active
                        ? "text-primary-600 bg-primary-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        active ? "text-primary-600" : "text-gray-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Job Status */}
              {currentJob && (
                <div className="px-4 py-3 bg-gray-50 rounded-xl mt-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        currentJob.status === "processing"
                          ? "bg-primary-500 animate-pulse"
                          : currentJob.status === "completed"
                          ? "bg-success-500"
                          : currentJob.status === "failed"
                          ? "bg-error-500"
                          : "bg-warning-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {currentJob.video_metadata?.filename || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {currentJob.status}{" "}
                        {currentJob.progress > 0 && `(${currentJob.progress}%)`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile GitHub Link */}
              <a
                href="https://github.com/dixisouls/visualix"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors mt-2"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">GitHub</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
