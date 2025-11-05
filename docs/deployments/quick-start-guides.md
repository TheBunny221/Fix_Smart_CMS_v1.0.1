# Quick Start Deployment Guides

> **Navigation**: [← Back to Main Index](README.md) | [Common Setup →](common-setup.md) | [Linux Guide →](linux-deployment.md) | [Windows Guide →](windows-deployment.md)

## Overview

These quick start guides provide streamlined deployment paths for common scenarios. Choose the guide that best matches your deployment needs.

---

## 🚀 Quick Start Options

### [Production Linux Server](#production-linux-server-quick-start)
**Time: 30-45 minutes** | **Difficulty: Intermediate**
- Ubuntu/Debian or CentOS/RHEL server
- Nginx + PM2 + PostgreSQL
- SSL with Let's Encrypt
- Production-ready configuration

### [Development Windows Setup](#development-windows-setup-quick-start)
**Time: 20-30 minutes** | **Difficulty: Beginner**
- Windows 10/11 or Server
- Apache + PM2 + PostgreSQL
- Self-signed SSL for testing
- Development configuration

### [Docker Deployment](#docker-deployment-quick-start)
**Time: 15-20 minutes** | **Difficulty: Beginner**
- Any OS with Docker support
- Containerized deployment
- Automated setup
- Development or production ready

### [Cloud Platform Deployment](#cloud-platform-quick-start)
**Time: 25-35 minutes** | **Difficulty: Intermediate**
- AWS, Azure, or Google Cloud
- Managed database services
- Load balancer integration
- Auto-scaling ready

---

## Production Linux Server Quick Start

### Prerequisites Checklist
- [ ] Fresh Ubuntu 18.04+ or CentOS 7+ server
- [ ] Root or sudo access
- [ ] Domain name pointing to server IP
- [ ] Ports 80, 443, 22 open in firewall

### Step 1: System Preparation (5 minutes)
```bash
# Update system
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
sudo yum update -y                      # CentOS/RHEL

# Install essential packages
sudo apt install -y curl wget git build-essential  # Ubuntu/Debian
sudo yum install -y curl wget git gcc gcc-c++ make # CentOS/RHEL
```

### Step 2: Install Core Software (10 minutes)
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs  # Ubuntu/Debian
# For CentOS/RHEL: curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo yum install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib  # Ubuntu/Debian
sudo yum install -y postgresql-server postgresql-contrib && sudo postgresql-setup initdb  # CentOS/RHEL

# Install Nginx
sudo apt install -y nginx  # Ubuntu/Debian
sudo yum install -y nginx   # CentOS/RHEL

# Install PM2
sudo npm install -g pm2

# Start services
sudo systemctl start postgresql nginx
sudo systemctl enable postgresql nginx
```

### Step 3: Database Setup (5 minutes)
```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE fix_smart_cms;
CREATE USER cms_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE fix_smart_cms TO cms_user;
\q
EOF
```

### Step 4: Application Deployment (10 minutes)
```bash
# Clone and setup application
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/your-org/fix-smart-cms.git
sudo chown -R $USER:$USER fix-smart-cms
cd fix-smart-cms

# Install dependencies and build
npm install
npm run build

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Setup database
npx prisma migrate deploy
npm run seed
```

### Step 5: Web Server Configuration (5 minutes)
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/fix-smart-cms << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL configuration will be added by Certbot
    
    location / {
        proxy_pass http://127.0.0.1:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/fix-smart-cms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### Step 6: SSL Certificate (5 minutes)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu/Debian
sudo yum install -y certbot python3-certbot-nginx  # CentOS/RHEL

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 7: Start Application (5 minutes)
```bash
# Start with PM2
pm2 start ecosystem.prod.config.cjs --env production
pm2 save
pm2 startup  # Follow the instructions

# Test deployment
curl http://localhost:4005/api/health
curl https://your-domain.com/api/health
```

### ✅ Verification Checklist
- [ ] Application responds at `https://your-domain.com`
- [ ] SSL certificate is valid (green lock icon)
- [ ] PM2 shows application as "online": `pm2 status`
- [ ] Database connection works: `psql -h localhost -U cms_user -d fix_smart_cms -c "SELECT version();"`
- [ ] Logs are clean: `pm2 logs` and `sudo tail -f /var/log/nginx/error.log`

---

## Development Windows Setup Quick Start

### Prerequisites Checklist
- [ ] Windows 10/11 Pro or Windows Server 2019/2022
- [ ] Administrator access
- [ ] Internet connection
- [ ] PowerShell execution policy set to RemoteSigned

### Step 1: Install Package Manager (3 minutes)
```powershell
# Install Chocolatey (run as Administrator)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Verify installation
choco --version
```

### Step 2: Install Core Software (10 minutes)
```powershell
# Install Node.js, PostgreSQL, Git, and Apache
choco install nodejs-lts postgresql git apache-httpd -y

# Install PM2
npm install -g pm2

# Verify installations
node --version
psql --version
git --version
httpd -v
```

### Step 3: Configure Services (5 minutes)
```powershell
# Start PostgreSQL service
Start-Service -Name "postgresql-x64-14"
Set-Service -Name "postgresql-x64-14" -StartupType Automatic

# Start Apache service
Start-Service -Name "Apache2.4"
Set-Service -Name "Apache2.4" -StartupType Automatic

# Create database
psql -U postgres -c "CREATE DATABASE fix_smart_cms;"
psql -U postgres -c "CREATE USER cms_user WITH ENCRYPTED PASSWORD 'dev_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE fix_smart_cms TO cms_user;"
```

### Step 4: Application Setup (8 minutes)
```powershell
# Create application directory
New-Item -ItemType Directory -Path "C:\inetpub\fix-smart-cms" -Force
cd "C:\inetpub\fix-smart-cms"

# Clone repository
git clone https://github.com/your-org/fix-smart-cms.git .

# Install dependencies
npm install
npm run build

# Configure environment
Copy-Item ".env.example" ".env"
# Edit .env file with development settings

# Setup database
npx prisma migrate deploy
npm run seed
```

### Step 5: Configure Apache (4 minutes)
```powershell
# Create virtual host configuration
$apacheConfig = @"
<VirtualHost *:80>
    ServerName localhost
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://127.0.0.1:4005/
    ProxyPassReverse / http://127.0.0.1:4005/
</VirtualHost>
"@

$apacheConfig | Out-File -FilePath "C:\Apache24\conf\extra\fix-smart-cms.conf" -Encoding UTF8

# Include in main configuration
Add-Content -Path "C:\Apache24\conf\httpd.conf" -Value "Include conf/extra/fix-smart-cms.conf"

# Test and restart Apache
& "C:\Apache24\bin\httpd.exe" -t
Restart-Service -Name "Apache2.4"
```

### Step 6: Start Application (2 minutes)
```powershell
# Start application with PM2
pm2 start ecosystem.prod.config.cjs --env development
pm2 save

# Test deployment
Invoke-WebRequest -Uri "http://localhost:4005/api/health"
Invoke-WebRequest -Uri "http://localhost/api/health"
```

### ✅ Verification Checklist
- [ ] Application responds at `http://localhost`
- [ ] PM2 shows application as "online": `pm2 status`
- [ ] Database connection works
- [ ] Apache service is running: `Get-Service -Name "Apache2.4"`
- [ ] No errors in logs: `pm2 logs`

---

## Docker Deployment Quick Start

### Prerequisites Checklist
- [ ] Docker and Docker Compose installed
- [ ] 4GB+ RAM available
- [ ] Ports 80, 443, 5432 available

### Step 1: Get Docker Configuration (2 minutes)
```bash
# Clone repository
git clone https://github.com/your-org/fix-smart-cms.git
cd fix-smart-cms

# Copy environment file
cp .env.example .env.docker
# Edit .env.docker with your settings
```

### Step 2: Build and Start Services (10 minutes)
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 3: Initialize Database (3 minutes)
```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Seed initial data
docker-compose -f docker-compose.prod.yml exec app npm run seed
```

### ✅ Verification Checklist
- [ ] All containers are running: `docker-compose ps`
- [ ] Application responds: `curl http://localhost/api/health`
- [ ] Database is accessible: `docker-compose exec db psql -U cms_user -d fix_smart_cms -c "SELECT version();"`

---

## Cloud Platform Quick Start

### AWS Deployment with RDS and ELB

#### Prerequisites Checklist
- [ ] AWS CLI configured
- [ ] EC2 key pair created
- [ ] Domain name in Route 53 (optional)

#### Step 1: Launch EC2 Instance (5 minutes)
```bash
# Launch Ubuntu instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-your-security-group \
  --subnet-id subnet-your-subnet \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=fix-smart-cms}]'
```

#### Step 2: Create RDS Database (10 minutes)
```bash
# Create PostgreSQL RDS instance
aws rds create-db-instance \
  --db-instance-identifier fix-smart-cms-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username cms_admin \
  --master-user-password your-secure-password \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-your-db-security-group
```

#### Step 3: Deploy Application (15 minutes)
```bash
# SSH to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Follow Linux Quick Start steps 1-4
# Modify .env to use RDS endpoint:
# DATABASE_URL="postgresql://cms_admin:password@your-rds-endpoint:5432/postgres"
```

#### Step 4: Configure Load Balancer (5 minutes)
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name fix-smart-cms-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-your-alb-security-group

# Create target group and register EC2 instance
aws elbv2 create-target-group \
  --name fix-smart-cms-targets \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-your-vpc
```

### ✅ Verification Checklist
- [ ] EC2 instance is running and accessible
- [ ] RDS database is available
- [ ] Application responds through load balancer
- [ ] SSL certificate is configured (if using HTTPS)

---

## Troubleshooting Quick Reference

### Common Issues and Solutions

#### Application Won't Start
```bash
# Check logs
pm2 logs
tail -f /var/log/nginx/error.log  # Linux
Get-Content "C:\Apache24\logs\error.log" -Tail 20  # Windows

# Check ports
sudo netstat -tlnp | grep :4005  # Linux
netstat -an | findstr :4005      # Windows

# Restart services
pm2 restart all
sudo systemctl restart nginx     # Linux
Restart-Service -Name "Apache2.4"  # Windows
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U cms_user -d fix_smart_cms -c "SELECT version();"

# Check PostgreSQL service
sudo systemctl status postgresql  # Linux
Get-Service -Name "postgresql*"   # Windows

# Reset database password
sudo -u postgres psql -c "ALTER USER cms_user PASSWORD 'new_password';"
```

#### SSL Certificate Problems
```bash
# Check certificate validity
openssl x509 -in /path/to/cert.crt -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew --dry-run

# Test SSL configuration
curl -I https://your-domain.com
```

#### Performance Issues
```bash
# Check system resources
htop                    # Linux
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10  # Windows

# Monitor PM2 processes
pm2 monit

# Check database performance
psql -U cms_user -d fix_smart_cms -c "SELECT * FROM pg_stat_activity;"
```

---

## Next Steps

After completing your quick start deployment:

1. **Security Hardening**: Review [Security Best Practices](file-references.md#security-best-practices-summary)
2. **Performance Optimization**: Configure caching and monitoring
3. **Backup Setup**: Implement automated database and file backups
4. **Monitoring**: Set up application and infrastructure monitoring
5. **Documentation**: Document your specific configuration and customizations

### Additional Resources

- **[Complete Deployment Guides](README.md)** - Detailed platform-specific instructions
- **[Configuration Reference](file-references.md)** - All configuration files explained
- **[Troubleshooting Guide](linux-deployment.md#troubleshooting-common-issues)** - Comprehensive problem-solving
- **[Performance Tuning](linux-deployment.md#performance-optimization-and-monitoring)** - Optimization techniques

---

**Need Help?** 
- Check the [troubleshooting sections](#troubleshooting-quick-reference) above
- Review the complete deployment guides for your platform
- Consult the [configuration file references](file-references.md) for detailed explanations