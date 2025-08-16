# Visualix Setup Guide

## 🎯 Quick Start

Your Visualix backend is fully built and ready to use! Here's how to get
started:

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
# Required
GEMINI_API_KEY=your_actual_api_key_here

# Optional (defaults shown)
DEBUG=false
HOST=localhost
PORT=8000
MAX_FILE_SIZE=104857600  # 100MB
```

### 3. Start the Server

```bash
# Activate virtual environment
source venv/bin/activate

# Start the server
python app/main.py
```

The server will start at `http://localhost:8000`

### 4. Test the API

Visit these URLs in your browser:

- **API Documentation**: `http://localhost:8000/docs` (Interactive Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

## 🔧 What's Built

### ✅ Complete Backend System

- **25+ OpenCV Tools**: All video processing capabilities ready
- **Gemini AI Integration**: Natural language prompt analysis
- **Smart Workflow Engine**: Automated tool sequencing
- **RESTful API**: Full FastAPI implementation
- **File Management**: Secure upload/storage/cleanup
- **Job Tracking**: Real-time progress monitoring

### 📋 Available Tools

**Color Tools (5 tools)**:

- Brightness/Contrast adjustment
- Saturation control
- HSV manipulation
- Professional color grading

**Filter Tools (5 tools)**:

- Blur effects (simple, Gaussian, motion)
- Sharpening and enhancement
- Noise reduction

**Effect Tools (5 tools)**:

- Vintage effects (sepia, film grain, vignette)
- Retro 80s/90s styling
- Artistic transformations

**Transform Tools (5 tools)**:

- Resize with aspect ratio control
- Rotation with angle specification
- Cropping and region extraction
- Flipping and perspective correction

### 🎬 Example Usage

1. **Upload Video**:

```bash
curl -X POST "http://localhost:8000/api/v1/video/upload" \
  -F "file=@your-video.mp4"
```

2. **Process with Natural Language**:

```bash
curl -X POST "http://localhost:8000/api/v1/video/process" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "your-job-id-from-upload",
    "prompt": "make this look vintage with sepia tones and film grain"
  }'
```

3. **Check Status**:

```bash
curl "http://localhost:8000/api/v1/jobs/status/your-job-id"
```

4. **Download Result**:

```bash
curl "http://localhost:8000/api/v1/video/result/your-job-id" \
  --output processed_video.mp4
```

## 🤖 Natural Language Examples

The AI understands these types of prompts:

- **Simple Effects**: "brighten this video", "add blur", "make it black and
  white"
- **Complex Combinations**: "make it vintage with sepia tones, film grain, and
  vignette"
- **Professional**: "increase contrast in midtones, reduce shadows, enhance
  highlights"
- **Creative**: "apply retro 80s styling with neon glow effects"
- **Corrections**: "rotate 90 degrees and crop to remove black bars"

## 📁 Project Structure

```
visualix/
├── app/                    # Main application
│   ├── api/               # FastAPI endpoints
│   ├── core/              # Utilities and exceptions
│   ├── models/            # Data models
│   ├── services/          # Business logic
│   │   ├── gemini_agent.py       # AI prompt analysis
│   │   └── video_processor.py    # Job management
│   ├── tools/             # 25+ OpenCV tools
│   │   ├── color_tools.py
│   │   ├── filter_tools.py
│   │   ├── effect_tools.py
│   │   └── transform_tools.py
│   ├── workflows/         # Workflow orchestration
│   └── main.py            # Application entry point
├── uploads/               # Video uploads (auto-created)
├── outputs/               # Processed videos (auto-created)
├── temp/                  # Temporary files (auto-created)
└── logs/                  # Application logs (auto-created)
```

## 🔍 Testing

Run the built-in test suite:

```bash
python test_app.py
```

This verifies all components are working correctly.

## 🚀 Production Deployment

For production use:

1. **Environment Variables**:

   - Set `DEBUG=false`
   - Use a production-ready database instead of in-memory storage
   - Configure Redis for job queuing

2. **Security**:

   - Use HTTPS
   - Set up proper CORS origins
   - Implement authentication if needed

3. **Scaling**:
   - Use Gunicorn or similar WSGI server
   - Set up load balancing for multiple workers
   - Configure external storage for large files

## 🆘 Troubleshooting

**Common Issues**:

1. **"GEMINI_API_KEY not configured"**

   - Ensure your `.env` file has the correct API key
   - Check that the key is valid in Google AI Studio

2. **"Directory not found" errors**

   - The app automatically creates required directories
   - Ensure you have write permissions in the project folder

3. **Import errors**

   - Run from the project root directory
   - Ensure virtual environment is activated

4. **Processing fails**
   - Check video format is supported (mp4, avi, mov, etc.)
   - Verify file size is under the limit (100MB default)
   - Check logs in `logs/` directory for detailed errors

## 📞 Support

- **API Docs**: Visit `/docs` endpoint for interactive documentation
- **Logs**: Check `logs/visualix.log` and `logs/errors.log`
- **Test Suite**: Run `python test_app.py` to verify setup

---

**🎉 Your Visualix backend is ready for action!**
