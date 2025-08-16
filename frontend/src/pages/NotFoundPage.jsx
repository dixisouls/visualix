import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  ArrowLeft,
  Search,
  Sparkles,
  Video,
  Wrench,
  Play,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

const NotFoundPage = () => {
  const navigate = useNavigate();

  const quickLinks = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      description: "Return to the homepage",
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Tools",
      href: "/tools",
      icon: Wrench,
      description: "Explore video processing tools",
      color: "from-green-500 to-emerald-500",
    },
    {
      name: "Process Video",
      href: "/process",
      icon: Play,
      description: "Start processing a video",
      color: "from-purple-500 to-pink-500",
    },
  ];

  const floatingElements = [
    { icon: Video, delay: 0, duration: 6 },
    { icon: Sparkles, delay: 2, duration: 8 },
    { icon: Wrench, delay: 4, duration: 7 },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse-slow" />

        {/* Floating Icons */}
        {floatingElements.map((element, index) => {
          const Icon = element.icon;
          return (
            <motion.div
              key={index}
              className="absolute text-gray-200"
              style={{
                left: `${20 + index * 25}%`,
                top: `${15 + index * 20}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: element.duration,
                delay: element.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Icon className="w-16 h-16" />
            </motion.div>
          );
        })}
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* 404 Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="relative">
            <motion.h1
              className="text-9xl md:text-[12rem] font-bold bg-gradient-to-br from-gray-200 to-gray-400 bg-clip-text text-transparent select-none"
              animate={{
                textShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.3)",
                  "0 0 40px rgba(147, 51, 234, 0.3)",
                  "0 0 20px rgba(59, 130, 246, 0.3)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              404
            </motion.h1>

            {/* Glitch Effect Overlay */}
            <motion.div
              className="absolute inset-0 text-9xl md:text-[12rem] font-bold text-primary-500 opacity-20"
              animate={{
                x: [0, -2, 2, 0],
                opacity: [0, 0.3, 0, 0.2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              404
            </motion.div>
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <AlertTriangle className="w-4 h-4" />
            <span>Page Not Found</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Oops! This page got lost in the
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              editing room
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The page you're looking for seems to have been processed out of
            existence. Don't worry, our AI can't delete everything!
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12"
        >
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary px-8 py-4 text-lg shadow-2xl hover:shadow-primary-500/25"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </motion.button>

          <Link
            to="/"
            className="btn-ghost px-8 py-4 text-lg border border-gray-300 hover:border-gray-400"
          >
            <Home className="w-5 h-5 mr-2" />
            Home Page
          </Link>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center justify-center">
            <Search className="w-5 h-5 mr-2 text-primary-600" />
            Or try one of these popular destinations:
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                >
                  <Link to={link.href} className="block group">
                    <div className="card-hover text-center p-6 transition-all duration-200">
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${link.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {link.name}
                      </h4>
                      <p className="text-gray-600">{link.description}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Fun Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-16 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-primary-100"
        >
          <div className="flex items-center justify-center space-x-3 mb-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-primary-600" />
            </motion.div>
            <h4 className="text-lg font-semibold text-gray-900">
              While you're here...
            </h4>
          </div>
          <p className="text-gray-600 mb-4">
            Did you know that our AI can process videos with just natural
            language? Try saying "make this look vintage" or "add a cinematic
            blur effect"!
          </p>
          <Link
            to="/process"
            className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            Try it now
            <motion.div
              className="ml-2"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.div>
          </Link>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            If you believe this is an error, please{" "}
            <button
              onClick={() => window.location.reload()}
              className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
            >
              refresh the page
              <RefreshCw className="w-3 h-3 ml-1" />
            </button>{" "}
            or contact our support team.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
