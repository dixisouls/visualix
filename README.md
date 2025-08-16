# Visualix - Gemini-Powered Video Editor

A sophisticated video processing application that uses Google Gemini AI to
analyze natural language prompts and orchestrate OpenCV operations through
LangGraph workflows.

## 🚀 Features

- **Natural Language Processing**: Describe video edits in plain English
- **AI-Powered Workflow Planning**: Gemini AI selects and sequences appropriate
  tools
- **Comprehensive Video Processing**: 25+ OpenCV tools for effects, filters, and
  transformations
- **LangGraph Orchestration**: Advanced workflow management with state tracking
- **Real-time Progress Tracking**: Monitor job status and progress
- **RESTful API**: Complete FastAPI-based backend with comprehensive endpoints

## 📋 Available Tools

### Color Tools

- **Brightness/Contrast Adjustment**: Control image brightness and contrast
- **Saturation Control**: Adjust color intensity and vibrancy
- **HSV Manipulation**: Fine-tune Hue, Saturation, and Value independently
- **Color Grading**: Professional shadows/midtones/highlights control

### Filter Tools

- **Blur Effects**: Simple blur, Gaussian blur, motion blur
- **Sharpening**: Enhance detail and edge definition
- **Noise Reduction**: Remove grain while preserving edges

### Effect Tools

- **Vintage Effects**: Sepia tones, film grain, vignetting
- **Retro Styling**: 80s/90s aesthetic with color shifts and glow
- **Artistic Filters**: Creative transformations for unique looks

### Transform Tools

- **Resize**: Scale videos with aspect ratio control
- **Rotation**: Rotate by any angle with expansion options
- **Cropping**: Extract specific regions
- **Flipping**: Horizontal, vertical, or both
- **Perspective**: Correct camera angles or create artistic distortion

## 🛠️ Installation & Setup

### Prerequisites

- Python 3.8+
- Google Gemini API Key
- Redis (optional, for advanced job queuing)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd visualix
source venv/bin/activate  # Virtual environment is pre-created
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configuration

Create a `.env` file based on the example:

```bash
# Copy the example configuration
cp .env.example .env

# Edit with your settings
nano .env
```

Required configuration:

```env
GEMINI_API_KEY=your_gemini_api_key_here
DEBUG=false
HOST=localhost
PORT=8000
```

### 4. Start the Application

```bash
python app/main.py
```

The API will be available at `http://localhost:8000`

## 📖 API Usage

### 1. Upload Video

```bash
curl -X POST "http://localhost:8000/api/v1/video/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your-video.mp4" \
  -F "description=My awesome video"
```

Response:

```json
{
  "job_id": "uuid-string",
  "message": "Video uploaded successfully",
  "video_metadata": {
    "filename": "your-video.mp4",
    "format": "mp4",
    "size": 1048576,
    "duration": 10.5,
    "width": 1920,
    "height": 1080,
    "fps": 30.0
  }
}
```

### 2. Process Video with Natural Language

```bash
curl -X POST "http://localhost:8000/api/v1/video/process" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "your-job-id",
    "prompt": "make this look vintage with sepia tones and film grain",
    "priority": 1
  }'
```

### 3. Check Processing Status

```bash
curl -X GET "http://localhost:8000/api/v1/jobs/status/your-job-id"
```

Response:

```json
{
  "job_id": "your-job-id",
  "status": "completed",
  "progress": 100,
  "message": "Video processing completed successfully",
  "output_url": "/api/v1/video/result/your-job-id",
  "workflow_execution": {
    "workflow_id": "your-job-id",
    "gemini_reasoning": "I'll apply vintage effects...",
    "planned_tools": ["apply_sepia", "add_film_grain", "add_vignette"],
    "executed_tools": [...],
    "total_execution_time": 45.2,
    "success": true
  }
}
```

### 4. Download Processed Video

```bash
curl -X GET "http://localhost:8000/api/v1/video/result/your-job-id" \
  --output processed_video.mp4
```

## 💭 Example Prompts

The AI understands natural language descriptions:

- **Color Adjustments**: "brighten this video and increase contrast"
- **Vintage Effects**: "make it look like old film with sepia and grain"
- **Blur Effects**: "add a soft blur for dreamy effect"
- **Artistic**: "apply retro 80s styling with neon colors"
- **Corrections**: "rotate 90 degrees clockwise and crop the edges"
- **Combinations**: "make it black and white, increase contrast, add vignette"

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FastAPI       │    │   Gemini Agent   │    │   LangGraph     │
│   Endpoints     │───▶│   Prompt         │───▶│   Workflow      │
│                 │    │   Analysis       │    │   Engine        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                                │
         ▼                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│   Video         │                              │   OpenCV        │
│   Storage       │                              │   Tools         │
│                 │                              │   (25+ tools)   │
└─────────────────┘                              └─────────────────┘
```

### Core Components

1. **FastAPI Backend**: RESTful API with comprehensive endpoints
2. **Gemini Agent**: AI-powered prompt analysis and workflow planning
3. **LangGraph Engine**: State-managed workflow orchestration
4. **OpenCV Tools**: 25+ specialized video processing tools
5. **File Management**: Secure upload/storage/cleanup system

## 📊 API Documentation

Interactive API documentation is available at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🔧 Development

### Project Structure

```
app/
├── api/           # FastAPI routes and endpoints
├── core/          # Core utilities and exceptions
├── models/        # Pydantic data models
├── services/      # Business logic services
├── tools/         # OpenCV tool wrappers
├── workflows/     # LangGraph workflow definitions
├── storage/       # File management utilities
└── main.py        # Application entry point
```

### Adding New Tools

1. Create tool class in appropriate module (`tools/`)
2. Inherit from `BaseVideoTool`
3. Implement required methods: `name`, `description`, `parameters`, `execute`
4. Add to `TOOL_REGISTRY` in `tools/__init__.py`

Example:

```python
class CustomEffectTool(BaseVideoTool):
    @property
    def name(self) -> str:
        return "custom_effect"

    @property
    def description(self) -> str:
        return "Apply custom effect to video"

    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string"},
            "strength": {"type": "number", "minimum": 0, "maximum": 1}
        }

    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)

    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        # Your custom processing logic here
        return processed_frame
```

## 🚨 Error Handling

The system includes comprehensive error handling:

- **File validation**: Format, size, and content verification
- **Processing errors**: Tool execution failures with detailed messages
- **API errors**: Structured HTTP responses with error details
- **Workflow recovery**: Partial results and retry capabilities

## 🔐 Security Features

- Input sanitization and validation
- File type restrictions
- Size limits
- Safe filename handling
- Temporary file cleanup

## 📈 Performance

- Asynchronous processing for non-blocking operations
- Background task execution for video processing
- Efficient memory management with frame-by-frame processing
- Configurable resource limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your enhancements
4. Include tests for new functionality
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions:

- Check the API documentation at `/docs`
- Review error messages in the response
- Enable debug mode for detailed logging

---

**Built with ❤️ using FastAPI, OpenCV, Google Gemini, and LangGraph**
