# Apache Reverse Proxy Configuration for NLC-CMS

This directory contains Apache HTTP Server configuration templates for deploying NLC-CMS with a reverse proxy setup.

## Files Overview

- **`nlc-cms-complete.conf`** - Complete configuration with both HTTP and HTTPS virtual hosts
- **`nlc-cms-http.conf`** - HTTP virtual host (redirects to HTTPS)
- **`nlc-cms-https.conf`** - HTTPS virtual host with SSL termination
- **`apache-modules.conf`** - Required Apache modules
- **`SSL_SETUP.md`** - Detailed SSL certificate setup guide

## Quick Setup

### 1. Install Required Modules

#### Ubuntu/Debian
```bash
sudo a2enmod rewrite proxy proxy_http proxy_wstunnel ssl headers expires deflate filter
sudo systemctl restart apache2
```

#### CentOS/RHEL
```bash
# Modules are typically enabled by default
# Check /etc/httpd/conf.modules.d/ for module configuration
sudo systemctl restart httpd
```

### 2. Copy Configuration

#### Option A: Complete Configuration (Recommended)
```bash
sudo cp nlc-cms-complete.conf /etc/apache2/sites-available/nlc-cms.conf
sudo a2ensite nlc-cms.conf
sudo a2dissite 000-default.conf  # Disable default site
```

#### Option B: Separate HTTP/HTTPS Files
```bash
sudo cp nlc-cms-http.conf /etc/apache2/sites-available/
sudo cp nlc-cms-https.conf /etc/apache2/sites-available/
sudo a2ensite nlc-cms-http.conf nlc-cms-https.conf
```

### 3. Update Configuration

Edit the configuration file and update:
- **ServerName**: Replace `nlc-cms.local` with your domain
- **SSL Certificate paths**: Update certificate file locations
- **Application port**: Ensure it matches your Node.js app port (default: 4005)

```bash
sudo nano /etc/apache2/sites-available/nlc-cms.conf
```

### 4. Setup SSL Certificates

Follow the detailed guide in `SSL_SETUP.md` for:
- Let's Encrypt certificates (production)
- Self-signed certificates (development)
- Commercial SSL certificates

### 5. Test and Restart

```bash
# Test Apache configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2

# Check status
sudo systemctl status apache2
```

## Configuration Features

### Security
- **Modern SSL/TLS configuration** (TLS 1.2+ only)
- **Strong cipher suites** following Mozilla recommendations
- **Security headers** (HSTS, CSP, X-Frame-Options, etc.)
- **OCSP stapling** for improved SSL performance
- **Request size limits** to prevent abuse

### Performance
- **Compression** (gzip/deflate) for text-based content
- **Static file caching** with appropriate cache headers
- **Keep-alive connections** for better performance
- **Connection pooling** to backend Node.js application

### Proxy Features
- **WebSocket support** for real-time features
- **File upload handling** with extended timeouts
- **Health check endpoint** proxying
- **Proper header forwarding** (X-Forwarded-*, X-Real-IP)

## Customization

### Domain Configuration
Replace all instances of `nlc-cms.local` with your actual domain:

```bash
sed -i 's/nlc-cms.local/yourdomain.com/g' /etc/apache2/sites-available/nlc-cms.conf
```

### Port Configuration
If your Node.js application runs on a different port, update the proxy configuration:

```apache
ProxyPass /api/ http://127.0.0.1:YOUR_PORT/api/
ProxyPassReverse /api/ http://127.0.0.1:YOUR_PORT/api/
```

### Content Security Policy
Adjust the CSP header based on your application's requirements:

```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
```

## Monitoring and Logging

### Log Files
- **Error logs**: `/var/log/apache2/nlc-cms-error.log`
- **Access logs**: `/var/log/apache2/nlc-cms-access.log`
- **SSL logs**: `/var/log/apache2/nlc-cms-ssl.log`

### Log Rotation
Apache logs are automatically rotated by logrotate. Custom configuration:

```bash
sudo nano /etc/logrotate.d/apache2-nlc-cms
```

### Monitoring Commands
```bash
# Real-time error monitoring
sudo tail -f /var/log/apache2/nlc-cms-error.log

# Check SSL certificate status
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -noout -dates

# Monitor connections
sudo netstat -tulpn | grep :443
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if Node.js application is running
   - Verify port configuration
   - Check firewall settings

2. **SSL Certificate Errors**
   - Verify certificate paths
   - Check certificate validity
   - Ensure proper permissions

3. **Permission Denied**
   - Check SELinux settings (CentOS/RHEL)
   - Verify file permissions
   - Check Apache user permissions

### Debug Commands
```bash
# Test Apache configuration
sudo apache2ctl configtest

# Check Apache status
sudo systemctl status apache2

# Test SSL configuration
openssl s_client -connect localhost:443 -servername yourdomain.com

# Check proxy connectivity
curl -I http://localhost:4005/api/health
```

### SELinux Configuration (CentOS/RHEL)
```bash
# Allow Apache to make network connections
sudo setsebool -P httpd_can_network_connect 1

# Allow Apache to connect to specific port
sudo semanage port -a -t http_port_t -p tcp 4005
```

## Performance Tuning

### Apache MPM Configuration
Edit `/etc/apache2/mods-available/mpm_prefork.conf` or similar:

```apache
<IfModule mpm_prefork_module>
    StartServers 8
    MinSpareServers 5
    MaxSpareServers 20
    ServerLimit 256
    MaxRequestWorkers 256
    MaxConnectionsPerChild 10000
</IfModule>
```

### Enable HTTP/2
```bash
sudo a2enmod http2
```

Add to virtual host:
```apache
Protocols h2 http/1.1
```

## Security Hardening

### Hide Apache Version
Add to main Apache configuration:
```apache
ServerTokens Prod
ServerSignature Off
```

### Additional Security Modules
```bash
# Install ModSecurity (Web Application Firewall)
sudo apt install libapache2-mod-security2
sudo a2enmod security2

# Install ModEvasive (DDoS protection)
sudo apt install libapache2-mod-evasive
sudo a2enmod evasive
```

## Backup and Recovery

### Configuration Backup
```bash
# Backup Apache configuration
sudo tar -czf apache-nlc-cms-backup-$(date +%Y%m%d).tar.gz \
    /etc/apache2/sites-available/nlc-cms* \
    /etc/ssl/certs/nlc-cms* \
    /etc/ssl/private/nlc-cms*
```

### Recovery
```bash
# Restore configuration
sudo tar -xzf apache-nlc-cms-backup-YYYYMMDD.tar.gz -C /
sudo systemctl restart apache2
```

## Additional Resources

- [Apache HTTP Server Documentation](https://httpd.apache.org/docs/2.4/)
- [Apache SSL/TLS Encryption](https://httpd.apache.org/docs/2.4/ssl/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Apache Security Tips](https://httpd.apache.org/docs/2.4/misc/security_tips.html)