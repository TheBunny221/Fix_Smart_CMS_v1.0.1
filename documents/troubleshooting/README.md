# Troubleshooting Guide

## Overview

This section contains comprehensive troubleshooting guides for Fix_Smart_CMS v1.0.3, including common issues, error resolution procedures, and debugging techniques based on the latest system architecture and features.

## Quick Navigation

### 🔧 Common Issues
- **[Common Errors](./COMMON_ERRORS.md)** - Frequently encountered errors and solutions
- **[Critical Fixes Summary](./CRITICAL_FIXES_SUMMARY.md)** - Major system fixes and resolutions
- **[Performance Issues](#performance-troubleshooting)** - Performance optimization and debugging
- **[Deployment Issues](#deployment-troubleshooting)** - Deployment-related problems and fixes

### 🚀 Deployment Troubleshooting
- **[SSL Issues](../deployment/SSL_TESTING_GUIDE.md)** - SSL certificate and HTTPS problems
- **[Reverse Proxy Issues](#reverse-proxy-troubleshooting)** - Nginx, Apache2, and IIS problems
- **[Database Connection Issues](#database-troubleshooting)** - Database connectivity problems

## Quick Diagnostic Commands

### System Health Check
```bash
# Check application status
npm run pm2:status

# View application logs
npm run pm2:logs

# Test database connection
npm run validate:db

# Check SSL configuration
curl -Iv https://your-server-ip:443
```

### Service Status Check
```bash
# Linux - Check services
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status pm2-root

# Windows - Check services
sc query "nginx"
sc query "postgresql"
pm2 status
```

## Common Issues and Solutions

### 1. Application Won't Start

#### Symptoms
- PM2 shows app as "errored" or "stopped"
- Cannot access application on port 4005
- Error messages in PM2 logs

#### Diagnostic Steps
```bash
# Check PM2 status
npm run pm2:status

# View detailed logs
npm run pm2:logs

# Check if port is in use
netstat -tulpn | grep :4005  # Linux
netstat -an | findstr :4005  # Windows
```

#### Common Causes & Solutions

**Database Connection Issues:**
```bash
# Check database connection
npm run validate:db

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test PostgreSQL connection
psql -U username -h localhost -d database_name
```

**Missing Dependencies:**
```bash
# Reinstall dependencies
npm ci --production

# Regenerate Prisma client
npm run db:generate
```

**Port Conflicts:**
```bash
# Kill process using port 4005
sudo lsof -ti:4005 | xargs kill -9  # Linux
netstat -ano | findstr :4005        # Windows (note PID and kill)
```

**Environment Configuration:**
```bash
# Check required environment variables
grep -E "DATABASE_URL|JWT_SECRET|NODE_ENV" .env

# Ensure HOST is set for LAN access
echo "HOST=0.0.0.0" >> .env
```

### 2. HTTPS/SSL Issues

#### Symptoms
- Browser shows "Not Secure" warning
- SSL certificate errors
- Cannot access via HTTPS

#### Diagnostic Steps
```bash
# Test SSL certificate
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -noout -dates

# Check certificate chain
openssl s_client -connect localhost:443 -showcerts

# Test HTTPS connectivity
curl -Iv https://localhost:443
```

#### Solutions

**Self-Signed Certificate Issues:**
```bash
# Regenerate self-signed certificate
sudo openssl req -x509 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nlc-cms.key \
  -out /etc/ssl/certs/nlc-cms.crt \
  -days 365 -nodes \
  -subj "/C=IN/ST=Kerala/L=Kochi/O=NLC CMS/CN=your-server-ip"

# Set proper permissions
sudo chmod 600 /etc/ssl/private/nlc-cms.key
sudo chmod 644 /etc/ssl/certs/nlc-cms.crt
```

**Let's Encrypt Issues:**
```bash
# Renew certificate
sudo certbot renew

# Check certificate expiration
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

### 3. Reverse Proxy Issues

#### Symptoms
- 502 Bad Gateway errors
- Cannot access application through reverse proxy
- Proxy returns wrong content

#### Nginx Troubleshooting
```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

**Common Nginx Fixes:**
```bash
# Check upstream configuration
grep -A 5 "upstream nlc_cms" /etc/nginx/sites-available/nlc-cms

# Verify proxy_pass settings
grep "proxy_pass" /etc/nginx/sites-available/nlc-cms

# Test backend connectivity
curl http://localhost:4005/api/health
```

#### Apache2 Troubleshooting
```bash
# Check Apache2 status
sudo systemctl status apache2

# Test Apache2 configuration
sudo apache2ctl configtest

# View Apache2 error logs
sudo tail -f /var/log/apache2/error.log

# Restart Apache2
sudo systemctl restart apache2
```

#### IIS Troubleshooting (Windows)
```cmd
# Check IIS status
iisreset /status

# Restart IIS
iisreset

# Check URL Rewrite module
powershell "Get-WindowsFeature -Name IIS-HttpRedirect"
```

### 4. Database Issues

#### Symptoms
- Database connection errors
- Migration failures
- Data inconsistencies

#### Diagnostic Steps
```bash
# Test database connection
npm run validate:db

# Check migration status
npx prisma migrate status

# Validate schema
npm run db:validate
```

#### Solutions

**Connection Issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test direct connection
psql -U username -h localhost -d database_name

# Check connection string
echo $DATABASE_URL
```

**Migration Issues:**
```bash
# Apply pending migrations
npm run db:migrate

# Reset migrations (development only)
npm run db:migrate:reset

# Resolve migration conflicts
npx prisma migrate resolve --applied migration_name
```

### 5. Performance Issues

#### Symptoms
- Slow response times
- High CPU/memory usage
- Timeouts

#### Diagnostic Steps
```bash
# Check system resources
top                    # Linux
htop                   # Linux (if installed)
taskmgr               # Windows

# Check application performance
npm run pm2:logs
npm run pm2:monit
```

#### Solutions

**Memory Issues:**
```bash
# Restart application
npm run pm2:restart

# Check memory usage
free -h                # Linux
systeminfo            # Windows

# Enable PM2 cluster mode (if needed)
# Edit ecosystem.prod.config.cjs
```

**Database Performance:**
```bash
# Check slow queries (PostgreSQL)
psql -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Optimize database
VACUUM ANALYZE;        # PostgreSQL
```

## Deployment Troubleshooting

### Linux Deployment Issues

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/app
chmod +x scripts/*.js

# Fix SSL certificate permissions
sudo chmod 600 /etc/ssl/private/nlc-cms.key
sudo chmod 644 /etc/ssl/certs/nlc-cms.crt
```

#### Service Issues
```bash
# Check all services
sudo systemctl status nginx postgresql pm2-root

# Enable services on boot
sudo systemctl enable nginx postgresql

# Check service logs
journalctl -u nginx -f
journalctl -u postgresql -f
```

### Windows Deployment Issues

#### Firewall Issues
```cmd
# Check firewall rules
netsh advfirewall firewall show rule name="NLC-CMS HTTP"
netsh advfirewall firewall show rule name="NLC-CMS HTTPS"

# Add firewall rules
netsh advfirewall firewall add rule name="NLC-CMS HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="NLC-CMS HTTPS" dir=in action=allow protocol=TCP localport=443
```

#### Service Issues
```cmd
# Check Windows services
sc query "nginx"
sc query "postgresql"

# Start services
net start nginx
net start postgresql
```

## Network Troubleshooting

### LAN Access Issues

#### Symptoms
- Cannot access from other devices on LAN
- Application only accessible from localhost

#### Solutions
```bash
# Ensure HOST is set to 0.0.0.0
grep "HOST=" .env
# Should show: HOST=0.0.0.0

# Check CORS configuration
grep "CORS_ORIGIN" .env
# Should include LAN IP: CORS_ORIGIN=http://192.168.1.100:4005,https://192.168.1.100

# Test from server itself
curl http://localhost:4005/api/health
curl http://0.0.0.0:4005/api/health

# Test from another device
curl http://server-ip:4005/api/health
```

### Firewall Issues
```bash
# Linux - Check firewall status
sudo ufw status
sudo iptables -L

# Allow ports through firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Windows - Check firewall
netsh advfirewall show allprofiles
```

## Logging and Monitoring

### Application Logs
```bash
# PM2 logs
npm run pm2:logs

# Real-time log monitoring
npm run pm2:logs --lines 100

# Application-specific logs
tail -f logs/app.log
tail -f logs/error.log
```

### System Logs
```bash
# Linux system logs
journalctl -f
tail -f /var/log/syslog

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Apache2 logs
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log
```

### Database Logs
```bash
# PostgreSQL logs (location varies by system)
tail -f /var/log/postgresql/postgresql-*.log
tail -f /var/lib/postgresql/data/log/postgresql-*.log
```

## Emergency Procedures

### Complete System Recovery

#### 1. Stop All Services
```bash
# Linux
npm run pm2:stop
sudo systemctl stop nginx
sudo systemctl stop apache2

# Windows
npm run pm2:stop
iisreset /stop
net stop nginx
```

#### 2. Backup Current State
```bash
# Backup database
pg_dump -U username database_name > emergency_backup.sql

# Backup application files
tar -czf app_backup.tar.gz /path/to/app
```

#### 3. Restore from Known Good State
```bash
# Restore database
psql -U username database_name < backup.sql

# Restore application
tar -xzf good_backup.tar.gz
```

#### 4. Restart Services
```bash
# Linux
npm run pm2:start
sudo systemctl start nginx

# Windows
npm run pm2:start
iisreset /start
```

### Quick Recovery Commands
```bash
# Full application restart
npm run pm2:restart

# Reload reverse proxy configuration
sudo systemctl reload nginx    # Nginx
sudo systemctl reload apache2  # Apache2
iisreset                      # IIS

# Clear application cache
rm -rf node_modules/.cache
npm run db:generate
```

## Getting Additional Help

### Diagnostic Information to Collect
1. **System Information**
   - Operating system and version
   - Node.js version: `node --version`
   - npm version: `npm --version`

2. **Application Logs**
   - PM2 logs: `npm run pm2:logs`
   - Application logs from `logs/` directory
   - System logs (journalctl, Event Viewer)

3. **Configuration Files**
   - Environment variables (sanitized)
   - Reverse proxy configuration
   - Database connection settings

4. **Network Information**
   - Server IP addresses
   - Port availability: `netstat -tulpn`
   - Firewall status

### Support Resources
1. Check [Deployment Guide](../deployment/README.md) for deployment issues
2. Review [SSL Testing Guide](../deployment/SSL_TESTING_GUIDE.md) for SSL problems
3. Consult [Developer Guide](../developer/README.md) for development issues
4. Check application logs and system monitoring

---

**Last Updated**: January 2025  
**Schema Reference**: [prisma/schema.prisma](../../prisma/schema.prisma)  
**Back to Main Documentation**: [← README.md](../README.md)  
**Related Documentation**: [Architecture](../architecture/README.md) | [Database](../database/README.md) | [Developer](../developer/README.md) | [Deployment](../deployment/README.md)