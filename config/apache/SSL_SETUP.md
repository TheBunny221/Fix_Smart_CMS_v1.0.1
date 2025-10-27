# SSL Certificate Setup for NLC-CMS Apache Configuration

This guide explains how to set up SSL certificates for the NLC-CMS Apache reverse proxy configuration.

## Option 1: Let's Encrypt (Recommended for Production)

### Prerequisites
- Domain name pointing to your server
- Apache installed and running
- Certbot installed

### Installation

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install certbot python3-certbot-apache
```

#### CentOS/RHEL
```bash
sudo yum install certbot python3-certbot-apache
# or for newer versions:
sudo dnf install certbot python3-certbot-apache
```

### Generate Certificate
```bash
# Replace nlc-cms.yourdomain.com with your actual domain
sudo certbot --apache -d nlc-cms.yourdomain.com -d www.nlc-cms.yourdomain.com
```

### Update Apache Configuration
After obtaining the certificate, update the SSL paths in your Apache configuration:

```apache
SSLCertificateFile /etc/letsencrypt/live/nlc-cms.yourdomain.com/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/nlc-cms.yourdomain.com/privkey.pem
```

### Auto-renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal (crontab)
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Option 2: Self-Signed Certificate (Development/Testing)

### Generate Self-Signed Certificate
```bash
# Create SSL directory
sudo mkdir -p /etc/ssl/private /etc/ssl/certs

# Generate private key
sudo openssl genrsa -out /etc/ssl/private/nlc-cms.key 2048

# Generate certificate signing request
sudo openssl req -new -key /etc/ssl/private/nlc-cms.key -out /etc/ssl/certs/nlc-cms.csr

# Generate self-signed certificate
sudo openssl x509 -req -days 365 -in /etc/ssl/certs/nlc-cms.csr \
    -signkey /etc/ssl/private/nlc-cms.key -out /etc/ssl/certs/nlc-cms.crt

# Set proper permissions
sudo chmod 600 /etc/ssl/private/nlc-cms.key
sudo chmod 644 /etc/ssl/certs/nlc-cms.crt
```

### One-liner for Self-Signed Certificate
```bash
sudo openssl req -x509 -newkey rsa:2048 -keyout /etc/ssl/private/nlc-cms.key \
    -out /etc/ssl/certs/nlc-cms.crt -days 365 -nodes \
    -subj "/C=IN/ST=Kerala/L=Kochi/O=NLC CMS/CN=nlc-cms.local"
```

## Option 3: Commercial SSL Certificate

### Steps
1. Generate a Certificate Signing Request (CSR)
2. Purchase SSL certificate from a trusted CA
3. Download and install the certificate files
4. Update Apache configuration

### Generate CSR
```bash
sudo openssl req -new -newkey rsa:2048 -nodes \
    -keyout /etc/ssl/private/nlc-cms.key \
    -out /etc/ssl/certs/nlc-cms.csr
```

### Install Certificate Files
After receiving files from your CA:
```bash
# Copy certificate files
sudo cp your-certificate.crt /etc/ssl/certs/nlc-cms.crt
sudo cp your-private-key.key /etc/ssl/private/nlc-cms.key
sudo cp ca-bundle.crt /etc/ssl/certs/nlc-cms-chain.crt  # If provided

# Set permissions
sudo chmod 600 /etc/ssl/private/nlc-cms.key
sudo chmod 644 /etc/ssl/certs/nlc-cms.crt
sudo chmod 644 /etc/ssl/certs/nlc-cms-chain.crt
```

### Update Apache Configuration
```apache
SSLCertificateFile /etc/ssl/certs/nlc-cms.crt
SSLCertificateKeyFile /etc/ssl/private/nlc-cms.key
SSLCertificateChainFile /etc/ssl/certs/nlc-cms-chain.crt
```

## SSL Configuration Testing

### Test SSL Configuration
```bash
# Test Apache configuration
sudo apache2ctl configtest
# or on CentOS/RHEL:
sudo httpd -t

# Test SSL certificate
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -text -noout

# Test SSL connection
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### Online SSL Testing Tools
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)

## Security Best Practices

### 1. Strong SSL Configuration
The provided Apache configuration includes:
- Modern SSL protocols (TLS 1.2 and 1.3 only)
- Strong cipher suites
- HSTS headers
- OCSP stapling

### 2. Regular Updates
- Keep certificates up to date
- Monitor expiration dates
- Update SSL configuration as security standards evolve

### 3. Certificate Monitoring
```bash
# Check certificate expiration
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -noout -dates

# Create monitoring script
cat > /usr/local/bin/check-ssl-expiry.sh << 'EOF'
#!/bin/bash
CERT_FILE="/etc/ssl/certs/nlc-cms.crt"
DAYS_WARNING=30

if [ -f "$CERT_FILE" ]; then
    EXPIRY_DATE=$(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ $DAYS_LEFT -lt $DAYS_WARNING ]; then
        echo "WARNING: SSL certificate expires in $DAYS_LEFT days!"
        # Add notification logic here (email, Slack, etc.)
    fi
fi
EOF

chmod +x /usr/local/bin/check-ssl-expiry.sh

# Add to crontab for daily checks
echo "0 9 * * * /usr/local/bin/check-ssl-expiry.sh" | sudo crontab -
```

## Troubleshooting

### Common Issues

1. **Certificate not trusted**
   - Ensure certificate chain is complete
   - Check intermediate certificates

2. **Mixed content warnings**
   - Ensure all resources load over HTTPS
   - Update Content Security Policy

3. **SSL handshake failures**
   - Check SSL protocols and ciphers
   - Verify certificate validity

### Debug Commands
```bash
# Check Apache error logs
sudo tail -f /var/log/apache2/error.log

# Check SSL-specific logs
sudo tail -f /var/log/apache2/nlc-cms-ssl.log

# Test certificate chain
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/nlc-cms.crt
```

## Windows Apache SSL Setup

For Windows Apache installations:

### Certificate Paths
```apache
SSLCertificateFile "C:/Apache24/conf/ssl/nlc-cms.crt"
SSLCertificateKeyFile "C:/Apache24/conf/ssl/nlc-cms.key"
```

### Generate Self-Signed Certificate (Windows)
```cmd
# Using OpenSSL for Windows
openssl req -x509 -newkey rsa:2048 -keyout C:\Apache24\conf\ssl\nlc-cms.key ^
    -out C:\Apache24\conf\ssl\nlc-cms.crt -days 365 -nodes ^
    -subj "/C=IN/ST=Kerala/L=Kochi/O=NLC CMS/CN=localhost"
```

## Additional Resources

- [Apache SSL/TLS Documentation](https://httpd.apache.org/docs/2.4/ssl/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [SSL Best Practices](https://wiki.mozilla.org/Security/Server_Side_TLS)