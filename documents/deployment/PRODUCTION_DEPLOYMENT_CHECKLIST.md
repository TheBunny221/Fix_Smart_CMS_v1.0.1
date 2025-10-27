# Production Deployment Checklist

## Pre-Deployment Checklist

### Environment Preparation
- [ ] **Server Requirements Met**
  - [ ] Node.js 18+ installed
  - [ ] PostgreSQL 13+ installed and configured
  - [ ] PM2 installed globally (`npm install -g pm2`)
  - [ ] Nginx/Apache configured for reverse proxy
  - [ ] SSL certificates installed and configured

- [ ] **Environment Variables Configured**
  - [ ] `.env.production` file created with all required variables
  - [ ] Database connection string configured
  - [ ] JWT secrets generated and set
  - [ ] SMTP configuration for email services
  - [ ] File upload directories configured
  - [ ] CORS origins set for production domains

- [ ] **Database Setup**
  - [ ] PostgreSQL database created
  - [ ] Database user created with appropriate permissions
  - [ ] Database connection tested
  - [ ] Backup strategy implemented

### Security Configuration
- [ ] **SSL/TLS Configuration**
  - [ ] SSL certificates installed
  - [ ] HTTPS redirect configured
  - [ ] Security headers configured (Helmet.js)
  - [ ] CORS policies configured for production

- [ ] **Authentication & Authorization**
  - [ ] JWT secrets are strong and unique
  - [ ] Password hashing configured (bcrypt)
  - [ ] Rate limiting configured
  - [ ] Session security configured

- [ ] **File Security**
  - [ ] Upload directory permissions set correctly
  - [ ] File type validation configured
  - [ ] File size limits configured
  - [ ] Malware scanning configured (if applicable)

### Application Configuration
- [ ] **Environment Variables**
  ```env
  NODE_ENV=production
  DATABASE_URL=postgresql://user:password@localhost:5432/nlc_cms_prod
  JWT_SECRET=your-strong-jwt-secret
  REFRESH_TOKEN_SECRET=your-strong-refresh-secret
  SMTP_HOST=your-smtp-host
  SMTP_PORT=587
  SMTP_USER=your-smtp-user
  SMTP_PASS=your-smtp-password
  FRONTEND_URL=https://your-domain.com
  BACKEND_URL=https://api.your-domain.com
  UPLOAD_DIR=/var/www/uploads
  MAX_FILE_SIZE=10485760
  CORS_ORIGIN=https://your-domain.com
  ```

- [ ] **PM2 Configuration**
  - [ ] `ecosystem.prod.config.cjs` configured
  - [ ] Process scaling configured
  - [ ] Log rotation configured
  - [ ] Auto-restart configured

## Deployment Process

### 1. Code Deployment
- [ ] **Source Code**
  - [ ] Latest code pulled from production branch
  - [ ] Dependencies installed (`npm ci --omit=dev`)
  - [ ] TypeScript compiled successfully
  - [ ] Build artifacts generated

- [ ] **Build Process**
  ```bash
  # Install dependencies
  npm ci --omit=dev
  
  # Generate Prisma client
  npm run db:generate
  
  # Build application
  npm run build
  
  # Validate build
  npm run validate:build
  ```

### 2. Database Migration
- [ ] **Database Backup**
  - [ ] Current database backed up
  - [ ] Backup verified and stored securely
  - [ ] Rollback plan prepared

- [ ] **Migration Execution**
  ```bash
  # Apply migrations
  npm run db:migrate
  
  # Verify migration status
  npx prisma migrate status
  
  # Seed production data (if needed)
  npm run db:seed:prod
  ```

### 3. Application Startup
- [ ] **PM2 Deployment**
  ```bash
  # Start application with PM2
  npm run pm2:start
  
  # Verify processes are running
  npm run pm2:status
  
  # Check logs for errors
  npm run pm2:logs
  ```

- [ ] **Health Checks**
  - [ ] Application responds to health check endpoint
  - [ ] Database connectivity verified
  - [ ] All services responding correctly

## Post-Deployment Verification

### Functional Testing
- [ ] **Core Functionality**
  - [ ] User registration and login working
  - [ ] Complaint submission working
  - [ ] File uploads working
  - [ ] Email notifications working
  - [ ] Reports generation working

- [ ] **API Endpoints**
  - [ ] All critical API endpoints responding
  - [ ] Authentication working correctly
  - [ ] Authorization rules enforced
  - [ ] Rate limiting functioning

- [ ] **Database Operations**
  - [ ] CRUD operations working
  - [ ] Data integrity maintained
  - [ ] Relationships functioning correctly
  - [ ] Indexes performing well

### Performance Testing
- [ ] **Response Times**
  - [ ] API response times under acceptable limits
  - [ ] Database query performance acceptable
  - [ ] File upload/download performance good
  - [ ] Page load times acceptable

- [ ] **Load Testing**
  - [ ] Application handles expected concurrent users
  - [ ] Database connections managed properly
  - [ ] Memory usage within limits
  - [ ] CPU usage acceptable

### Security Verification
- [ ] **SSL/TLS**
  - [ ] HTTPS working correctly
  - [ ] SSL certificate valid
  - [ ] Security headers present
  - [ ] HTTP redirects to HTTPS

- [ ] **Authentication**
  - [ ] Login security working
  - [ ] JWT tokens functioning
  - [ ] Password reset working
  - [ ] Session management secure

- [ ] **Authorization**
  - [ ] Role-based access control working
  - [ ] Protected routes secured
  - [ ] API endpoint authorization working
  - [ ] File access permissions correct

## Monitoring Setup

### Application Monitoring
- [ ] **Health Checks**
  - [ ] Health check endpoint configured
  - [ ] Monitoring service configured
  - [ ] Alerting configured for downtime
  - [ ] Response time monitoring

- [ ] **Error Monitoring**
  - [ ] Error logging configured
  - [ ] Error alerting configured
  - [ ] Log aggregation setup
  - [ ] Error tracking dashboard

- [ ] **Performance Monitoring**
  - [ ] CPU usage monitoring
  - [ ] Memory usage monitoring
  - [ ] Disk usage monitoring
  - [ ] Network monitoring

### Database Monitoring
- [ ] **Connection Monitoring**
  - [ ] Connection pool monitoring
  - [ ] Query performance monitoring
  - [ ] Slow query logging
  - [ ] Database health checks

- [ ] **Backup Monitoring**
  - [ ] Automated backup configured
  - [ ] Backup verification automated
  - [ ] Backup retention policy set
  - [ ] Restore procedures tested

## Rollback Procedures

### Application Rollback
- [ ] **Rollback Plan Prepared**
  - [ ] Previous version artifacts available
  - [ ] Rollback scripts prepared
  - [ ] Database rollback plan ready
  - [ ] Communication plan prepared

- [ ] **Rollback Execution**
  ```bash
  # Stop current application
  npm run pm2:stop
  
  # Restore previous version
  # (specific steps depend on deployment method)
  
  # Rollback database if needed
  # (restore from backup)
  
  # Start previous version
  npm run pm2:start
  
  # Verify rollback successful
  npm run pm2:status
  ```

### Database Rollback
- [ ] **Backup Restoration**
  - [ ] Stop application
  - [ ] Restore database from backup
  - [ ] Verify data integrity
  - [ ] Restart application

## Troubleshooting Guide

### Common Issues

#### Application Won't Start
1. **Check Environment Variables**
   ```bash
   # Verify all required variables are set
   npm run validate:db
   ```

2. **Check Database Connection**
   ```bash
   # Test database connectivity
   npx prisma db pull
   ```

3. **Check PM2 Logs**
   ```bash
   # View application logs
   npm run pm2:logs
   ```

#### Database Connection Issues
1. **Verify Database Status**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   ```

2. **Test Connection String**
   ```bash
   # Test database connection
   psql "postgresql://user:password@localhost:5432/dbname"
   ```

3. **Check Firewall Rules**
   ```bash
   # Verify port accessibility
   telnet localhost 5432
   ```

#### Performance Issues
1. **Check Resource Usage**
   ```bash
   # Monitor system resources
   htop
   
   # Check PM2 process status
   npm run pm2:status
   ```

2. **Analyze Database Performance**
   ```bash
   # Check slow queries
   # (PostgreSQL specific commands)
   ```

3. **Review Application Logs**
   ```bash
   # Check for errors or warnings
   npm run pm2:logs --lines 100
   ```

## Emergency Procedures

### Critical System Failure
1. **Immediate Response**
   - [ ] Assess impact and scope
   - [ ] Notify stakeholders
   - [ ] Activate incident response team
   - [ ] Document incident start time

2. **Recovery Actions**
   - [ ] Attempt quick fixes if safe
   - [ ] Consider rollback if necessary
   - [ ] Implement workarounds if possible
   - [ ] Communicate status to users

3. **Post-Incident**
   - [ ] Conduct post-mortem analysis
   - [ ] Document lessons learned
   - [ ] Update procedures if needed
   - [ ] Implement preventive measures

### Data Loss Prevention
- [ ] **Regular Backups**
  - [ ] Automated daily backups
  - [ ] Weekly full backups
  - [ ] Monthly archive backups
  - [ ] Backup integrity verification

- [ ] **Disaster Recovery**
  - [ ] Off-site backup storage
  - [ ] Recovery time objectives defined
  - [ ] Recovery point objectives defined
  - [ ] Disaster recovery testing

## Maintenance Procedures

### Regular Maintenance
- [ ] **Weekly Tasks**
  - [ ] Review application logs
  - [ ] Check system resource usage
  - [ ] Verify backup integrity
  - [ ] Update security patches

- [ ] **Monthly Tasks**
  - [ ] Update dependencies
  - [ ] Review performance metrics
  - [ ] Conduct security audit
  - [ ] Test disaster recovery procedures

- [ ] **Quarterly Tasks**
  - [ ] Major version updates
  - [ ] Infrastructure review
  - [ ] Security penetration testing
  - [ ] Capacity planning review

### Update Procedures
- [ ] **Security Updates**
  - [ ] Monitor security advisories
  - [ ] Test updates in staging
  - [ ] Apply updates during maintenance windows
  - [ ] Verify functionality after updates

- [ ] **Feature Updates**
  - [ ] Follow full deployment checklist
  - [ ] Conduct thorough testing
  - [ ] Plan rollback procedures
  - [ ] Communicate changes to users

## Documentation Requirements

### Deployment Documentation
- [ ] **Environment Documentation**
  - [ ] Server specifications documented
  - [ ] Configuration files documented
  - [ ] Environment variables documented
  - [ ] Network configuration documented

- [ ] **Procedure Documentation**
  - [ ] Deployment procedures documented
  - [ ] Rollback procedures documented
  - [ ] Troubleshooting guides updated
  - [ ] Emergency procedures documented

### Operational Documentation
- [ ] **Monitoring Documentation**
  - [ ] Monitoring setup documented
  - [ ] Alert configurations documented
  - [ ] Dashboard configurations documented
  - [ ] Escalation procedures documented

- [ ] **Maintenance Documentation**
  - [ ] Maintenance schedules documented
  - [ ] Update procedures documented
  - [ ] Backup procedures documented
  - [ ] Recovery procedures documented

## Sign-off

### Deployment Team Sign-off
- [ ] **Technical Lead**: _________________ Date: _________
- [ ] **DevOps Engineer**: _________________ Date: _________
- [ ] **Database Administrator**: _________________ Date: _________
- [ ] **Security Officer**: _________________ Date: _________

### Stakeholder Approval
- [ ] **Project Manager**: _________________ Date: _________
- [ ] **Product Owner**: _________________ Date: _________
- [ ] **Operations Manager**: _________________ Date: _________

---

**Deployment Date**: _______________  
**Version Deployed**: _______________  
**Deployment Lead**: _______________  
**Next Review Date**: _______________