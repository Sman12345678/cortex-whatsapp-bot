# WhatsApp AI Bot - Deployment Guide

## 📋 Prerequisites

### 1. GitHub Repository Setup
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: WhatsApp AI Bot"
git branch -M main
git remote add origin https://github.com/yourusername/whatsapp-ai-bot.git
git push -u origin main
```

### 2. Required API Keys & Credentials

#### A. Google Gemini API Key (Required)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

#### B. WhatsApp Business API (Required for full functionality)
1. Create a [Meta Business Account](https://business.facebook.com/)
2. Set up WhatsApp Business API
3. Get the following credentials:
   - Phone Number ID
   - Access Token
   - App ID
   - App Secret
   - Verify Token (you create this)

## 🚀 Deployment Options

### Option 1: Railway (Recommended)
1. Fork/clone your repository
2. Go to [Railway](https://railway.app/)
3. Create new project from GitHub
4. Add environment variables (see below)
5. Deploy automatically

### Option 2: Heroku
1. Create a Heroku account
2. Install Heroku CLI
3. Create new app: `heroku create your-app-name`
4. Set environment variables: `heroku config:set KEY=value`
5. Deploy: `git push heroku main`

### Option 3: DigitalOcean App Platform
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy with one click

## 🔧 Environment Variables

Create these environment variables in your deployment platform:

### Required Variables
```
GEMINI_API_KEY=AIzaSy...your_gemini_key_here
WHATSAPP_PHONE_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx
WHATSAPP_APP_ID=1234567890123456
WHATSAPP_APP_SECRET=abcdef1234567890abcdef1234567890
WHATSAPP_VERIFY_TOKEN=your_secure_verify_token_123
WEBHOOK_URL=https://your-app-name.railway.app
BOT_ADMIN_PHONE=+1234567890
SESSION_SECRET=your_super_secret_session_key_here
```

### Optional Variables
```
BOT_PREFIX=/
BOT_NAME=WhatsApp AI Bot
MAX_FILE_SIZE=16777216
MAX_REQUESTS_PER_MINUTE=30
DATABASE_URL=sqlite:///whatsapp_bot.db
FLASK_ENV=production
FLASK_DEBUG=false
```

## 📁 Dependencies

Your project uses these main dependencies (from `pyproject.toml`):

```python
flask>=3.1.1
flask-sqlalchemy>=3.1.1
google-genai>=1.25.0
gunicorn>=23.0.0
pywa>=2.11.0
pillow>=11.3.0
pypdf2>=3.0.1
python-dotenv>=1.1.1
requests>=2.32.4
pyyaml>=6.0.2
beautifulsoup4>=4.13.4
psycopg2-binary>=2.9.10
pydantic>=2.11.7
sqlalchemy>=2.0.41
werkzeug>=3.1.3
```

## 🔐 Security Checklist

- [ ] Never commit `.env` file to GitHub
- [ ] Use strong, unique SESSION_SECRET
- [ ] Set FLASK_ENV=production for deployment
- [ ] Use HTTPS for webhook URL
- [ ] Restrict admin phone number access
- [ ] Use PostgreSQL for production database

## 🌐 WhatsApp Webhook Configuration

After deployment:

1. Copy your app URL (e.g., `https://your-app.railway.app`)
2. Go to Meta Business Manager
3. Navigate to WhatsApp > Configuration
4. Set webhook URL: `https://your-app.railway.app/webhook`
5. Set verify token (same as WHATSAPP_VERIFY_TOKEN)
6. Subscribe to message events

## 📊 Database Setup

### Development (SQLite)
- Default: `sqlite:///whatsapp_bot.db`
- Automatically created on first run

### Production (PostgreSQL)
```
DATABASE_URL=postgresql://user:password@host:port/database
```

## 🧪 Testing Your Deployment

1. Visit your app URL to see the admin dashboard
2. Send a WhatsApp message to your business number
3. Check dashboard for message statistics
4. Test commands like `/help` and `/start`
5. Try uploading a file or image for AI analysis

## 🐛 Troubleshooting

### Common Issues

1. **Bot not responding to messages**
   - Check webhook URL is correct
   - Verify WHATSAPP_ACCESS_TOKEN is valid
   - Check Meta Business Manager webhook settings

2. **Database errors**
   - Ensure DATABASE_URL is correct
   - Check database permissions
   - Verify database server is running

3. **AI features not working**
   - Verify GEMINI_API_KEY is correct
   - Check API quota limits
   - Ensure network connectivity

4. **Admin features not accessible**
   - Verify BOT_ADMIN_PHONE matches your number
   - Check phone number format (+1234567890)
   - Ensure user exists in database

## 📈 Monitoring

### Built-in Analytics
- Visit `/` for admin dashboard
- Real-time stats at `/api/stats`
- User activity monitoring
- File processing statistics

### Logs
- Check application logs in your deployment platform
- Monitor webhook delivery attempts
- Track API usage and errors

## 🔄 Updates and Maintenance

### Updating the Bot
1. Make changes to your code
2. Commit and push to GitHub
3. Auto-deploy triggers on most platforms
4. Monitor logs for any issues

### Database Migrations
- The bot automatically creates tables on startup
- For schema changes, consider using Flask-Migrate
- Always backup production data before updates

## 🤝 Support

For issues:
1. Check logs in your deployment platform
2. Verify all environment variables are set
3. Test webhook connectivity
4. Review Meta Business Manager settings

## 📝 Additional Notes

- The bot runs in demo mode without WhatsApp credentials
- All AI features work with just GEMINI_API_KEY
- Admin dashboard is accessible even in demo mode
- File processing supports 15+ formats
- Built-in rate limiting and security features