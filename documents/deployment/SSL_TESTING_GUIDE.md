# SSL Testing Guide

## Overview

This guide provides comprehensive procedures for testing SSL configuration and connectivity in both UT server (LAN) and VPS environments for NLC-CMS deployment. Use this guide after running the standardized deployment scripts to validate your SSL setup.

## Prerequisites

Before using this guide, ensure you have completed deployment using one of our standardized scripts:

- `npm run production-build` - Build completed
- `npm run deploy:linux` or `npm run deploy:windows` - Deployment completed

## SSL Testing Steps

### Step 1: Verify HTTPS Endpoint Reachability (LAN)

Test if the HTTPS endpoint is reachable within the LAN:

```bash
# Test HTTPS connectivity with verbose output
curl -Iv https://<LAN-IP>:443

# Example for server IP 199.199.50.51:
curl -Iv https://199.199.50.51:443

# Expected output:
# * Connected to 199.199.50.51 (199.199.50.51) port 443 (#0)
# * ALPN, offering h2
# * ALPN, offering http/1.1
# * successfully set certificate verify locations
# > HEAD / HTTP/1.1
# > Host: 199.199.50.51
# < HTTP/1.1 200 OK
```

**Troubleshooting**:

- **Connection refused**: Check if Nginx/Apache is running
- **Timeout**: Check firewall settings
- **Certificate errors**: Verify SSL certificate configuration

### Step 2: Check Certificate Details

Examine SSL certificate details and chain:

```bash
# Check certificate details
openssl s_client -connect <LAN-IP>:443 -showcerts

# Example:
openssl s_client -connect 199.199.50.51:443 -showcerts

# For domain-based certificates:
openssl s_client -connect <domain>:443 -servername <domain> -showcerts
```

**What to look for**:

- **Certificate chain**: Should show complete certificate chain
- **Verification**: Should show "Verify return code: 0 (ok)" for valid certificates
- **Protocol**: Should show TLS 1.2 or TLS 1.3
- **Cipher**: Should show strong cipher suites

### Step 3: Validate SSL Expiry and Domain Binding

Check certificate validity and expiration:

```bash
# For Let's Encrypt certificates:
openssl x509 -in /etc/letsencrypt/live/<domain>/fullchain.pem -noout -dates

# For self-signed certificates:
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -noout -dates

# Check certificate subject and issuer:
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -noout -subject -issuer

# Example output:
# notBefore=Oct 13 2025 10:30:00 GMT
# notAfter=Oct 13 2026 10:30:00 GMT
# subject=C = IN, ST = Kerala, L = Kochi, O = NLC CMS, CN = 199.199.50.51
```

**Certificate Validation Checklist**:

- [ ] Certificate not expired
- [ ] Subject matches server IP/domain
- [ ] Certificate chain is complete
- [ ] Private key matches certificate

### Step 4: Browser Testing from LAN Device

Test HTTPS access from another device on the same LAN:

```bash
# From another LAN device, test:
# https://<LAN-IP>
# https://<domain> (if DNS is configured)

# Example URLs to test:
# https://199.199.50.51
# https://199.199.50.51/health
# https://199.199.50.51/api/health
# https://199.199.50.51/api-docs
```

**Browser Testing Checklist**:

- [ ] Main application loads without errors
- [ ] Health endpoint returns valid response
- [ ] API documentation is accessible
- [ ] No mixed content warnings
- [ ] Certificate is accepted (or shows expected self-signed warning)

### Step 5: Verify Node.js Server SSL Isolation

Confirm that Node.js server has no SSL conflicts (SSL handled only by reverse proxy):

```bash
# Check that Node.js app is running HTTP only
curl http://localhost:4005/api/health

# Should return successful response
# {"success":true,"message":"Server is running",...}

# Verify app is NOT listening on SSL ports
netstat -tulpn | grep :443
# Should show Nginx/Apache, NOT Node.js

# Verify app IS listening on HTTP port
netstat -tulpn | grep :4005
# Should show Node.js process: 0.0.0.0:4005
```

**Node.js SSL Isolation Checklist**:

- [ ] Node.js app responds on HTTP port 4005
- [ ] Node.js app does NOT listen on port 443
- [ ] Reverse proxy (Nginx/Apache) handles port 443
- [ ] TRUST_PROXY=true in environment configuration
- [ ] No SSL-related code in Node.js application

## Environment-Specific Testing

### UT Server (LAN) Testing

**Network Configuration**:

```bash
# Server binding
HOST=0.0.0.0              # Bind to all network interfaces
PORT=4005                 # Application port
TRUST_PROXY=true          # Trust reverse proxy headers

# CORS configuration for LAN access
CORS_ORIGIN=http://localhost:4005,http://199.199.50.51,https://199.199.50.51
```

**Testing Commands**:

```bash
# Test from server itself
curl -k https://localhost/health
curl -k https://127.0.0.1/health

# Test from LAN (replace with actual server IP)
curl -k https://199.199.50.51/health

# Test specific endpoints
curl -k https://199.199.50.51/api/health
curl -k https://199.199.50.51/api-docs
```

### VPS (Public) Testing

**Network Configuration**:

```bash
# Domain-based configuration
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com,http://localhost:4005

# Let's Encrypt certificate paths
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
```

**Testing Commands**:

```bash
# Test domain access
curl -I https://your-domain.com/health

# Test certificate chain
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Test from external location
curl -I https://your-domain.com/api/health
```

## SSL Certificate Types and Testing

### Self-Signed Certificates (LAN/Testing)

**Generation**:

```bash
# Generate self-signed certificate
sudo openssl req -x509 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nlc-cms.key \
  -out /etc/ssl/certs/nlc-cms.crt \
  -days 365 -nodes \
  -subj "/C=IN/ST=Kerala/L=Kochi/O=NLC CMS/CN=199.199.50.51"
```

**Testing**:

```bash
# Test certificate
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -noout -text

# Test HTTPS with self-signed (ignore certificate warnings)
curl -k https://199.199.50.51/health
```

**Browser Behavior**:

- Shows security warning (expected for self-signed)
- Click "Advanced" → "Proceed to site (unsafe)"
- Application should load normally after accepting certificate

### Let's Encrypt Certificates (VPS/Production)

**Generation**:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

**Testing**:

```bash
# Test certificate
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -noout -dates

# Test HTTPS
curl -I https://your-domain.com/health

# Test certificate chain
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

**Browser Behavior**:

- Shows green lock icon (trusted certificate)
- No security warnings
- Full HTTPS functionality

### Commercial SSL Certificates

**Installation**:

```bash
# Copy certificate files
sudo cp your-certificate.crt /etc/ssl/certs/nlc-cms.crt
sudo cp your-private-key.key /etc/ssl/private/nlc-cms.key
sudo cp ca-bundle.crt /etc/ssl/certs/ca-bundle.crt

# Set permissions
sudo chmod 644 /etc/ssl/certs/nlc-cms.crt
sudo chmod 600 /etc/ssl/private/nlc-cms.key
```

**Testing**:

```bash
# Verify certificate chain
openssl verify -CAfile /etc/ssl/certs/ca-bundle.crt /etc/ssl/certs/nlc-cms.crt

# Test HTTPS
curl -I https://your-domain.com/health
```

## Automated SSL Testing Script

Create an automated SSL testing script:

```bash
#!/bin/bash
# ssl-test.sh

SERVER_IP="199.199.50.51"
DOMAIN="your-domain.com"  # Optional

echo "=== NLC-CMS SSL Testing ==="

echo "1. Testing application direct access..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:4005/api/health

echo "2. Testing HTTP redirect..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://$SERVER_IP/health

echo "3. Testing HTTPS access..."
curl -k -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://$SERVER_IP/health

echo "4. Testing certificate details..."
echo | openssl s_client -connect $SERVER_IP:443 2>/dev/null | openssl x509 -noout -dates

echo "5. Testing from external perspective..."
if [ ! -z "$DOMAIN" ]; then
    curl -I https://$DOMAIN/health
fi

echo "=== SSL Testing Complete ==="
```

## Common SSL Issues and Solutions

### Issue 1: Certificate Not Trusted

**Symptoms**: Browser shows "Not Secure" or certificate warnings
**Causes**: Self-signed certificate or incomplete certificate chain
**Solutions**:

- For production: Use Let's Encrypt or commercial certificate
- For testing: Accept self-signed certificate in browser
- Check certificate chain completeness

### Issue 2: Mixed Content Warnings

**Symptoms**: Some resources load over HTTP instead of HTTPS
**Causes**: Hardcoded HTTP URLs in application
**Solutions**:

- Ensure all internal URLs use relative paths
- Configure TRUST_PROXY=true
- Check CORS_ORIGIN includes HTTPS URLs

### Issue 3: SSL Handshake Failures

**Symptoms**: SSL connection fails or times out
**Causes**: Weak SSL configuration or certificate issues
**Solutions**:

- Update SSL protocols to TLS 1.2+
- Use strong cipher suites
- Verify certificate and key match
- Check certificate permissions

### Issue 4: Reverse Proxy SSL Issues

**Symptoms**: 502 errors or SSL termination problems
**Causes**: Incorrect proxy configuration
**Solutions**:

- Verify upstream configuration points to HTTP (not HTTPS)
- Check proxy headers are set correctly
- Ensure TRUST_PROXY=true in application

## SSL Performance Testing

### Load Testing with SSL

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test HTTPS performance
ab -n 1000 -c 10 https://199.199.50.51/health

# Test HTTP performance (for comparison)
ab -n 1000 -c 10 http://localhost:4005/api/health
```

### SSL Cipher Testing

```bash
# Test supported ciphers
nmap --script ssl-enum-ciphers -p 443 199.199.50.51

# Test SSL configuration
testssl.sh https://199.199.50.51
```

## Monitoring SSL Health

### Automated SSL Monitoring

```bash
# Check certificate expiration
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -noout -checkend 2592000
# Returns 0 if certificate expires within 30 days

# Monitor SSL connectivity
curl -k -s -o /dev/null -w "%{http_code}" https://199.199.50.51/health
# Should return 200
```

### SSL Monitoring Script

```bash
#!/bin/bash
# ssl-monitor.sh

CERT_PATH="/etc/ssl/certs/nlc-cms.crt"
SERVER_IP="199.199.50.51"

# Check certificate expiration
if openssl x509 -in $CERT_PATH -noout -checkend 604800; then
    echo "✅ Certificate valid for at least 7 days"
else
    echo "⚠️ Certificate expires within 7 days"
fi

# Test HTTPS connectivity
if curl -k -s -f https://$SERVER_IP/health > /dev/null; then
    echo "✅ HTTPS connectivity working"
else
    echo "❌ HTTPS connectivity failed"
fi
```

## SSL Security Best Practices

### 1. Certificate Management

- Use automated renewal for Let's Encrypt
- Monitor certificate expiration
- Use strong key lengths (2048+ bits)
- Implement certificate pinning for mobile apps

### 2. SSL Configuration

- Disable weak protocols (SSLv3, TLS 1.0, TLS 1.1)
- Use strong cipher suites
- Enable HSTS headers
- Implement OCSP stapling

### 3. Security Headers

- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### 4. Regular Testing

- Weekly SSL connectivity tests
- Monthly certificate expiration checks
- Quarterly security configuration reviews
- Annual penetration testing

## Quick Reference

### Essential SSL Testing Commands

```bash
# Basic connectivity test
curl -Iv https://199.199.50.51:443

# Certificate details
openssl s_client -connect 199.199.50.51:443 -showcerts

# Certificate expiration
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -noout -dates

# Browser test from LAN
# Navigate to: https://199.199.50.51

# Node.js isolation test
curl http://localhost:4005/api/health
```

### SSL Configuration Files

| Environment   | Certificate Path                             | Key Path                                   | Configuration                               |
| ------------- | -------------------------------------------- | ------------------------------------------ | ------------------------------------------- |
| Linux/Nginx   | `/etc/ssl/certs/nlc-cms.crt`                 | `/etc/ssl/private/nlc-cms.key`             | `/etc/nginx/sites-available/nlc-cms`        |
| Linux/Apache  | `/etc/ssl/certs/nlc-cms.crt`                 | `/etc/ssl/private/nlc-cms.key`             | `/etc/apache2/sites-available/nlc-cms.conf` |
| Windows/IIS   | `C:\ssl\nlc-cms.crt`                         | `C:\ssl\nlc-cms.key`                       | IIS Manager SSL Bindings                    |
| Let's Encrypt | `/etc/letsencrypt/live/domain/fullchain.pem` | `/etc/letsencrypt/live/domain/privkey.pem` | Auto-configured                             |

### Common SSL Ports

| Service | Port | Purpose                 | Testing                      |
| ------- | ---- | ----------------------- | ---------------------------- |
| HTTP    | 80   | Redirect to HTTPS       | `curl http://server-ip`      |
| HTTPS   | 443  | SSL termination         | `curl https://server-ip`     |
| Node.js | 4005 | Application (HTTP only) | `curl http://localhost:4005` |

This SSL testing guide ensures proper SSL configuration and connectivity validation across all deployment environments.
