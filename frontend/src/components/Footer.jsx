import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Video,
  Github,
  Linkedin,
  Heart,
  ExternalLink,
  Sparkles,
  Brain,
  Zap,
  Code,
  ArrowUpRight,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navigation = {
    product: [
      { name: "Features", href: "/#features" },
      { name: "Tools", href: "/tools" },
      { name: "Process Video", href: "/process" },
      { name: "API Documentation", href: "#", external: true },
    ],
    technology: [
      { name: "Gemini AI", href: "https://ai.google.dev/", external: true },
      { name: "OpenCV", href: "https://opencv.org/", external: true },
      { name: "React", href: "https://react.dev/", external: true },
      { name: "FastAPI", href: "https://fastapi.tiangolo.com/", external: true },
    ],
    resources: [
      { name: "Getting Started", href: "#" },
      { name: "Examples", href: "#" },
      { name: "Best Practices", href: "#" },
      { name: "Support", href: "#" },
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "License", href: "#" },
      { name: "Cookies", href: "#" },
    ],
  };

  const socialLinks = [
    {
      name: "GitHub",
      href: "https://github.com/dixisouls",
      icon: Github,
      color: "hover:text-gray-900",
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/divya-m-panchal/",
      icon: Linkedin,
      color: "hover:text-blue-600",
    },
  ];

  const technologies = [
    { name: "Gemini AI", icon: Brain, color: "text-purple-600" },
    { name: "OpenCV", icon: Video, color: "text-green-600" },
    { name: "React", icon: Code, color: "text-blue-600" },
    { name: "FastAPI", icon: Zap, color: "text-orange-600" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Brand Section */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center space-x-3 mb-6">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </motion.div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">VisualiX</h3>
                <p className="text-sm text-gray-400">AI Video Editor</p>
              </div>
            </Link>

            <p className="text-gray-400 mb-6 lg:mb-8 max-w-2xl mx-auto leading-relaxed text-base sm:text-lg">
              Transform your videos with the power of AI. Professional video
              editing made simple through natural language processing and
              cutting-edge computer vision.
            </p>

            {/* Combined Tech Stack and Technology Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-2xl mx-auto">
              <div className="space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-white">Powered by</h4>
                <div className="space-y-3">
                  {technologies.map((tech) => {
                    const Icon = tech.icon;
                    return (
                      <div
                        key={tech.name}
                        className="flex items-center justify-center space-x-2"
                      >
                        <Icon className={`w-5 h-5 ${tech.color}`} />
                        <span className="text-gray-400">{tech.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-white">Technology</h4>
                <div className="space-y-3">
                  {navigation.technology.map((item) => (
                    <div key={item.name} className="flex justify-center">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group"
                      >
                        <span>{item.name}</span>
                        <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <div className="flex flex-col items-center justify-center space-y-3 lg:space-y-4">
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 text-gray-400 ${social.color} transition-colors duration-200 rounded-lg hover:bg-gray-800`}
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>

            {/* Copyright */}
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <span>© {currentYear} VisualiX. Made with</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="w-4 h-4 text-red-500 fill-current" />
              </motion.div>
              <span>by</span>
              <a
                href="https://divyapanchal.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                Divya Panchal
              </a>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-gray-800">
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>
                VisualiX is an open-source AI video processing platform. Built
                with React, FastAPI, Google Gemini AI, and OpenCV.
              </p>
              <p>
                Processing happens locally on our servers. Your videos are never
                stored permanently and are automatically deleted after
                processing completion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
