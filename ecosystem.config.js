// PM2 Process Manager Config
// วาง file นี้ที่ /home/deploy/wds/ บน VPS
module.exports = {
  apps: [
    {
      name: 'wds',
      script: '.next/standalone/apps/web/server.js',
      cwd: '/home/deploy/wds',
      instances: 'max',        // ใช้ทุก CPU core
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        // ตั้งค่า env vars จริงใน /home/deploy/wds/.env.production
        // หรือใส่ใน pm2 env โดยตรง (ไม่แนะนำ — ใช้ .env แทน)
      },
      error_file: '/var/log/pm2/wds-error.log',
      out_file: '/var/log/pm2/wds-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
}
