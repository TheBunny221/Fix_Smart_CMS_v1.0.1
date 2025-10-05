# SSL Certificate Configuration

## Overview
This directory contains SSL certificates and private keys for HTTPS support in production mode.

## Required Files

### Production SSL Files
Place your SSL certificate files in this directory:

- **server.key** - Private key file (keep secure, never commit to git)
- **server.crt** - SSL certificate file (public certificate)
- **ca-bundle.crt** - Certificate Authority bundle (if required)

## File Placement

```
config/ssl/
├── server.key      # Private key (gitignored)
├── server.crt      # SSL certificate (gitignored)
├── ca-bundle.crt   # CA bundle (optional, gitignored)
└── README.md       # This file
```

## Certificate Sources

### 1. Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy files
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem config/ssl/server.key
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem config/ssl/server.crt
```

### 2. Commercial SSL Provider
1. Purchase SSL certificate from provider (GoDaddy, Namecheap, etc.)
2. Generate CSR (Certificate Signing Request)
3. Download certificate files
4. Place files in this directory

### 3. Self-Signed Certificate (Development/Testing Only)
```bash
# Generate self-signed certificate (NOT for production)
openssl req -x509 -newkey rsa:4096 -keyout config/ssl/server.key -out config/ssl/server.crt -days 365 -nodes

# Fill in certificate details when prompted
```

## File Permissions

Set proper permissions for security:
```bash
# Private key should be readable only by owner
chmod 600 config/ssl/server.key

# Certificate can be readable by group
chmod 644 config/ssl/server.crt

# Ensure directory is secure
chmod 755 config/ssl/
```

## Environment Configuration

Update your `.env.production` file:
```env
# HTTPS Configuration
HTTPS_ENABLED=true
SSL_KEY_PATH=config/ssl/server.key
SSL_CERT_PATH=config/ssl/server.crt
SSL_CA_PATH=config/ssl/ca-bundle.crt  # Optional

# Server Configuration
PORT=443  # HTTPS port
HTTP_PORT=80  # HTTP redirect port
```

## Verification

Test your SSL configuration:
```bash
# Check certificate validity
openssl x509 -in config/ssl/server.crt -text -noout

# Test HTTPS connection
curl -I https://your-domain.com

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/
```

## Automatic Renewal (Let's Encrypt)

Set up automatic renewal:
```bash
# Add to crontab
sudo crontab -e

# Add this line for automatic renewal
0 12 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

## Security Best Practices

1. **Never commit private keys to version control**
2. **Use strong encryption (RSA 2048+ or ECC)**
3. **Keep certificates up to date**
4. **Monitor certificate expiration**
5. **Use HSTS headers in production**
6. **Implement proper cipher suites**

## Troubleshooting

### Common Issues

1. **Certificate not found**
   - Verify file paths in environment variables
   - Check file permissions
   - Ensure files exist in correct location

2. **Permission denied**
   - Check file ownership and permissions
   - Ensure application user can read certificate files

3. **Invalid certificate**
   - Verify certificate format (PEM)
   - Check certificate chain completeness
   - Validate certificate against domain

### Error Messages

- **ENOENT: no such file or directory** - Certificate files missing
- **EACCES: permission denied** - Incorrect file permissions
- **certificate verify failed** - Invalid or expired certificate

## Support

For SSL certificate issues:
1. Check certificate provider documentation
2. Verify domain ownership
3. Ensure proper certificate chain
4. Contact certificate authority support if needed

---

**Last Updated**: December 10, 2024  
**Version**: 1.0.0  
**Compatibility**: NLC-CMS v1.0.0+