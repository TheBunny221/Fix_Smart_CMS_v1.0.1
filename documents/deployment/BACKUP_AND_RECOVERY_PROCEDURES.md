# Backup and Recovery Procedures

## Overview

This document outlines comprehensive backup and recovery procedures for the NLC-CMS production environment. It covers database backups, file system backups, configuration backups, and complete disaster recovery procedures.

## Backup Strategy

### Backup Types

#### 1. Database Backups
- **Full Backups**: Complete database dump
- **Incremental Backups**: Transaction log backups (PostgreSQL WAL)
- **Point-in-Time Recovery**: Continuous archiving

#### 2. File System Backups
- **Application Files**: Source code and configuration
- **User Uploads**: Complaint attachments and documents
- **Log Files**: Application and system logs

#### 3. Configuration Backups
- **Environment Variables**: Production configuration
- **System Configuration**: Nginx, PM2, SSL certificates
- **Database Schema**: Prisma migrations and schema

### Backup Schedule

#### Daily Backups (Automated)
- **Time**: 2:00 AM local time
- **Database**: Full PostgreSQL dump
- **Files**: User uploads and configuration files
- **Retention**: 30 days

#### Weekly Backups (Automated)
- **Time**: Sunday 1:00 AM local time
- **Database**: Full backup with compression
- **Files**: Complete application directory
- **Retention**: 12 weeks

#### Monthly Backups (Automated)
- **Time**: First Sunday of month, 12:00 AM
- **Database**: Full backup with verification
- **Files**: Complete system backup
- **Retention**: 12 months

## Database Backup Procedures

### 1. PostgreSQL Full Backup

#### Automated Daily Backup Script
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/backup-database.sh

# Configuration
BACKUP_DIR="/var/backups/nlc-cms/database"
DB_NAME="nlc_cms_prod"
DB_USER="nlc_user"
DB_HOST="localhost"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
echo "Starting database backup at $(date)"
pg_dump -U $DB_USER -h $DB_HOST -d $DB_NAME \
    --verbose \
    --format=custom \
    --compress=9 \
    --file=$BACKUP_DIR/nlc_cms_backup_$DATE.dump

# Create SQL backup for easy restoration
pg_dump -U $DB_USER -h $DB_HOST -d $DB_NAME \
    --verbose \
    --format=plain \
    --file=$BACKUP_DIR/nlc_cms_backup_$DATE.sql

# Compress SQL backup
gzip $BACKUP_DIR/nlc_cms_backup_$DATE.sql

# Verify backup integrity
pg_restore --list $BACKUP_DIR/nlc_cms_backup_$DATE.dump > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database backup completed successfully: nlc_cms_backup_$DATE.dump"
else
    echo "❌ Database backup verification failed"
    exit 1
fi

# Clean up old backups
find $BACKUP_DIR -name "nlc_cms_backup_*.dump" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "nlc_cms_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Database backup completed at $(date)"
```

#### Setup Automated Backup
```bash
# Make script executable
chmod +x /var/www/nlc-cms/scripts/backup-database.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /var/www/nlc-cms/scripts/backup-database.sh >> /var/log/nlc-cms-backup.log 2>&1
```

### 2. Point-in-Time Recovery Setup

#### Enable WAL Archiving
```sql
-- Connect to PostgreSQL as superuser
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /var/backups/nlc-cms/wal/%f';
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET wal_keep_segments = 32;

-- Reload configuration
SELECT pg_reload_conf();
```

#### WAL Archive Script
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/archive-wal.sh

WAL_ARCHIVE_DIR="/var/backups/nlc-cms/wal"
RETENTION_DAYS=7

# Create WAL archive directory
mkdir -p $WAL_ARCHIVE_DIR

# Clean up old WAL files
find $WAL_ARCHIVE_DIR -name "*.backup" -mtime +$RETENTION_DAYS -delete
find $WAL_ARCHIVE_DIR -name "*" -mtime +$RETENTION_DAYS -delete

echo "WAL archive cleanup completed at $(date)"
```

## File System Backup Procedures

### 1. Application Files Backup

#### Daily Files Backup Script
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/backup-files.sh

# Configuration
BACKUP_DIR="/var/backups/nlc-cms/files"
APP_DIR="/var/www/nlc-cms"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Starting files backup at $(date)"

# Backup uploads directory
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz \
    -C $APP_DIR uploads/ \
    --exclude="*.tmp" \
    --exclude="*.temp"

# Backup configuration files
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz \
    -C $APP_DIR \
    .env.production \
    ecosystem.prod.config.cjs \
    package.json \
    package-lock.json

# Backup logs (last 7 days)
find $APP_DIR/logs -name "*.log" -mtime -7 -exec tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz {} +

# Verify backups
for backup in uploads_backup_$DATE.tar.gz config_backup_$DATE.tar.gz logs_backup_$DATE.tar.gz; do
    if [ -f "$BACKUP_DIR/$backup" ]; then
        echo "✅ $backup created successfully"
    else
        echo "❌ $backup creation failed"
    fi
done

# Clean up old backups
find $BACKUP_DIR -name "*_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Files backup completed at $(date)"
```

### 2. Complete System Backup

#### Weekly System Backup Script
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/backup-system.sh

# Configuration
BACKUP_DIR="/var/backups/nlc-cms/system"
APP_DIR="/var/www/nlc-cms"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_WEEKS=12

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Starting system backup at $(date)"

# Complete application backup
tar -czf $BACKUP_DIR/system_backup_$DATE.tar.gz \
    -C /var/www \
    nlc-cms/ \
    --exclude="nlc-cms/node_modules" \
    --exclude="nlc-cms/logs/*.log" \
    --exclude="nlc-cms/.git"

# Backup system configuration
tar -czf $BACKUP_DIR/system_config_$DATE.tar.gz \
    /etc/nginx/sites-available/nlc-cms \
    /etc/ssl/nlc-cms/ \
    /etc/systemd/system/nlc-cms.service 2>/dev/null || true

# Calculate backup size
BACKUP_SIZE=$(du -h $BACKUP_DIR/system_backup_$DATE.tar.gz | cut -f1)
echo "✅ System backup completed: $BACKUP_SIZE"

# Clean up old backups (keep 12 weeks)
find $BACKUP_DIR -name "system_backup_*.tar.gz" -mtime +$((RETENTION_WEEKS * 7)) -delete
find $BACKUP_DIR -name "system_config_*.tar.gz" -mtime +$((RETENTION_WEEKS * 7)) -delete

echo "System backup completed at $(date)"
```

## Backup Verification

### 1. Database Backup Verification

#### Verification Script
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/verify-database-backup.sh

BACKUP_DIR="/var/backups/nlc-cms/database"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/nlc_cms_backup_*.dump | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No database backup found"
    exit 1
fi

echo "Verifying backup: $LATEST_BACKUP"

# Test backup integrity
pg_restore --list "$LATEST_BACKUP" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database backup integrity verified"
else
    echo "❌ Database backup integrity check failed"
    exit 1
fi

# Check backup size (should be > 1MB for production data)
BACKUP_SIZE=$(stat -f%z "$LATEST_BACKUP" 2>/dev/null || stat -c%s "$LATEST_BACKUP")
if [ $BACKUP_SIZE -gt 1048576 ]; then
    echo "✅ Database backup size acceptable: $(($BACKUP_SIZE / 1048576))MB"
else
    echo "⚠️ Database backup size seems small: $(($BACKUP_SIZE / 1024))KB"
fi

echo "Database backup verification completed"
```

### 2. File Backup Verification

#### File Verification Script
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/verify-file-backup.sh

BACKUP_DIR="/var/backups/nlc-cms/files"
DATE=$(date +%Y%m%d)

# Check if today's backups exist
BACKUPS=(
    "uploads_backup_${DATE}*.tar.gz"
    "config_backup_${DATE}*.tar.gz"
    "logs_backup_${DATE}*.tar.gz"
)

for backup_pattern in "${BACKUPS[@]}"; do
    BACKUP_FILE=$(ls $BACKUP_DIR/$backup_pattern 2>/dev/null | head -1)
    if [ -n "$BACKUP_FILE" ]; then
        # Test archive integrity
        tar -tzf "$BACKUP_FILE" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ $(basename $BACKUP_FILE) verified"
        else
            echo "❌ $(basename $BACKUP_FILE) integrity check failed"
        fi
    else
        echo "⚠️ No backup found matching $backup_pattern"
    fi
done
```

## Recovery Procedures

### 1. Database Recovery

#### Complete Database Restore
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/restore-database.sh

# Configuration
BACKUP_DIR="/var/backups/nlc-cms/database"
DB_NAME="nlc_cms_prod"
DB_USER="nlc_user"
DB_HOST="localhost"

# Function to restore from custom format backup
restore_from_custom() {
    local backup_file=$1
    
    echo "Stopping application..."
    pm2 stop nlc-cms
    
    echo "Dropping existing database..."
    dropdb -U $DB_USER -h $DB_HOST $DB_NAME
    
    echo "Creating new database..."
    createdb -U $DB_USER -h $DB_HOST $DB_NAME
    
    echo "Restoring database from $backup_file..."
    pg_restore -U $DB_USER -h $DB_HOST -d $DB_NAME \
        --verbose \
        --clean \
        --if-exists \
        "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database restored successfully"
        echo "Starting application..."
        pm2 start nlc-cms
    else
        echo "❌ Database restore failed"
        exit 1
    fi
}

# Function to restore from SQL backup
restore_from_sql() {
    local backup_file=$1
    
    echo "Stopping application..."
    pm2 stop nlc-cms
    
    echo "Dropping existing database..."
    dropdb -U $DB_USER -h $DB_HOST $DB_NAME
    
    echo "Creating new database..."
    createdb -U $DB_USER -h $DB_HOST $DB_NAME
    
    echo "Restoring database from $backup_file..."
    if [[ $backup_file == *.gz ]]; then
        gunzip -c "$backup_file" | psql -U $DB_USER -h $DB_HOST -d $DB_NAME
    else
        psql -U $DB_USER -h $DB_HOST -d $DB_NAME < "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Database restored successfully"
        echo "Starting application..."
        pm2 start nlc-cms
    else
        echo "❌ Database restore failed"
        exit 1
    fi
}

# Main restore logic
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    ls -la $BACKUP_DIR/
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Determine backup type and restore
if [[ $BACKUP_FILE == *.dump ]]; then
    restore_from_custom "$BACKUP_FILE"
elif [[ $BACKUP_FILE == *.sql* ]]; then
    restore_from_sql "$BACKUP_FILE"
else
    echo "❌ Unknown backup format"
    exit 1
fi
```

#### Point-in-Time Recovery
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/restore-point-in-time.sh

# Configuration
BACKUP_DIR="/var/backups/nlc-cms/database"
WAL_ARCHIVE_DIR="/var/backups/nlc-cms/wal"
DB_NAME="nlc_cms_prod"
RECOVERY_TARGET_TIME=$1

if [ -z "$RECOVERY_TARGET_TIME" ]; then
    echo "Usage: $0 'YYYY-MM-DD HH:MM:SS'"
    exit 1
fi

echo "Performing point-in-time recovery to: $RECOVERY_TARGET_TIME"

# Stop application
pm2 stop nlc-cms

# Find latest base backup before target time
LATEST_BACKUP=$(find $BACKUP_DIR -name "nlc_cms_backup_*.dump" -newermt "$RECOVERY_TARGET_TIME" | sort | tail -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No suitable base backup found"
    exit 1
fi

echo "Using base backup: $LATEST_BACKUP"

# Restore base backup
dropdb -U postgres $DB_NAME
createdb -U postgres $DB_NAME
pg_restore -U postgres -d $DB_NAME "$LATEST_BACKUP"

# Create recovery configuration
cat > /var/lib/postgresql/13/main/recovery.conf << EOF
restore_command = 'cp $WAL_ARCHIVE_DIR/%f %p'
recovery_target_time = '$RECOVERY_TARGET_TIME'
recovery_target_action = 'promote'
EOF

# Restart PostgreSQL to trigger recovery
sudo systemctl restart postgresql

echo "Point-in-time recovery initiated. Check PostgreSQL logs for progress."
```

### 2. File System Recovery

#### Restore Application Files
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/restore-files.sh

BACKUP_DIR="/var/backups/nlc-cms/files"
APP_DIR="/var/www/nlc-cms"
BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date> (format: YYYYMMDD_HHMMSS)"
    echo "Available backups:"
    ls -la $BACKUP_DIR/
    exit 1
fi

echo "Restoring files from backup date: $BACKUP_DATE"

# Stop application
pm2 stop nlc-cms

# Backup current state before restore
CURRENT_DATE=$(date +%Y%m%d_%H%M%S)
tar -czf $BACKUP_DIR/pre_restore_backup_$CURRENT_DATE.tar.gz -C $APP_DIR uploads/ .env.production

# Restore uploads
if [ -f "$BACKUP_DIR/uploads_backup_$BACKUP_DATE.tar.gz" ]; then
    echo "Restoring uploads..."
    rm -rf $APP_DIR/uploads/*
    tar -xzf $BACKUP_DIR/uploads_backup_$BACKUP_DATE.tar.gz -C $APP_DIR
    echo "✅ Uploads restored"
else
    echo "⚠️ No uploads backup found for $BACKUP_DATE"
fi

# Restore configuration
if [ -f "$BACKUP_DIR/config_backup_$BACKUP_DATE.tar.gz" ]; then
    echo "Restoring configuration..."
    tar -xzf $BACKUP_DIR/config_backup_$BACKUP_DATE.tar.gz -C $APP_DIR
    echo "✅ Configuration restored"
else
    echo "⚠️ No configuration backup found for $BACKUP_DATE"
fi

# Set proper permissions
chown -R www-data:www-data $APP_DIR/uploads
chmod -R 755 $APP_DIR/uploads

# Start application
pm2 start nlc-cms

echo "File restoration completed"
```

## Disaster Recovery

### 1. Complete System Recovery

#### Disaster Recovery Checklist
```markdown
# Disaster Recovery Checklist

## Immediate Response (0-1 hour)
- [ ] Assess damage and scope of outage
- [ ] Notify stakeholders and users
- [ ] Activate disaster recovery team
- [ ] Document incident start time
- [ ] Secure alternative infrastructure if needed

## Recovery Phase (1-4 hours)
- [ ] Provision new server infrastructure
- [ ] Install required software (Node.js, PostgreSQL, PM2)
- [ ] Configure network and security settings
- [ ] Restore database from latest backup
- [ ] Restore application files and configuration
- [ ] Update DNS records if necessary
- [ ] Test application functionality

## Validation Phase (4-6 hours)
- [ ] Verify all services are running
- [ ] Test critical application functions
- [ ] Validate data integrity
- [ ] Check SSL certificates and security
- [ ] Monitor system performance
- [ ] Communicate recovery status

## Post-Recovery (6+ hours)
- [ ] Conduct post-mortem analysis
- [ ] Update disaster recovery procedures
- [ ] Implement preventive measures
- [ ] Schedule follow-up monitoring
```

#### Complete Recovery Script
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/disaster-recovery.sh

echo "=== NLC-CMS Disaster Recovery Script ==="
echo "Starting disaster recovery at $(date)"

# Configuration
BACKUP_DIR="/var/backups/nlc-cms"
APP_DIR="/var/www/nlc-cms"
DB_NAME="nlc_cms_prod"
DB_USER="nlc_user"

# Step 1: Prepare environment
echo "Step 1: Preparing environment..."
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx

# Step 2: Install PM2
echo "Step 2: Installing PM2..."
sudo npm install -g pm2

# Step 3: Create application directory
echo "Step 3: Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Step 4: Restore application files
echo "Step 4: Restoring application files..."
LATEST_SYSTEM_BACKUP=$(ls -t $BACKUP_DIR/system/system_backup_*.tar.gz | head -1)
if [ -n "$LATEST_SYSTEM_BACKUP" ]; then
    tar -xzf "$LATEST_SYSTEM_BACKUP" -C /var/www/
    echo "✅ Application files restored"
else
    echo "❌ No system backup found"
    exit 1
fi

# Step 5: Install dependencies
echo "Step 5: Installing dependencies..."
cd $APP_DIR
npm ci --omit=dev

# Step 6: Setup database
echo "Step 6: Setting up database..."
sudo -u postgres createdb $DB_NAME
sudo -u postgres createuser $DB_USER

# Step 7: Restore database
echo "Step 7: Restoring database..."
LATEST_DB_BACKUP=$(ls -t $BACKUP_DIR/database/nlc_cms_backup_*.dump | head -1)
if [ -n "$LATEST_DB_BACKUP" ]; then
    pg_restore -U $DB_USER -d $DB_NAME "$LATEST_DB_BACKUP"
    echo "✅ Database restored"
else
    echo "❌ No database backup found"
    exit 1
fi

# Step 8: Generate Prisma client
echo "Step 8: Generating Prisma client..."
npm run db:generate

# Step 9: Build application
echo "Step 9: Building application..."
npm run build

# Step 10: Start application
echo "Step 10: Starting application..."
pm2 start ecosystem.prod.config.cjs
pm2 save

# Step 11: Configure Nginx
echo "Step 11: Configuring Nginx..."
# (Nginx configuration would be restored from system backup)

echo "=== Disaster Recovery Completed ==="
echo "Please verify all services are running correctly"
```

## Monitoring and Alerting

### 1. Backup Monitoring

#### Backup Status Check Script
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/check-backup-status.sh

BACKUP_DIR="/var/backups/nlc-cms"
ALERT_EMAIL="admin@your-domain.com"
TODAY=$(date +%Y%m%d)

# Check database backup
DB_BACKUP=$(ls $BACKUP_DIR/database/nlc_cms_backup_${TODAY}*.dump 2>/dev/null | head -1)
if [ -n "$DB_BACKUP" ]; then
    echo "✅ Database backup found: $(basename $DB_BACKUP)"
else
    echo "❌ Database backup missing for $TODAY"
    echo "Database backup missing for $TODAY" | mail -s "Backup Alert" $ALERT_EMAIL
fi

# Check file backups
FILE_BACKUPS=(
    "uploads_backup_${TODAY}*.tar.gz"
    "config_backup_${TODAY}*.tar.gz"
)

for backup_pattern in "${FILE_BACKUPS[@]}"; do
    BACKUP_FILE=$(ls $BACKUP_DIR/files/$backup_pattern 2>/dev/null | head -1)
    if [ -n "$BACKUP_FILE" ]; then
        echo "✅ File backup found: $(basename $BACKUP_FILE)"
    else
        echo "❌ File backup missing: $backup_pattern"
        echo "File backup missing: $backup_pattern" | mail -s "Backup Alert" $ALERT_EMAIL
    fi
done
```

### 2. Recovery Testing

#### Monthly Recovery Test
```bash
#!/bin/bash
# /var/www/nlc-cms/scripts/test-recovery.sh

echo "=== Monthly Recovery Test ==="
echo "Testing recovery procedures at $(date)"

# Test database restore (to test database)
TEST_DB="nlc_cms_test_recovery"
LATEST_BACKUP=$(ls -t /var/backups/nlc-cms/database/nlc_cms_backup_*.dump | head -1)

# Create test database
createdb -U postgres $TEST_DB

# Restore to test database
pg_restore -U postgres -d $TEST_DB "$LATEST_BACKUP"

# Verify restore
TABLE_COUNT=$(psql -U postgres -d $TEST_DB -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ $TABLE_COUNT -gt 0 ]; then
    echo "✅ Database recovery test passed ($TABLE_COUNT tables restored)"
else
    echo "❌ Database recovery test failed"
fi

# Clean up test database
dropdb -U postgres $TEST_DB

echo "Recovery test completed at $(date)"
```

## Best Practices

### 1. Backup Best Practices
- **3-2-1 Rule**: 3 copies of data, 2 different media types, 1 offsite
- **Regular Testing**: Test restore procedures monthly
- **Automation**: Automate all backup processes
- **Monitoring**: Monitor backup success/failure
- **Documentation**: Keep recovery procedures updated

### 2. Security Considerations
- **Encryption**: Encrypt backups at rest and in transit
- **Access Control**: Limit access to backup files
- **Retention**: Follow data retention policies
- **Audit**: Log all backup and restore activities

### 3. Performance Considerations
- **Timing**: Schedule backups during low-usage periods
- **Compression**: Use compression to reduce storage
- **Incremental**: Use incremental backups where possible
- **Parallel**: Run file and database backups in parallel

---

**Last Updated**: October 27, 2025  
**Version**: 1.0.3  
**Backup Guide Version**: 1.0  
**Next Review**: January 2026