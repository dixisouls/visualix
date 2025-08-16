import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Video,
  Github,
  Twitter,
  Linkedin,
  Mail,
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
      {
        name: "LangGraph",
        href: "https://langchain-ai.github.io/langgraph/",
        external: true,
      },
      { name: "React", href: "https://react.dev/", external: true },
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
      name: "Twitter",
      href: "https://twitter.com/dixisouls",
      icon: Twitter,
      color: "hover:text-blue-500",
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/in/dixisouls",
      icon: Linkedin,
      color: "hover:text-blue-600",
    },
    {
      name: "Email",
      href: "mailto:contact@visualix.ai",
      icon: Mail,
      color: "hover:text-red-500",
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">Visualix</h3>
                <p className="text-sm text-gray-400">AI Video Editor</p>
              </div>
            </Link>

            <p className="text-gray-400 mb-6 max-w-sm leading-relaxed">
              Transform your videos with the power of AI. Professional video
              editing made simple through natural language processing and
              cutting-edge computer vision.
            </p>

            {/* Tech Stack */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-300">Powered by:</p>
              <div className="grid grid-cols-2 gap-2">
                {technologies.map((tech) => {
                  const Icon = tech.icon;
                  return (
                    <div
                      key={tech.name}
                      className="flex items-center space-x-2"
                    >
                      <Icon className={`w-4 h-4 ${tech.color}`} />
                      <span className="text-sm text-gray-400">{tech.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group"
                    >
                      <span>{item.name}</span>
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Technology</h3>
            <ul className="space-y-3">
              {navigation.technology.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    <span>{item.name}</span>
                    <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md">
            <h3 className="text-white font-semibold mb-2">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">
              Get the latest updates on new features and AI capabilities.
            </p>
            <div className="flex space-x-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <span>© {currentYear} Visualix. Made with</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="w-4 h-4 text-red-500 fill-current" />
              </motion.div>
              <span>by</span>
              <a
                href="https://github.com/dixisouls"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                dixisouls
              </a>
            </div>

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

            {/* Status Badge */}
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-400">All systems operational</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>
                Visualix is an open-source AI video processing platform. Built
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
