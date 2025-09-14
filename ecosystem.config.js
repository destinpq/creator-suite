module.exports = {
  apps: [
    {
      name: 'creator-suite-frontend',
      script: 'bash',
      args: '-c "cd /home/azureuser/creator-suite/creator-suite-nextjs && ./node_modules/.bin/next start -p 55555"',
      cwd: '/home/azureuser/creator-suite/creator-suite-nextjs',
      env: {
        NODE_ENV: 'production'
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000
    },
    {
      name: 'creator-suite-backend',
      script: '/home/azureuser/creator-suite/creator-suite-backend/start_api.sh',
      cwd: '/home/azureuser/creator-suite/creator-suite-backend',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        PORT: 55556,
        PYTHONUNBUFFERED: '1'
      }
    },
    {
      name: 'creator-suite-bot',
      script: '/home/azureuser/creator-suite/creator-suite-backend/start_bot.sh',
      cwd: '/home/azureuser/creator-suite/creator-suite-backend',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        BOT_PORT: 55557,
        PYTHONUNBUFFERED: '1'
      }
    }
  ]
};
