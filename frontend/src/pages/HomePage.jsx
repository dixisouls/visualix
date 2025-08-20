import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play,
  Sparkles,
  Zap,
  Brain,
  Video,
  Wand2,
  ArrowRight,
  CheckCircle,
  Code,
  Palette,
  Settings,
  Upload,
  Download,
  Timer,
  Star,
  Github,
  ExternalLink,
} from "lucide-react";

const HomePage = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description:
        "Gemini AI understands your natural language descriptions and automatically selects the perfect tools for your vision.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Zap,
      title: "Lightning Fast Processing",
      description:
        "Optimized OpenCV tools with LangGraph orchestration ensure smooth, efficient video processing workflows.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Wand2,
      title: "Natural Language Control",
      description:
        'Simply describe what you want: "make it vintage with sepia tones" or "add a dreamy blur effect" - no technical knowledge required.',
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Settings,
      title: "25+ Professional Tools",
      description:
        "Comprehensive suite of color grading, filters, effects, and transform tools for all your video editing needs.",
      color: "from-orange-500 to-red-500",
    },
  ];

  const workflow = [
    {
      icon: Upload,
      title: "Upload Your Video",
      description:
        "Drag and drop your video file. We support MP4, AVI, MOV, MKV, and WebM formats.",
      step: "01",
    },
    {
      icon: Wand2,
      title: "Describe Your Vision",
      description:
        "Tell us what you want in plain English. Our AI will understand and plan the perfect workflow.",
      step: "02",
    },
    {
      icon: Settings,
      title: "AI Processing Magic",
      description:
        "Watch as our AI selects and orchestrates the right tools to bring your vision to life.",
      step: "03",
    },
    {
      icon: Download,
      title: "Download Results",
      description:
        "Get your professionally processed video, ready to share with the world.",
      step: "04",
    },
  ];

  const stats = [
    { label: "Video Tools", value: "25+", icon: Video },
    { label: "AI Models", value: "1", icon: Brain },
    { label: "Supported Formats", value: "5", icon: Code },
    { label: "Processing Speed", value: "Real-time", icon: Timer },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary-400/30 to-purple-600/30 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse-slow" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-100 to-purple-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>Powered by Google Gemini AI</span>
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              Video Editing
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Transform your videos with the power of natural language. Just
              describe what you want, and our AI will orchestrate the perfect
              editing workflow using 25+ professional tools.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
            >
              <Link
                to="/process"
                className="btn-primary px-8 py-4 text-lg shadow-2xl hover:shadow-primary-500/25 transform hover:scale-105 transition-all duration-200"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Creating
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>

              <Link
                to="/tools"
                className="btn-ghost px-8 py-4 text-lg border border-gray-300 hover:border-gray-400"
              >
                <Palette className="w-5 h-5 mr-2" />
                Explore Tools
              </Link>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl mb-3">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Revolutionizing Video Editing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              VisualiX combines cutting-edge AI with professional video
              processing tools to make sophisticated editing accessible to
              everyone.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="card-hover bg-gradient-to-br from-white to-gray-50">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              How It Works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              From upload to download in four simple steps. Our AI handles all
              the complexity.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative text-center group"
                >
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm z-10">
                    {step.step}
                  </div>

                  <div className="card-hover pt-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-100 to-purple-100 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-200">
                      <Icon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Connector Line (hidden on last item) */}
                  {index < workflow.length - 1 && (
                    <div className="hidden lg:block absolute top-16 left-full w-8 h-0.5 bg-gradient-to-r from-primary-300 to-purple-300 transform -translate-y-1/2" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Built with Cutting-Edge Technology
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Powered by industry-leading AI and video processing technologies.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white"
          >
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Google Gemini AI</h3>
                <p className="text-gray-300">
                  Advanced language understanding for natural prompt analysis
                </p>
              </div>

              <div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">OpenCV</h3>
                <p className="text-gray-300">
                  Professional-grade computer vision and video processing
                </p>
              </div>

              <div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">LangGraph</h3>
                <p className="text-gray-300">
                  Intelligent workflow orchestration and state management
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Videos?
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Join the future of video editing with AI-powered creativity.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
              <Link
                to="/process"
                className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Creating Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>

              <a
                href="https://github.com/dixisouls/visualix"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center"
              >
                <Github className="w-5 h-5 mr-2" />
                View Source
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>

            <p className="text-white/80 text-sm">
              Open source • Privacy focused • Developer friendly
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
