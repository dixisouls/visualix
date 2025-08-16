import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Sparkles,
  Play,
  Lightbulb,
  Palette,
  Vintage,
  Zap,
  Focus,
  RotateCw,
  ArrowRight,
  Brain,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const PromptInput = ({
  prompt,
  onPromptChange,
  onProcess,
  loading,
  disabled,
}) => {
  const [showExamples, setShowExamples] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("popular");

  const promptExamples = {
    popular: [
      {
        text: "make this look vintage with sepia tones and film grain",
        description:
          "Classic vintage aesthetic with warm brown tones and authentic film texture",
        icon: Vintage,
        color: "from-amber-500 to-orange-500",
      },
      {
        text: "brighten the video and increase contrast for a cinematic look",
        description:
          "Enhanced brightness and contrast for professional, movie-like quality",
        icon: Zap,
        color: "from-yellow-500 to-orange-500",
      },
      {
        text: "add a soft blur effect for a dreamy atmosphere",
        description: "Gentle blur to create ethereal, dreamlike visual mood",
        icon: Focus,
        color: "from-blue-500 to-purple-500",
      },
      {
        text: "apply retro 80s styling with neon colors",
        description: "Vibrant neon palette with nostalgic 1980s aesthetic",
        icon: Sparkles,
        color: "from-pink-500 to-purple-500",
      },
    ],
    color: [
      {
        text: "make the colors more vibrant and saturated",
        description: "Boost color intensity for eye-catching visuals",
        icon: Palette,
        color: "from-rainbow-500 to-rainbow-600",
      },
      {
        text: "convert to black and white with high contrast",
        description: "Classic monochrome with dramatic contrast",
        icon: Palette,
        color: "from-gray-600 to-gray-800",
      },
      {
        text: "warm up the color temperature for a cozy feel",
        description: "Add warmth with golden, comfortable tones",
        icon: Palette,
        color: "from-yellow-400 to-orange-500",
      },
      {
        text: "cool down the colors for a modern, clean look",
        description: "Cool blue tones for contemporary styling",
        icon: Palette,
        color: "from-blue-400 to-cyan-500",
      },
    ],
    effects: [
      {
        text: "add film grain and vignette for an artistic look",
        description: "Professional film texture with focused edges",
        icon: Vintage,
        color: "from-gray-500 to-gray-700",
      },
      {
        text: "apply motion blur to create dynamic energy",
        description: "Movement effect for action and speed",
        icon: Zap,
        color: "from-red-500 to-orange-500",
      },
      {
        text: "sharpen the details for crystal clear quality",
        description: "Enhanced edge definition and clarity",
        icon: Focus,
        color: "from-green-500 to-teal-500",
      },
      {
        text: "reduce noise while preserving important details",
        description: "Clean up grain without losing sharpness",
        icon: Sparkles,
        color: "from-purple-500 to-pink-500",
      },
    ],
    transform: [
      {
        text: "rotate 90 degrees clockwise and crop the edges",
        description: "Fix orientation and remove unwanted borders",
        icon: RotateCw,
        color: "from-blue-500 to-indigo-500",
      },
      {
        text: "resize to 1080p while maintaining aspect ratio",
        description: "HD quality scaling with proper proportions",
        icon: Focus,
        color: "from-green-500 to-emerald-500",
      },
      {
        text: "flip horizontally to mirror the image",
        description: "Horizontal reflection for creative effect",
        icon: RotateCw,
        color: "from-purple-500 to-pink-500",
      },
      {
        text: "stabilize the footage to remove camera shake",
        description: "Smooth out handheld camera movement",
        icon: Focus,
        color: "from-teal-500 to-cyan-500",
      },
    ],
  };

  const categories = [
    { id: "popular", name: "Popular", icon: Star },
    { id: "color", name: "Color", icon: Palette },
    { id: "effects", name: "Effects", icon: Sparkles },
    { id: "transform", name: "Transform", icon: RotateCw },
  ];

  const handleExampleClick = (exampleText) => {
    onPromptChange(exampleText);
    setShowExamples(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !loading && !disabled) {
      onProcess();
    }
  };

  const isValidPrompt = prompt.trim().length >= 10;
  const wordCount = prompt
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wand2 className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Describe Your Vision
        </h3>
        <p className="text-gray-600">
          Tell our AI what you want to achieve with your video. Use natural
          language – no technical knowledge required!
        </p>
      </div>

      {/* Prompt Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe what you want to do with your video... For example: 'make this look vintage with sepia tones and film grain' or 'brighten the video and add a soft blur effect'"
            rows={4}
            disabled={disabled || loading}
            className={`w-full px-4 py-4 border rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
              disabled
                ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                : "bg-white"
            } ${
              prompt.trim() && !isValidPrompt
                ? "border-warning-300"
                : "border-gray-300"
            }`}
          />

          {/* Character/Word Counter */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-3 text-sm">
            {prompt.trim() && !isValidPrompt && (
              <span className="text-warning-600 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Too short
              </span>
            )}
            <span
              className={`${wordCount > 0 ? "text-gray-600" : "text-gray-400"}`}
            >
              {wordCount} words
            </span>
          </div>
        </div>

        {/* AI Processing Info */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                AI Processing
              </h4>
              <p className="text-sm text-gray-600">
                Our Gemini AI will analyze your description, select the
                appropriate tools, and create an optimal processing workflow
                automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!isValidPrompt || loading || disabled}
          whileHover={!disabled && isValidPrompt ? { scale: 1.02 } : {}}
          whileTap={!disabled && isValidPrompt ? { scale: 0.98 } : {}}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-3 ${
            isValidPrompt && !disabled && !loading
              ? "bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              <span>Processing with AI...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Start AI Processing</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </form>

      {/* Example Prompts */}
      <div className="border-t border-gray-200 pt-6">
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-gray-900">
              Need inspiration? Browse examples
            </span>
          </div>
          {showExamples ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>

        <AnimatePresence>
          {showExamples && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-4"
            >
              {/* Category Tabs */}
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Examples Grid */}
              <div className="grid md:grid-cols-2 gap-3">
                {promptExamples[selectedCategory]?.map((example, index) => {
                  const Icon = example.icon;

                  return (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleExampleClick(example.text)}
                      disabled={disabled || loading}
                      className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${example.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                            "{example.text}"
                          </p>
                          <p className="text-sm text-gray-600">
                            {example.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2" />
          Pro Tips for Better Results
        </h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Be specific about the mood or style you want (vintage, modern,
              cinematic, etc.)
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Mention specific effects like "sepia tones," "film grain," or
              "soft blur"
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              You can combine multiple effects: "brighten and add vintage film
              grain"
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Use natural language – our AI understands creative descriptions
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PromptInput;
