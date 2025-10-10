# Nginx SSL Configuration for Fix_Smart_CMS

## Overview

Fix_Smart_CMS now uses Nginx as a reverse proxy to handle HTTPS/SSL termination. The Node.js application runs on HTTP (port 4005) behind Nginx, which handles SSL encryption and forwards requests to the application.

## Architecture

```
Internet/LAN → Nginx (HTTPS:443) → Node.js App (HTTP:4005)
```

## SSL Certificate Setup

### Option 1: Let's Encrypt (Recommended for Production)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Self-Signed Certificate (Development/Testing)

```bash
# Create SSL directory
sudo mkdir -p /etc/ssl/private /etc/ssl/certs

# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/fix-smart-cms.key \
  -out /etc/ssl/certs/fix-smart-cms.crt \
  -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=$(hostname -I | awk '{print $1}')"

# Set proper permissions
sudo chmod 600 /etc/ssl/private/fix-smart-cms.key
sudo chmod 644 /etc/ssl/certs/fix-smart-cms.crt
```

### Option 3: Commercial SSL Certificate

```bash
# Generate private key
sudo openssl genrsa -out /etc/ssl/private/fix-smart-cms.key 2048

# Generate CSR
sudo openssl req -new -key /etc/ssl/private/fix-smart-cms.key \
  -out /etc/ssl/certs/fix-smart-cms.csr \
  -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=your-domain.com"

# Submit CSR to Certificate Authority
# Download and install the certificate as /etc/ssl/certs/fix-smart-cms.crt
```

## Nginx Installation and Configuration

### 1. Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Configure Nginx

```bash
# Copy the provided configuration
sudo cp config/nginx/nginx.conf /etc/nginx/sites-available/fix-smart-cms

# Enable the site
sudo ln -s /etc/nginx/sites-available/fix-smart-cms /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3. Firewall Configuration

```bash
# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'

# Or manually allow ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

## Application Configuration

### Environment Variables

The application should be configured for HTTP mode:

```env
NODE_ENV=production
PORT=4005
HOST=127.0.0.1
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
TRUST_PROXY=true
```

**Important**: Set `TRUST_PROXY=true` so the application can properly handle forwarded headers from Nginx.

### Start the Application

```bash
# Start the Node.js application
npm run pm2:start

# The application will run on HTTP port 4005
# Nginx will handle HTTPS on port 443 and forward to the app
```

## Verification

### Test SSL Configuration

```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Test application through Nginx
curl https://your-domain.com/api/health

# Check SSL rating (external)
# Visit: https://www.ssllabs.com/ssltest/
```

### Check Nginx Status

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

### Verify Application

```bash
# Check if app is running
npm run pm2:status

# Test direct app connection (should work)
curl http://localhost:4005/api/health

# Test through Nginx (should work with HTTPS)
curl https://your-domain.com/api/health
```

## Monitoring and Maintenance

### Log Files

- **Nginx Access**: `/var/log/nginx/access.log`
- **Nginx Error**: `/var/log/nginx/error.log`
- **Application**: `logs/application.log`
- **PM2**: `~/.pm2/logs/`

### Useful Commands

```bash
# Reload Nginx configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx configuration
sudo nginx -t

# View real-time logs
sudo tail -f /var/log/nginx/access.log
npm run pm2:logs
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if Node.js app is running: `npm run pm2:status`
   - Verify app is listening on correct port: `netstat -tulpn | grep :4005`
   - Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

2. **SSL Certificate Errors**
   - Verify certificate files exist and have correct permissions
   - Test certificate: `sudo nginx -t`
   - Check certificate expiration: `openssl x509 -in /etc/ssl/certs/fix-smart-cms.crt -noout -dates`

3. **CORS Issues**
   - Ensure `TRUST_PROXY=true` in application environment
   - Verify `CLIENT_URL` and `CORS_ORIGIN` match your domain
   - Check that Nginx forwards proper headers

4. **Performance Issues**
   - Monitor Nginx and application logs
   - Check system resources: `htop`
   - Verify database connection: `npm run deploy validate`

## Security Best Practices

1. **SSL Configuration**
   - Use strong cipher suites
   - Enable HSTS headers
   - Regular certificate renewal

2. **Nginx Security**
   - Hide Nginx version: `server_tokens off;`
   - Rate limiting for API endpoints
   - Proper access controls

3. **Application Security**
   - Keep dependencies updated
   - Monitor security logs
   - Regular security audits

## Migration from Internal HTTPS

If migrating from internal HTTPS implementation:

1. **Remove SSL environment variables** from `.env` files
2. **Update CLIENT_URL** to use your domain (not localhost)
3. **Set TRUST_PROXY=true** in production environment
4. **Configure Nginx** with proper SSL certificates
5. **Test thoroughly** to ensure all functionality works

---

**Configuration Summary**
- **Nginx**: Handles HTTPS/SSL termination on port 443
- **Application**: Runs HTTP on port 4005 behind Nginx
- **SSL**: Managed entirely by Nginx (certificates, encryption, headers)
- **Security**: Enhanced with Nginx security headers and features