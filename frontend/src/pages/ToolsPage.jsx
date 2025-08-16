import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Palette,
  Blur,
  Sparkles,
  Move,
  Sun,
  Droplets,
  Contrast,
  Sliders,
  Focus,
  Zap,
  Vintage,
  PartyPopper,
  Resize,
  RotateCw,
  Crop,
  FlipHorizontal,
  Tag,
  Clock,
  Cpu,
  Star,
  ArrowRight,
  Code,
} from "lucide-react";

const ToolsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", name: "All Tools", icon: Tag, count: 25 },
    { id: "color", name: "Color", icon: Palette, count: 6 },
    { id: "filter", name: "Filters", icon: Blur, count: 6 },
    { id: "effect", name: "Effects", icon: Sparkles, count: 7 },
    { id: "transform", name: "Transform", icon: Move, count: 6 },
  ];

  const tools = [
    // Color Tools
    {
      id: "brightness_contrast",
      name: "Brightness & Contrast",
      description:
        "Adjust the brightness and contrast levels of your video for perfect exposure and dynamic range.",
      category: "color",
      icon: Sun,
      difficulty: "Beginner",
      processingTime: "~2 min",
      examples: [
        "brighten this video",
        "increase contrast",
        "make it darker",
        "boost the highlights",
      ],
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: "saturation",
      name: "Saturation Control",
      description:
        "Fine-tune color intensity and vibrancy to make your videos pop or create muted artistic looks.",
      category: "color",
      icon: Droplets,
      difficulty: "Beginner",
      processingTime: "~2 min",
      examples: [
        "make colors more vibrant",
        "desaturate the video",
        "boost color intensity",
        "muted color palette",
      ],
      color: "from-cyan-500 to-blue-500",
    },
    {
      id: "hsv_adjustment",
      name: "HSV Manipulation",
      description:
        "Professional color grading with independent Hue, Saturation, and Value channel control.",
      category: "color",
      icon: Sliders,
      difficulty: "Intermediate",
      processingTime: "~3 min",
      examples: [
        "shift the hue to warmer tones",
        "adjust color balance",
        "fine-tune skin tones",
        "color correct",
      ],
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "color_grading",
      name: "Color Grading",
      description:
        "Advanced shadows, midtones, and highlights control for cinematic color grading.",
      category: "color",
      icon: Contrast,
      difficulty: "Advanced",
      processingTime: "~4 min",
      examples: [
        "cinematic color grading",
        "warm highlights cold shadows",
        "film look color grade",
        "moody atmosphere",
      ],
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "white_balance",
      name: "White Balance",
      description:
        "Correct color temperature and tint for natural-looking colors in any lighting condition.",
      category: "color",
      icon: Sun,
      difficulty: "Intermediate",
      processingTime: "~2 min",
      examples: [
        "fix white balance",
        "warm up the image",
        "cool down color temperature",
        "neutral color cast",
      ],
      color: "from-amber-500 to-yellow-500",
    },
    {
      id: "curve_adjustment",
      name: "Curve Adjustment",
      description:
        "Precise control over luminance and color curves for professional color correction.",
      category: "color",
      icon: Sliders,
      difficulty: "Advanced",
      processingTime: "~3 min",
      examples: [
        "adjust curves",
        "lift shadows",
        "control highlights",
        "S-curve contrast",
      ],
      color: "from-emerald-500 to-green-500",
    },

    // Filter Tools
    {
      id: "gaussian_blur",
      name: "Gaussian Blur",
      description:
        "Smooth, natural blur effect perfect for backgrounds, depth of field, and dreamy aesthetics.",
      category: "filter",
      icon: Blur,
      difficulty: "Beginner",
      processingTime: "~3 min",
      examples: [
        "add soft blur",
        "dreamy background effect",
        "depth of field blur",
        "smooth skin effect",
      ],
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "motion_blur",
      name: "Motion Blur",
      description:
        "Dynamic directional blur to simulate movement and add energy to static or slow scenes.",
      category: "filter",
      icon: Zap,
      difficulty: "Intermediate",
      processingTime: "~4 min",
      examples: [
        "motion blur effect",
        "speed lines",
        "dynamic movement",
        "action blur",
      ],
      color: "from-orange-500 to-red-500",
    },
    {
      id: "sharpen",
      name: "Sharpen",
      description:
        "Enhance detail and edge definition to make your videos crisp and professionally sharp.",
      category: "filter",
      icon: Focus,
      difficulty: "Beginner",
      processingTime: "~2 min",
      examples: [
        "sharpen the video",
        "enhance details",
        "crisp edges",
        "improve clarity",
      ],
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "noise_reduction",
      name: "Noise Reduction",
      description:
        "Remove grain and digital noise while preserving important edge details and sharpness.",
      category: "filter",
      icon: Zap,
      difficulty: "Intermediate",
      processingTime: "~5 min",
      examples: [
        "reduce noise",
        "clean up grain",
        "remove digital artifacts",
        "smooth footage",
      ],
      color: "from-purple-500 to-indigo-500",
    },
    {
      id: "unsharp_mask",
      name: "Unsharp Mask",
      description:
        "Professional sharpening technique that enhances perceived sharpness without artifacts.",
      category: "filter",
      icon: Focus,
      difficulty: "Advanced",
      processingTime: "~3 min",
      examples: [
        "professional sharpening",
        "enhance edges",
        "crisp details",
        "photo-quality sharpness",
      ],
      color: "from-teal-500 to-cyan-500",
    },
    {
      id: "bilateral_filter",
      name: "Bilateral Filter",
      description:
        "Edge-preserving smoothing filter ideal for skin smoothing and noise reduction.",
      category: "filter",
      icon: Blur,
      difficulty: "Advanced",
      processingTime: "~4 min",
      examples: [
        "smooth skin texture",
        "edge-preserving blur",
        "reduce noise keep edges",
        "beauty filter",
      ],
      color: "from-pink-500 to-rose-500",
    },

    // Effect Tools
    {
      id: "sepia",
      name: "Sepia Tone",
      description:
        "Classic sepia effect for vintage, nostalgic, and timeless aesthetic appeal.",
      category: "effect",
      icon: Vintage,
      difficulty: "Beginner",
      processingTime: "~2 min",
      examples: [
        "sepia tone effect",
        "vintage look",
        "old photo style",
        "nostalgic brown tint",
      ],
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "film_grain",
      name: "Film Grain",
      description:
        "Add authentic film grain texture for analog warmth and professional cinematic quality.",
      category: "effect",
      icon: Sparkles,
      difficulty: "Intermediate",
      processingTime: "~3 min",
      examples: [
        "film grain texture",
        "analog film look",
        "cinematic grain",
        "vintage film effect",
      ],
      color: "from-gray-600 to-gray-500",
    },
    {
      id: "vignette",
      name: "Vignette",
      description:
        "Subtle or dramatic edge darkening to draw focus to the center and add artistic flair.",
      category: "effect",
      icon: Focus,
      difficulty: "Beginner",
      processingTime: "~2 min",
      examples: [
        "add vignette effect",
        "darken edges",
        "center focus",
        "dramatic lighting",
      ],
      color: "from-gray-700 to-black",
    },
    {
      id: "retro_80s",
      name: "Retro 80s",
      description:
        "Vibrant neon colors, high contrast, and nostalgic 80s aesthetic with period-accurate styling.",
      category: "effect",
      icon: PartyPopper,
      difficulty: "Intermediate",
      processingTime: "~4 min",
      examples: [
        "80s retro style",
        "neon colors",
        "synthwave aesthetic",
        "vintage 80s look",
      ],
      color: "from-pink-500 to-purple-500",
    },
    {
      id: "black_white",
      name: "Black & White",
      description:
        "Convert to monochrome with professional contrast control for striking artistic results.",
      category: "effect",
      icon: Contrast,
      difficulty: "Beginner",
      processingTime: "~2 min",
      examples: [
        "black and white",
        "monochrome conversion",
        "grayscale effect",
        "artistic b&w",
      ],
      color: "from-gray-700 to-gray-900",
    },
    {
      id: "color_pop",
      name: "Color Pop",
      description:
        "Selective color enhancement that makes specific colors stand out dramatically.",
      category: "effect",
      icon: Sparkles,
      difficulty: "Intermediate",
      processingTime: "~3 min",
      examples: [
        "color pop effect",
        "selective color",
        "highlight specific colors",
        "dramatic color accent",
      ],
      color: "from-red-500 to-pink-500",
    },
    {
      id: "cross_process",
      name: "Cross Process",
      description:
        "Simulate cross-processing film technique for unique color shifts and artistic looks.",
      category: "effect",
      icon: Vintage,
      difficulty: "Advanced",
      processingTime: "~4 min",
      examples: [
        "cross process effect",
        "color shift",
        "film processing look",
        "artistic color cast",
      ],
      color: "from-yellow-500 to-green-500",
    },

    // Transform Tools
    {
      id: "resize",
      name: "Resize",
      description:
        "Scale videos to any resolution while maintaining aspect ratio and preserving quality.",
      category: "transform",
      icon: Resize,
      difficulty: "Beginner",
      processingTime: "~2 min",
      examples: [
        "resize to 1080p",
        "scale down video",
        "change resolution",
        "make smaller",
      ],
      color: "from-blue-500 to-indigo-500",
    },
    {
      id: "rotate",
      name: "Rotate",
      description:
        "Rotate videos by any angle with automatic canvas expansion to prevent clipping.",
      category: "transform",
      icon: RotateCw,
      difficulty: "Beginner",
      processingTime: "~3 min",
      examples: [
        "rotate 90 degrees",
        "fix orientation",
        "turn clockwise",
        "flip upside down",
      ],
      color: "from-green-500 to-teal-500",
    },
    {
      id: "crop",
      name: "Crop",
      description:
        "Extract specific regions and remove unwanted areas with precise control.",
      category: "transform",
      icon: Crop,
      difficulty: "Beginner",
      processingTime: "~2 min",
      examples: [
        "crop the video",
        "remove black bars",
        "focus on center",
        "extract region",
      ],
      color: "from-orange-500 to-yellow-500",
    },
    {
      id: "flip",
      name: "Flip",
      description:
        "Mirror videos horizontally or vertically for corrections or creative effects.",
      category: "transform",
      icon: FlipHorizontal,
      difficulty: "Beginner",
      processingTime: "~2 min",
      examples: [
        "flip horizontally",
        "mirror image",
        "reverse direction",
        "flip vertically",
      ],
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "perspective",
      name: "Perspective",
      description:
        "Correct perspective distortion or create artistic perspective effects.",
      category: "transform",
      icon: Move,
      difficulty: "Advanced",
      processingTime: "~4 min",
      examples: [
        "fix perspective",
        "correct keystone",
        "artistic perspective",
        "straighten image",
      ],
      color: "from-indigo-500 to-blue-500",
    },
    {
      id: "stabilization",
      name: "Stabilization",
      description:
        "Remove camera shake and smooth out handheld footage for professional results.",
      category: "transform",
      icon: Focus,
      difficulty: "Advanced",
      processingTime: "~6 min",
      examples: [
        "stabilize footage",
        "remove camera shake",
        "smooth movement",
        "steady video",
      ],
      color: "from-emerald-500 to-green-500",
    },
  ];

  const filteredTools = tools.filter((tool) => {
    const matchesCategory =
      selectedCategory === "all" || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.examples.some((example) =>
        example.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "text-green-600 bg-green-100";
      case "Intermediate":
        return "text-yellow-600 bg-yellow-100";
      case "Advanced":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Video Processing Tools
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Explore our comprehensive suite of 25+ professional video processing
            tools. Each tool is powered by OpenCV and optimized for quality and
            performance.
          </motion.p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tools, effects, or examples..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 pr-4"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? "bg-primary-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive ? "bg-white/20" : "bg-white"
                      }`}
                    >
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <motion.div layout className="tool-grid">
          <AnimatePresence>
            {filteredTools.map((tool) => {
              const Icon = tool.icon;

              return (
                <motion.div
                  key={tool.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <div className="card-hover h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div
                        className={`status-badge ${getDifficultyColor(
                          tool.difficulty
                        )} text-xs`}
                      >
                        {tool.difficulty}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {tool.description}
                    </p>

                    {/* Processing Time */}
                    <div className="flex items-center space-x-2 mb-4 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{tool.processingTime}</span>
                      <Cpu className="w-4 h-4 ml-2" />
                      <span>OpenCV</span>
                    </div>

                    {/* Examples */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Code className="w-4 h-4 mr-1" />
                        Example Prompts:
                      </h4>
                      <div className="space-y-1">
                        {tool.examples.slice(0, 2).map((example, index) => (
                          <div
                            key={index}
                            className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg"
                          >
                            "{example}"
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Try Button */}
                    <button className="w-full btn-ghost text-sm group-hover:bg-primary-50 group-hover:text-primary-600 transition-all duration-200">
                      <span>Try with AI</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* No Results */}
        {filteredTools.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tools found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria.
            </p>
          </motion.div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 p-8 bg-gradient-to-br from-primary-50 to-purple-50 rounded-3xl border border-primary-100"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Process Your Video?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Simply describe what you want, and our AI will automatically select
            and apply the perfect tools.
          </p>
          <motion.a
            href="/process"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary px-8 py-4 text-lg inline-flex items-center shadow-xl"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Processing
            <ArrowRight className="w-5 h-5 ml-2" />
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
};

export default ToolsPage;
