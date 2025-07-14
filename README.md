# 🤖 WhatsApp AI Bot

A powerful and comprehensive WhatsApp bot built with Flask, PyWa, and Google Gemini AI featuring extensive file processing, admin controls, and engaging chat capabilities.

## ✨ Features

### 🧠 AI-Powered Chat
- **Intelligent Conversations**: Powered by Google Gemini AI
- **Context-Aware Responses**: Maintains conversation context
- **Personality**: Fun and engaging chat experience
- **Multi-language Support**: Works in multiple languages

### 📁 Advanced File Processing
- **15+ File Formats**: PDF, HTML, JS, PY, TXT, JSON, CSV, MD, XML, YAML, and more
- **AI Analysis**: Intelligent content extraction and analysis
- **Image Processing**: Visual content analysis and description
- **File Validation**: Size limits and security checks

### 🎯 Command System
- **Configurable Prefix**: Default `/` (customizable)
- **Admin Commands**: User management, broadcasting, statistics
- **Group Management**: Kick, ban, mute, promote/demote users
- **Help System**: Interactive command documentation

### 👑 Admin Features
- **Real-time Dashboard**: Professional web interface
- **User Management**: Ban/unban users, admin privileges
- **Broadcasting**: Send messages to all users
- **Analytics**: Comprehensive bot usage statistics
- **Live Monitoring**: Real-time stats and activity tracking

### 🔒 Security & Performance
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Secure file and message processing
- **Error Handling**: Robust error management
- **Session Management**: Secure user sessions

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Google Gemini API Key
- WhatsApp Business API credentials (optional for demo)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whatsapp-ai-bot.git
   cd whatsapp-ai-bot
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Run the bot**
   ```bash
   python main.py
   ```

5. **Access dashboard**
   - Visit `http://localhost:5000` for the admin dashboard

## 🔧 Configuration

### Required Environment Variables

```bash
# Google Gemini AI (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# WhatsApp Business API (Required for full functionality)
WHATSAPP_PHONE_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_APP_ID=your_app_id
WHATSAPP_APP_SECRET=your_app_secret
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Bot Configuration
WEBHOOK_URL=https://yourdomain.com
BOT_ADMIN_PHONE=+1234567890
SESSION_SECRET=your_session_secret
```

### Optional Configuration

```bash
BOT_PREFIX=/
BOT_NAME=WhatsApp AI Bot
MAX_FILE_SIZE=16777216
MAX_REQUESTS_PER_MINUTE=30
DATABASE_URL=sqlite:///whatsapp_bot.db
```

## 📊 Dashboard Features

### Real-time Statistics
- Total users and messages
- Active users and groups
- AI request counts
- File processing statistics
- Bot uptime monitoring

### Interactive Charts
- Daily message activity
- Message type distribution
- Popular commands usage
- User engagement metrics

### Admin Controls
- User management interface
- Broadcast message system
- Ban/unban functionality
- Real-time activity monitoring

## 🤖 Bot Commands

### Basic Commands
- `/start` - Welcome message and bot introduction
- `/help` - Complete command documentation
- `/stats` - Bot usage statistics (admin only)

### Admin Commands
- `/admin` - Admin control panel
- `/broadcast` - Send message to all users
- `/ban @user` - Ban a user
- `/unban @user` - Unban a user

### Group Management
- `/kick @user` - Remove user from group
- `/mute @user` - Mute user in group
- `/unmute @user` - Unmute user
- `/promote @user` - Promote to admin
- `/demote @user` - Remove admin privileges

## 🔄 File Processing

### Supported Formats
- **Documents**: PDF, TXT, HTML, MD, LOG
- **Code Files**: JS, PY, JSON, XML, YAML, CSS
- **Data Files**: CSV, JSON, XML, YAML
- **Images**: JPG, PNG, GIF, WEBP
- **Programming**: Java, CPP, C, PHP, RB, GO, RS, Swift

### AI Analysis Features
- Content extraction and summarization
- Code analysis and documentation
- Data structure analysis
- Image description and analysis
- Key insights and recommendations

## 🚀 Deployment

### Platform Options
- **Railway** (Recommended)
- **Heroku**
- **DigitalOcean App Platform**
- **Google Cloud Run**
- **AWS Elastic Beanstalk**

### Quick Deploy Links

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/whatsapp-ai-bot)

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/yourusername/whatsapp-ai-bot)

### Detailed Deployment Guide
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

## 🏗️ Architecture

### Technology Stack
- **Backend**: Flask, SQLAlchemy, PyWa
- **AI**: Google Gemini API
- **Database**: SQLite (development), PostgreSQL (production)
- **Frontend**: Bootstrap 5, Chart.js
- **Deployment**: Gunicorn, Docker-ready

### Project Structure
```
whatsapp-ai-bot/
├── commands/           # Bot command handlers
├── templates/          # HTML templates
├── static/            # CSS, JS, assets
├── utils/             # Utility functions
├── models.py          # Database models
├── bot.py             # WhatsApp bot logic
├── app.py             # Flask application
├── analytics.py       # Statistics and analytics
├── gemini_service.py  # AI service integration
├── file_processor.py  # File processing utilities
├── config.py          # Configuration management
└── main.py            # Application entry point
```

## 📈 Analytics

### Built-in Metrics
- User registration and activity
- Message counts and types
- Command usage statistics
- File processing analytics
- AI request tracking
- Group activity monitoring

### Real-time Dashboard
- Live user counts
- Message activity charts
- Popular commands
- Processing statistics
- System uptime

## 🔐 Security

### Data Protection
- Input sanitization and validation
- File type and size restrictions
- Rate limiting and abuse prevention
- Secure session management
- Error handling without data exposure

### Access Control
- Admin privilege system
- User ban/unban functionality
- Command permission checks
- Secure webhook verification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](docs/api.md)
- [Configuration Guide](docs/config.md)

### Getting Help
- Open an issue for bug reports
- Join our community discussions
- Check the troubleshooting guide

## 🎯 Roadmap

- [ ] Voice message processing
- [ ] Multi-language command support
- [ ] Advanced analytics dashboard
- [ ] Custom AI model integration
- [ ] Webhook event logging
- [ ] API rate limiting dashboard

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/Sman12345678/whatsapp-ai-bot)
![GitHub forks](https://img.shields.io/github/forks/Sman12345678/whatsapp-ai-bot)
![GitHub issues](https://img.shields.io/github/issues/Sman12345678/whatsapp-ai-bot)
![GitHub license](https://img.shields.io/github/license/Sman12345678/whatsapp-ai-bot)

---

Made with ❤️ by [Suleiman](https://github.com/Sman12345678)
