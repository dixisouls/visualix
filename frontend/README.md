# Visualix Frontend

A stunning React frontend for the Visualix AI-powered video editing platform.
Built with modern web technologies for the smoothest user experience known to
man.

## 🚀 Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Processing**: Live updates during video processing with
  WebSocket-like polling
- **Drag & Drop Upload**: Intuitive file upload with progress tracking
- **AI-Powered Interface**: Natural language prompt input with smart suggestions
- **Job Management**: Complete job history with filtering and search
- **Status Streaming**: Real-time progress updates and tool execution monitoring
- **Auto-cleanup**: Automatic job cleanup on page close/refresh
- **Modern UI**: Glass morphism, smooth animations, and premium visual effects

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks and concurrent features
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Framer Motion** - Smooth animations and micro-interactions
- **React Router** - Client-side routing with seamless navigation
- **Axios** - HTTP client with request/response interceptors
- **React Dropzone** - Drag and drop file uploads
- **React Hot Toast** - Beautiful notification system
- **Lucide React** - Consistent and beautiful icons

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
│   ├── index.html         # HTML template with SEO optimization
│   └── favicon.ico        # App icon
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Navbar.jsx     # Navigation with status indicators
│   │   ├── Footer.jsx     # Footer with tech stack info
│   │   ├── VideoUpload.jsx # File upload with validation
│   │   ├── PromptInput.jsx # AI prompt interface
│   │   ├── ProcessingStatus.jsx # Real-time job status
│   │   ├── VideoPreview.jsx # Video preview and metadata
│   │   ├── JobHistory.jsx  # Job management interface
│   │   └── CleanupHandler.jsx # Auto-cleanup on exit
│   ├── pages/             # Main application pages
│   │   ├── HomePage.jsx   # Landing page with features
│   │   ├── ToolsPage.jsx  # Tool catalog and documentation
│   │   ├── ProcessPage.jsx # Main processing interface
│   │   └── NotFoundPage.jsx # 404 error page
│   ├── context/           # React context for state management
│   │   └── JobContext.jsx # Global job state and actions
│   ├── services/          # API and external services
│   │   └── api.js         # Backend API integration
│   ├── App.jsx            # Main app component
│   ├── index.js           # App entry point
│   └── index.css          # Global styles and utilities
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` to match your backend URL:

   ```env
   REACT_APP_API_URL=http://localhost:8000/api/v1
   ```

3. **Start development server**:

   ```bash
   npm start
   ```

4. **Open your browser**: Navigate to `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Serve production build locally (optional)
npx serve -s build
```

## 🎨 Design System

### Color Palette

- **Primary**: Blue gradient (`#0ea5e9` to `#3b82f6`)
- **Secondary**: Purple gradient (`#8b5cf6` to `#a855f7`)
- **Success**: Green (`#22c55e`)
- **Warning**: Yellow (`#f59e0b`)
- **Error**: Red (`#ef4444`)

### Typography

- **Font Family**: Inter (primary), JetBrains Mono (code)
- **Font Weights**: 300, 400, 500, 600, 700, 800

### Components

- **Cards**: Rounded corners, subtle shadows, hover effects
- **Buttons**: Multiple variants with smooth transitions
- **Forms**: Clean inputs with focus states
- **Status Badges**: Color-coded job status indicators

## 🔄 State Management

### Job Context

The app uses React Context for global state management:

- **Current Job**: Active video processing job
- **Job History**: List of previous jobs with filtering
- **Loading States**: UI loading indicators
- **Error Handling**: Centralized error management

### API Integration

- **Axios Interceptors**: Automatic error handling and logging
- **Real-time Updates**: Polling for job status updates
- **File Upload**: Progress tracking with FormData
- **Auto-retry**: Failed requests with exponential backoff

## 🎯 Key Features

### Smart Video Upload

- Drag & drop interface with visual feedback
- File validation (format, size, type)
- Progress tracking with visual indicators
- Error handling with helpful messages

### AI Prompt Interface

- Natural language input with examples
- Smart suggestions based on categories
- Real-time validation and character counting
- Example prompts for different use cases

### Real-time Processing

- Live progress updates during processing
- Tool execution monitoring
- Estimated time remaining
- Current step visualization

### Job Management

- Complete job history with search/filter
- Job status tracking and notifications
- Download processed videos
- Delete jobs with cleanup

### Auto-cleanup System

- Automatic job deletion on page close
- Browser refresh detection
- Unload event handling
- Background job management

## 🔧 Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App

### Code Style

- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting
- **Tailwind**: Utility-first CSS classes
- **Components**: Functional components with hooks

### Performance Optimizations

- **Lazy Loading**: Route-based code splitting
- **Image Optimization**: Responsive images with proper formats
- **Bundle Analysis**: Webpack bundle analyzer
- **Caching**: Service worker for offline capability

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## 📱 Responsive Design

The app is fully responsive with breakpoints:

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Mobile Features

- Touch-friendly interface
- Optimized upload experience
- Collapsible navigation
- Responsive video player

## 🚀 Deployment

### Build Process

```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Files will be in /build directory
```

### Environment Variables

- `REACT_APP_API_URL` - Backend API base URL
- `REACT_APP_GOOGLE_ANALYTICS_ID` - Analytics tracking ID
- `REACT_APP_SENTRY_DSN` - Error tracking DSN

### Deployment Platforms

- **Vercel**: `npm run build` then deploy build folder
- **Netlify**: Connect GitHub repo for auto-deployment
- **AWS S3**: Upload build folder to S3 bucket
- **Docker**: Use multi-stage build with nginx

## 🔐 Security

- **Input Validation**: Client-side validation for all inputs
- **XSS Prevention**: Sanitized user inputs
- **CSRF Protection**: CSRF tokens for state-changing operations
- **Content Security Policy**: Restricted resource loading
- **HTTPS**: Enforced secure connections in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙋‍♂️ Support

- **GitHub Issues**: Report bugs and request features
- **Email**: contact@visualix.ai
- **Documentation**: Check the backend API docs

---

**Built with ❤️ by [dixisouls](https://github.com/dixisouls)**
