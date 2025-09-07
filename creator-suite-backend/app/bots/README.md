# Creator Suite Bots

This directory contains bot implementations for Discord, Telegram, and WhatsApp that integrate with the Creator Suite video generation platform.

## Features

- **Video Generation**: Generate videos using Runway Gen-3 Alpha with 8+ second duration
- **Credit System**: Check credit balance and manage payments
- **Razorpay Integration**: Top-up credits via secure payment gateway
- **Multi-Platform**: Support for Discord, Telegram, and WhatsApp
- **User Authentication**: Secure login system integrated with main API

## Bots Overview

### Discord Bot (`discord_bot.py`)
- Slash commands for all operations
- Interactive embeds and buttons
- Real-time generation progress updates
- Video preview and download links

**Commands:**
- `/login` - Login to your Creator Suite account
- `/credits` - Check your credit balance
- `/topup` - Top-up credits via Razorpay
- `/generate` - Generate a video with Runway Gen-3 Alpha
- `/help` - Show help information

### Telegram Bot (`telegram_bot.py`)
- Command-based interface
- Inline keyboards for quick actions
- Progress updates during generation
- Direct video delivery

**Commands:**
- `/start` - Welcome message and overview
- `/login email password` - Login to your account
- `/credits` - Check credit balance
- `/topup amount` - Top-up credits
- `/generate duration prompt` - Generate video
- `/help` - Show help information

### WhatsApp Bot (`whatsapp_bot.py`)
- Interactive button responses
- State-based conversation flow
- Direct video messaging
- Payment link delivery

**Commands:**
- `START`, `HELLO`, `HI` - Welcome message
- `LOGIN` - Start login process
- `CREDITS` - Check credit balance
- `TOPUP` - Top-up credits
- `GENERATE` - Generate video
- `HELP` - Show help information

## Setup Instructions

### 1. Install Dependencies

```bash
cd creator-suite-backend
pip install discord.py python-telegram-bot aiohttp razorpay
```

Or update via uv:
```bash
uv sync
```

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.bots.example .env.bots
```

Fill in your actual API keys and tokens in `.env.bots`:

```bash
# API Configuration
API_BASE_URL=http://localhost:8000/api/v1

# Runway Gen-3 Alpha
RUNWAY_API_KEY=your_runway_api_key_here
RUNWAY_GEN3_SERVICE_ID=5

# Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_APPLICATION_ID=your_discord_application_id_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# WhatsApp Bot
WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token_here
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id_here

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
```

### 3. Set Up Bot Platforms

#### Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token to `DISCORD_BOT_TOKEN`
5. Copy the application ID to `DISCORD_APPLICATION_ID`
6. Enable "Message Content Intent" under "Privileged Gateway Intents"
7. Generate invite link with permissions:
   - Send Messages
   - Use Slash Commands
   - Embed Links
   - Attach Files

#### Telegram Bot Setup
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Use `/newbot` command to create a new bot
3. Follow the prompts to set bot name and username
4. Copy the bot token to `TELEGRAM_BOT_TOKEN`

#### WhatsApp Bot Setup
1. Set up [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
2. Get your phone number ID and access token
3. Set up webhook URL pointing to your server: `https://yourdomain.com/webhook`
4. Configure verify token for webhook verification
5. Update the environment variables accordingly

### 4. Set Up Runway Gen-3 Alpha
1. Sign up at [Runway](https://runwayml.com/)
2. Get your API key from the dashboard
3. Copy the API key to `RUNWAY_API_KEY`

### 5. Set Up Razorpay
1. Sign up at [Razorpay](https://razorpay.com/)
2. Get your key ID and secret from dashboard
3. Set up webhook endpoint: `https://yourdomain.com/api/v1/payments/webhook`
4. Copy credentials to respective variables

### 6. Add Runway Service to Database

Run the service setup script:
```bash
python scripts/add_runway_gen3_service.py
```

### 7. Run the Bots

#### Discord Bot
```bash
python scripts/run_discord_bot.py
```

#### Telegram Bot
```bash
python scripts/run_telegram_bot.py
```

#### WhatsApp Bot
```bash
python scripts/run_whatsapp_bot.py
```

## Usage Examples

### Discord Bot Usage
1. Invite the bot to your Discord server
2. Use `/login` to authenticate
3. Check credits with `/credits`
4. Generate a video: `/generate duration:10 prompt:A cat playing with a ball`

### Telegram Bot Usage
1. Start a chat with your bot
2. Send `/login your@email.com yourpassword`
3. Check credits: `/credits`
4. Generate video: `/generate 10 A cat playing with a ball`

### WhatsApp Bot Usage
1. Send "LOGIN" to start authentication
2. Follow the prompts to enter email and password
3. Send "CREDITS" to check balance
4. Send "GENERATE" and follow prompts for video creation

## Video Generation Specifications

- **Model**: Runway Gen-3 Alpha Turbo
- **Duration**: 8-240 seconds (8 seconds to 4 minutes)
- **Resolutions**: 1280x768, 768x1280, 1024x1024
- **Format**: MP4
- **Cost**: $0.50 per second
- **Generation Time**: 1-5 minutes typically (longer for 4-minute videos)

## Payment Integration

The bots support credit top-up via Razorpay:
- Minimum amount: $1.00
- Automatic currency conversion (USD to INR)
- 15-minute payment link expiry
- Real-time payment status updates
- Automatic credit addition upon successful payment

## Error Handling

All bots include comprehensive error handling:
- Authentication failures
- Insufficient credits
- Invalid input validation
- API failures and timeouts
- Payment processing errors

## Monitoring and Logs

Each bot generates detailed logs for:
- User authentication attempts
- Video generation requests
- Payment transactions
- Error conditions
- Performance metrics

## Security Features

- Token-based authentication
- Secure payment processing
- Input validation and sanitization
- Rate limiting protection
- Webhook signature verification

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if the bot token is correct
   - Verify the bot has necessary permissions
   - Check if the main API server is running

2. **Authentication failures**
   - Verify API_BASE_URL is correct
   - Check if user credentials are valid
   - Ensure the main API server is accessible

3. **Payment issues**
   - Verify Razorpay credentials
   - Check webhook URL configuration
   - Ensure webhook endpoint is accessible

4. **Video generation failures**
   - Check Runway API key
   - Verify user has sufficient credits
   - Check if Runway service is active

### Debug Mode

To enable debug logging, set the logging level in each bot:
```python
logging.basicConfig(level=logging.DEBUG)
```

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include logging for debugging
4. Test thoroughly before deployment
5. Update documentation for new features

## Support

For issues and questions:
1. Check the logs for error details
2. Verify all environment variables are set
3. Test API endpoints manually
4. Contact the development team with specific error messages

## License

This project is part of the Creator Suite platform. Please refer to the main project license for usage terms.
