# BotForge — Deployment Guide

This document covers how BotForge is deployed on AWS EC2 and how to update or maintain it.

---

## Infrastructure Overview

| Component | Details |
|---|---|
| **Server** | AWS EC2 m5a.large (2 vCPU, 8GB RAM) |
| **OS** | Ubuntu 24.04 LTS |
| **Region** | ap-south-1 (Mumbai) |
| **Public IP** | 13.233.44.37 |
| **BotForge URL** | http://13.233.44.37:8444 |

### Services on the server

| Service | Port | Managed by |
|---|---|---|
| stock-agent (Spring Boot) | 8080 | systemd |
| **BotForge (Spring Boot)** | **8081** | **systemd** |
| PostgreSQL 16 | 5432 | systemd |
| Redis 7 | 6379 | systemd |
| Nginx | 80, 443, 8444 | systemd |

---

## How It's Set Up

### Nginx routing

- **Port 80/443** → stock-agent (existing service, unchanged)
- **Port 8444** → BotForge (Angular static files + API proxy)

The BotForge Nginx block serves Angular's `index.html` for all routes (SPA routing) and proxies `/api/` to the Spring Boot backend on port 8081 with SSE buffering disabled.

Config file: `/etc/nginx/sites-available/botforge`

### BotForge systemd service

The Spring Boot JAR runs as a systemd service so it:
- Starts automatically on server reboot
- Restarts automatically if it crashes
- Logs to `/home/ubuntu/botforge/logs/botforge.log`

Service file: `/etc/systemd/system/botforge.service`

### File locations on the server

```
/home/ubuntu/botforge/
├── botforge.jar          Spring Boot JAR (the backend)
├── botforge.env          Environment variables (secrets)
├── uploads/              Uploaded PDFs and files
└── logs/
    └── botforge.log      Application logs

/var/www/botforge/        Angular build output (static files served by Nginx)
```

---

## Deploying an Update

When you make code changes and want to deploy them to production, follow these steps.

### 1. Build locally

```bash
# Backend
cd backend
mvn package -DskipTests
# Output: target/botforge-0.0.1-SNAPSHOT.jar

# Frontend
cd frontend
npm run build -- --configuration production
# Output: dist/botforge-frontend/browser/
```

### 2. Copy files to the server

```bash
# Copy the JAR
scp -i ~/.ssh/stock-agent-pem.pem \
  backend/target/botforge-0.0.1-SNAPSHOT.jar \
  ubuntu@13.233.44.37:~/botforge/botforge.jar

# Copy the Angular build
scp -i ~/.ssh/stock-agent-pem.pem -r \
  frontend/dist/botforge-frontend/browser/* \
  ubuntu@13.233.44.37:/var/www/botforge/
```

### 3. Restart the backend service

```bash
ssh -i ~/.ssh/stock-agent-pem.pem ubuntu@13.233.44.37 \
  "sudo systemctl restart botforge && sudo systemctl status botforge"
```

### 4. Verify it's running

```bash
ssh -i ~/.ssh/stock-agent-pem.pem ubuntu@13.233.44.37 \
  "curl -s http://localhost:8081/actuator/health"
# Expected: {"status":"UP"}
```

---

## First-Time Setup (Reference)

This was already done. Documented here for if you ever need to set up a fresh server.

### Install dependencies

```bash
sudo apt-get update
sudo apt-get install -y postgresql-16-pgvector redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Create the database

```bash
sudo -u postgres psql <<SQL
CREATE USER botforge WITH PASSWORD 'botforge_secret';
CREATE DATABASE botforge OWNER botforge;
GRANT ALL PRIVILEGES ON DATABASE botforge TO botforge;
\c botforge
CREATE EXTENSION IF NOT EXISTS vector;
GRANT ALL ON SCHEMA public TO botforge;
SQL
```

### Create the environment file

```bash
mkdir -p ~/botforge
cat > ~/botforge/botforge.env << 'EOF'
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/botforge
SPRING_DATASOURCE_USERNAME=botforge
SPRING_DATASOURCE_PASSWORD=botforge_secret
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379
OPENAI_API_KEY=sk-...
JWT_SECRET=your-long-random-secret-key-here
UPLOAD_DIR=/home/ubuntu/botforge/uploads
EOF
chmod 600 ~/botforge/botforge.env
```

### Create the systemd service

```bash
sudo tee /etc/systemd/system/botforge.service << 'EOF'
[Unit]
Description=BotForge AI Chatbot Platform
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/botforge
EnvironmentFile=/home/ubuntu/botforge/botforge.env
ExecStart=/usr/bin/java -Xms256m -Xmx512m -jar /home/ubuntu/botforge/botforge.jar
Restart=on-failure
RestartSec=10
StandardOutput=append:/home/ubuntu/botforge/logs/botforge.log
StandardError=append:/home/ubuntu/botforge/logs/botforge.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable botforge
```

### Create the Nginx config

```bash
sudo tee /etc/nginx/sites-available/botforge << 'EOF'
server {
    listen 8444;
    server_name _;

    root /var/www/botforge;
    index index.html;

    location /api/ {
        proxy_pass         http://127.0.0.1:8081;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_buffering    off;
        proxy_cache        off;
        proxy_read_timeout 300s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/botforge /etc/nginx/sites-enabled/botforge
sudo nginx -t && sudo systemctl reload nginx
```

---

## Maintenance

### View live logs

```bash
ssh -i ~/.ssh/stock-agent-pem.pem ubuntu@13.233.44.37 \
  "tail -f ~/botforge/logs/botforge.log"
```

### Restart services

```bash
ssh -i ~/.ssh/stock-agent-pem.pem ubuntu@13.233.44.37 "sudo systemctl restart botforge"
ssh -i ~/.ssh/stock-agent-pem.pem ubuntu@13.233.44.37 "sudo systemctl restart nginx"
```

### Check service status

```bash
ssh -i ~/.ssh/stock-agent-pem.pem ubuntu@13.233.44.37 \
  "sudo systemctl status botforge redis-server postgresql nginx"
```

### Check disk space

```bash
ssh -i ~/.ssh/stock-agent-pem.pem ubuntu@13.233.44.37 "df -h /"
```

> **Warning:** The root volume is 6.8GB. Currently ~55% used. If it gets above 80%, expand the EBS volume in the AWS console.

### Database backup

```bash
ssh -i ~/.ssh/stock-agent-pem.pem ubuntu@13.233.44.37 \
  "sudo -u postgres pg_dump botforge | gzip > ~/botforge/backups/botforge-\$(date +%Y%m%d).sql.gz"
```

---

## EC2 Security Group

The following ports must be open in the AWS security group:

| Port | Protocol | Source | Purpose |
|---|---|---|---|
| 22 | TCP | Your IP | SSH access |
| 80 | TCP | 0.0.0.0/0 | HTTP (stock-agent redirect) |
| 443 | TCP | 0.0.0.0/0 | HTTPS (stock-agent) |
| 8444 | TCP | 0.0.0.0/0 | BotForge dashboard + API |

---

## Environment Variables in Production

The file `/home/ubuntu/botforge/botforge.env` holds all secrets. It is:
- Owned by `ubuntu`, permissions `600` (only owner can read)
- **Not committed to git**

If you need to update a secret (e.g. rotate the OpenAI key):

```bash
ssh -i ~/.ssh/stock-agent-pem.pem ubuntu@13.233.44.37
nano ~/botforge/botforge.env     # edit the value
sudo systemctl restart botforge  # restart to pick up changes
```
