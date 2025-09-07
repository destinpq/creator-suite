# 🎬 Creator Suite - Multi-Platform AI Video Generation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-00C7B7.svg)](https://fastapi.tiangolo.com/)

A comprehensive AI-powered video generation platform that enables users to create professional videos using **Runway Gen-3 Alpha** through multiple interfaces: **Discord**, **Telegram**, **WhatsApp**, **Instagram**, and a **Web Platform**.

## ✨ Features

### 🎥 Video Generation
- **Runway Gen-3 Alpha Integration**: High-quality AI video generation up to 30 minutes
- **Seed Image Support**: Generate videos from reference images
- **8-Second Segment System**: Precise credit-based pricing (1 credit = 8 seconds)
- **Multiple Resolutions**: Landscape, Portrait, and Square formats
- **Advanced Prompting**: Professional keyword system for optimal results

### 🤖 Multi-Platform Bots
- **Discord Bot**: Slash commands and interactive buttons
- **Telegram Bot**: Inline commands and file sharing
- **WhatsApp Business API**: Webhook-based messaging
- **Instagram API**: Direct message integration
- **Unified Commands**: Consistent experience across all platforms

### 🎨 Video Editing
- **Segment-Based Editing**: Edit specific 8-second segments
- **Trim & Extend**: Modify video duration
- **Replace Segments**: Update specific parts with new prompts
- **Cost-Effective**: Pay only for edited segments

### 💳 Payment & Credits
- **Razorpay Integration**: Secure payment processing
- **Credit System**: Transparent pricing model
- **Bulk Discounts**: Save on larger credit purchases
- **Transaction History**: Track all credit usage

### 🌐 Web Platform
- **React Frontend**: Modern, responsive interface
- **Video Gallery**: Browse and manage your creations
- **Advanced Editor**: Drag-and-drop video editing
- **Prompt Templates**: Pre-built prompts for quick generation
- **Analytics Dashboard**: Track usage and performance

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL
- Redis (for caching)

### 1. Clone Repository
```bash
git clone https://github.com/destinpq/creator-suite.git
cd creator-suite
```

### 2. Backend Setup
```bash
cd creator-suite-backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see DEPLOYMENT.md)

# Run database migrations
alembic upgrade head

# Start the backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd creator-suite-frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4. Start Bots
```bash
cd creator-suite-backend
python scripts/run_all_bots.py
```

## 🔧 Configuration

### Required API Keys

Create a `.env` file in `creator-suite-backend/` with:

```bash
# Core API
DATABASE_URL=postgresql://user:password@localhost:5432/creator_suite
RUNWAY_API_KEY=your_runway_api_key

# Razorpay Payment
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_APPLICATION_ID=your_discord_app_id

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Instagram API
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret

# Storage
AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string
```

See `DEPLOYMENT.md` for detailed setup instructions for each API.

## 📱 Bot Commands

All platforms support these commands:

### Video Generation
```
/generate <duration> <prompt>
```
- **Duration**: Must be multiple of 8 (8, 16, 24, 32, 40...)
- **Prompt**: Descriptive text for video content
- **Example**: `/generate 16 cinematic shot of a dragon flying over mountains at sunset`

### Video Editing
```
/edit <video_id> <action>
```
- **Actions**: trim, add_segment, remove_segment, replace_segment
- **Example**: `/edit abc123 trim 0 16`

### Credit Management
```
/balance          # Check credit balance
/topup            # Purchase more credits
/history          # View transaction history
```

### Help & Examples
```
/help             # Show all commands
/examples         # See prompt examples
/keywords         # View keyword guide
```

## 🎯 Prompt Engineering

### Professional Structure
```
[SHOT TYPE] + [SUBJECT] + [ACTION] + [SETTING] + [LIGHTING] + [STYLE] + [CAMERA MOVEMENT]
```

### Example Prompts
```bash
# Cinematic
"close-up cinematic shot of a young woman looking up at falling snow, soft diffused lighting, hyperrealistic, slow zoom in"

# Nature
"epic wide shot of a lone figure walking across vast sand dunes at sunset, dramatic golden hour lighting, aerial view"

# Urban
"dynamic tracking shot following a person running through neon-lit cyberpunk streets, vibrant neon lighting, handheld camera"
```

### Keywords Reference

#### Shot Types
- `cinematic shot`, `epic wide shot`, `close-up portrait`, `aerial view`, `macro shot`

#### Lighting
- `golden hour`, `blue hour`, `dramatic lighting`, `soft diffused light`, `neon lighting`

#### Camera Movement
- `slow zoom in`, `smooth pan left`, `tracking shot`, `handheld camera`, `static shot`

See `RUNWAY_PROMPTING_GUIDE.md` for comprehensive keyword reference.

## 💰 Pricing

### Credit System
- **1 Credit = 8 Seconds** of video generation
- **Minimum Duration**: 8 seconds (1 credit)
- **Maximum Duration**: 1800 seconds / 30 minutes (225 credits)

### Example Costs
| Duration | Credits | Approximate Cost |
|----------|---------|------------------|
| 8 seconds | 1 credit | $0.10 |
| 16 seconds | 2 credits | $0.20 |
| 32 seconds | 4 credits | $0.40 |
| 2 minutes | 15 credits | $1.50 |
| 5 minutes | 38 credits | $3.80 |
| 30 minutes | 225 credits | $22.50 |

### Editing Costs
- **Trim Video**: Free
- **Add/Remove/Replace Segment**: 1 credit per affected segment

## 🏗️ Architecture

### Backend (FastAPI)
```
creator-suite-backend/
├── app/
│   ├── api/v1/              # API endpoints
│   ├── bots/                # Bot implementations
│   ├── creator_suite/       # Core video generation
│   ├── models/              # Database models
│   ├── services/            # Business logic
│   └── core/                # Configuration & security
├── migrations/              # Database migrations
└── scripts/                 # Utility scripts
```

### Frontend (React + Ant Design)
```
creator-suite-frontend/
├── src/
│   ├── components/          # Reusable components
│   ├── pages/               # Page components
│   ├── services/            # API services
│   └── models/              # TypeScript interfaces
└── public/                  # Static assets
```

### Bot Platforms
- **Discord**: `discord.py` with slash commands
- **Telegram**: `python-telegram-bot` with handlers
- **WhatsApp**: Business API with webhooks
- **Instagram**: Basic Display API with messaging

## 🔌 API Endpoints

### Video Generation
```bash
POST /api/v1/video/generate
GET  /api/v1/video/my-videos
GET  /api/v1/video/gallery
POST /api/v1/video/edit
```

### Payment Integration
```bash
POST /api/v1/payments/create
GET  /api/v1/payments/status/{payment_id}
POST /api/v1/credits/apply-promo
```

### Bot Management
```bash
POST /api/v1/bots/discord/start
POST /api/v1/bots/telegram/webhook
GET  /api/v1/bots/status
```

## 🧪 Testing

### Backend Tests
```bash
cd creator-suite-backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd creator-suite-frontend
npm test
```

### Bot Integration Tests
```bash
python -m pytest tests/test_bots.py -v
```

## 🚀 Deployment

### Production Setup
1. **Domain & SSL**: Configure your domain with SSL certificate
2. **Environment Variables**: Set all required API keys
3. **Database**: Set up managed PostgreSQL instance
4. **Bot Webhooks**: Configure webhook URLs for each platform
5. **Payment Gateway**: Set up Razorpay webhooks
6. **File Storage**: Configure Azure Blob Storage for videos

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Cloud Deployment
- **Backend**: Deploy to AWS ECS, Azure Container Instances, or Google Cloud Run
- **Frontend**: Deploy to Vercel, Netlify, or AWS S3 + CloudFront
- **Database**: Use managed PostgreSQL (AWS RDS, Azure Database, etc.)

See `DEPLOYMENT.md` for detailed production deployment guide.

## 📊 Monitoring & Analytics

### Built-in Analytics
- **Video Generation Stats**: Track usage patterns
- **Credit Consumption**: Monitor spending trends
- **Bot Performance**: Message response times
- **User Engagement**: Gallery views and likes

### Logging
- **Structured Logging**: JSON format for easy parsing
- **Error Tracking**: Automatic error capture and reporting
- **Performance Metrics**: API response times and throughput

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use TypeScript for frontend components
- Write comprehensive tests
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Deployment Guide](DEPLOYMENT.md)
- [Prompt Engineering Guide](RUNWAY_PROMPTING_GUIDE.md)
- [API Documentation](http://localhost:8000/docs)

### Community
- **Discord**: [Join our Discord server](https://discord.gg/creator-suite)
- **GitHub Issues**: Report bugs and request features
- **Email Support**: support@creator-suite.com

### FAQ

**Q: What's the maximum video duration?**
A: 30 minutes (1800 seconds), costing 225 credits.

**Q: Can I use my own images?**
A: Yes! Upload seed images to guide video generation.

**Q: How do I get API keys?**
A: See `DEPLOYMENT.md` for step-by-step instructions for each platform.

**Q: Is there a free tier?**
A: New users receive 10 welcome credits (80 seconds of video).

**Q: Can I edit videos after generation?**
A: Yes! Use segment-based editing to modify specific parts.

---

<div align="center">

**🎬 Built with ❤️ for creators worldwide**

[Website](https://creator-suite.com) • [Documentation](./DEPLOYMENT.md) • [Discord](https://discord.gg/creator-suite) • [Twitter](https://twitter.com/creator_suite)

</div>
