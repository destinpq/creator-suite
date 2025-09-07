# Creator Suite - Complete Deployment Guide

## Required API Keys and Setup

### 1. Core Video Generation
- **Runway API Key**: Get from [Runway Dashboard](https://runwayml.com/)
  - Sign up for Runway account
  - Navigate to API section
  - Generate API key
  - Environment variable: `RUNWAY_API_KEY`

### 2. Payment Gateway
- **Razorpay**: Get from [Razorpay Dashboard](https://dashboard.razorpay.com/)
  - Key ID: `RAZORPAY_KEY_ID`
  - Key Secret: `RAZORPAY_KEY_SECRET`
  - Webhook Secret: `RAZORPAY_WEBHOOK_SECRET`

### 3. Bot Platforms

#### Discord Bot
- **Discord Developer Portal**: [Discord Applications](https://discord.com/developers/applications)
  - Create new application
  - Go to "Bot" section
  - Get bot token: `DISCORD_BOT_TOKEN`
  - Get application ID: `DISCORD_APPLICATION_ID`
  - Enable Message Content Intent

#### Telegram Bot
- **BotFather**: Message [@BotFather](https://t.me/BotFather) on Telegram
  - Use `/newbot` command
  - Get bot token: `TELEGRAM_BOT_TOKEN`

#### WhatsApp Business API
- **Meta Business**: [Meta for Developers](https://developers.facebook.com/)
  - Set up WhatsApp Business API
  - Get access token: `WHATSAPP_ACCESS_TOKEN`
  - Get phone number ID: `WHATSAPP_PHONE_NUMBER_ID`
  - Set verify token: `WHATSAPP_VERIFY_TOKEN`

#### Instagram API (New!)
- **Instagram Basic Display API**: [Instagram Developers](https://developers.facebook.com/docs/instagram-basic-display-api)
  - Create Facebook App
  - Add Instagram Basic Display product
  - Get access token: `INSTAGRAM_ACCESS_TOKEN`
  - Get app ID: `INSTAGRAM_APP_ID`
  - Get app secret: `INSTAGRAM_APP_SECRET`

### 4. Database & Storage
- **PostgreSQL**: Database for user data, videos, transactions
- **Azure Blob Storage**: For video file storage
  - Connection string: `AZURE_STORAGE_CONNECTION_STRING`
  - Container name: `AZURE_STORAGE_CONTAINER`

### 5. Email & Notifications
- **SendGrid** (optional): For email notifications
  - API key: `SENDGRID_API_KEY`

## Environment Variables Template

```bash
# Core API
API_BASE_URL=https://yourdomain.com/api/v1
FRONTEND_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/creator_suite

# Runway Gen-3 Alpha
RUNWAY_API_KEY=your_runway_api_key_here
RUNWAY_GEN3_SERVICE_ID=5

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
WHATSAPP_BOT_PORT=8001

# Instagram API
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret

# Storage
AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string
AZURE_STORAGE_CONTAINER=videos

# Optional
SENDGRID_API_KEY=your_sendgrid_api_key
```

## Deployment Steps

### 1. Domain Setup
- Purchase domain (e.g., yourdomain.com)
- Set up SSL certificate
- Configure DNS records

### 2. Server Setup
- Deploy backend API to cloud service (AWS, Azure, GCP)
- Deploy frontend to CDN (Vercel, Netlify)
- Set up database (managed PostgreSQL)

### 3. Webhook Configuration
- Set up webhook endpoints for payments
- Configure bot webhooks for WhatsApp/Instagram
- Test all integrations

### 4. Go Live Checklist
- [ ] All API keys configured
- [ ] Database migrations run
- [ ] Payment gateway tested
- [ ] All bots working
- [ ] Frontend deployed
- [ ] SSL certificates active
- [ ] Webhook endpoints responding
- [ ] Video storage working
- [ ] User registration working
- [ ] Credit system functional

## Security Considerations
- Use environment variables for all secrets
- Enable HTTPS everywhere
- Implement rate limiting
- Set up monitoring and logging
- Regular security updates
- Backup strategies for database and videos
