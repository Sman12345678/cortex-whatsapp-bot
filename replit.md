# WhatsApp AI Bot

## Overview

This is a comprehensive WhatsApp AI bot application built with Node.js, Baileys library, and Google Gemini AI. The bot provides AI-powered chat capabilities, file analysis, image processing, interactive games with inline buttons, and administrative features for managing users and groups. Recently converted from Python to Node.js for better performance and real-time capabilities.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## System Architecture

### Backend Architecture
- **Framework**: Flask web application with SQLAlchemy ORM
- **Database**: SQLite (configured for easy migration to PostgreSQL)
- **WhatsApp Integration**: PyWA library for WhatsApp Business API
- **AI Service**: Google Gemini AI for chat, file analysis, and image processing
- **Session Management**: Flask sessions with configurable secret keys

### Frontend Architecture
- **Admin Dashboard**: Server-side rendered HTML templates with Bootstrap
- **Real-time Updates**: JavaScript-based dashboard with Chart.js for analytics
- **Responsive Design**: Bootstrap 5 with dark theme optimized for Replit

### Authentication & Authorization
- **User Management**: Phone number-based user identification
- **Admin System**: Role-based access control with admin privileges
- **Rate Limiting**: In-memory rate limiting to prevent API abuse
- **User Banning**: Admin capability to ban/unban users

## Key Components

### 1. WhatsApp Bot Core (`bot.py`)
- **Problem**: Need to handle various WhatsApp message types and route them appropriately
- **Solution**: PyWA framework with message handlers for text, images, documents, and commands
- **Features**: User creation/management, message logging, command routing

### 2. AI Service Integration (`gemini_service.py`)
- **Problem**: Provide intelligent responses and file analysis capabilities
- **Solution**: Google Gemini AI with different models for chat vs analysis
- **Models Used**:
  - Chat: gemini-2.5-flash (fast responses)
  - Analysis: gemini-2.5-pro (detailed analysis)
  - Image Generation: gemini-2.0-flash-preview-image-generation

### 3. File Processing System (`file_processor.py`)
- **Problem**: Handle various file types for AI analysis
- **Solution**: Multi-format file processor supporting PDF, text, code files, JSON, CSV, XML, YAML
- **Features**: Content extraction, file validation, size limits, type detection

### 4. Command System (`commands/`)
- **Problem**: Organize bot functionality into manageable commands
- **Solution**: Modular command system with base classes and specialized handlers
- **Commands**: Start, Help, Admin panel, Group management, AI interactions

### 5. Analytics System (`analytics.py`)
- **Problem**: Track bot usage and performance metrics
- **Solution**: Database-driven analytics with real-time dashboard
- **Metrics**: User counts, message statistics, AI request tracking, uptime monitoring

### 6. Admin Dashboard (`templates/dashboard.html`)
- **Problem**: Provide web interface for bot management
- **Solution**: Flask-rendered dashboard with Bootstrap UI and live updates
- **Features**: User management, broadcast messages, analytics visualization

## Data Flow

### Message Processing Flow
1. WhatsApp sends webhook to Flask app
2. PyWA processes message and determines type
3. User lookup/creation in database
4. Message logging and validation
5. Command parsing or AI processing
6. Response generation and delivery
7. Analytics logging

### File Analysis Flow
1. User sends document/image to bot
2. File download and validation
3. Content extraction based on file type
4. AI analysis with appropriate Gemini model
5. Structured response with insights
6. File processing metrics storage

### Admin Operations Flow
1. Admin command validation
2. Permission checking
3. Database operations (user management, stats)
4. Response formatting with admin-specific UI
5. Action logging for audit trail

## External Dependencies

### Core Dependencies
- **PyWA**: WhatsApp Business API integration
- **Google Generative AI**: AI chat and analysis capabilities
- **Flask + SQLAlchemy**: Web framework and database ORM
- **PyPDF2**: PDF content extraction
- **BeautifulSoup4**: HTML parsing
- **PyYAML**: YAML file processing

### Configuration Requirements
- WhatsApp Business API credentials (Phone ID, Access Token, App ID/Secret)
- Google Gemini API key
- Webhook URL for WhatsApp integration
- Bot admin phone number for initial admin access

### Rate Limiting
- 30 requests per minute per user (configurable)
- 16MB maximum file size
- Supported file types: PDF, TXT, HTML, JS, PY, JSON, CSV, MD, XML, YAML, YML, LOG, CSS, JAVA, CPP, C, PHP, RB, GO, RS, SWIFT
- Supported image types: JPG, JPEG, PNG, GIF, WEBP

## Deployment Strategy

### Environment Setup
- **Database**: SQLite for development, easily configurable for PostgreSQL production
- **Environment Variables**: Comprehensive config system via `.env` file
- **Static Assets**: Bootstrap CDN for UI components, Chart.js for analytics
- **File Storage**: Local filesystem (can be extended to cloud storage)

### Scalability Considerations
- **Database**: Models designed for easy PostgreSQL migration
- **Rate Limiting**: Currently in-memory (should migrate to Redis for production)
- **File Processing**: Temporary file handling with cleanup
- **Session Management**: Flask sessions (consider Redis for distributed deployment)

### Security Features
- **Input Sanitization**: All user inputs validated and sanitized
- **File Validation**: Strict file type and size limits
- **Admin Controls**: Role-based access with secure phone number verification
- **Error Handling**: Comprehensive logging without exposing sensitive data

The application follows a modular architecture that separates concerns while maintaining simplicity for development and deployment on Replit.