# Database Performance Tuning

Comprehensive guide for optimizing PostgreSQL database performance in the NLC-CMS system.

## 📋 Table of Contents

- [Performance Overview](#performance-overview)
- [Indexing Strategies](#indexing-strategies)
- [Query Optimization](#query-optimization)
- [Connection Management](#connection-management)
- [Monitoring & Analysis](#monitoring--analysis)
- [Caching Strategies](#caching-strategies)
- [Maintenance Procedures](#maintenance-procedures)
- [Troubleshooting](#troubleshooting)

## 🚀 Performance Overview

The NLC-CMS database is optimized for high-volume complaint management with multiple user roles and complex relationships. Performance optimization focuses on:

- **Query Performance** - Fast data retrieval for user interfaces
- **Write Performance** - Efficient complaint submission and updates
- **Concurrent Access** - Multiple users accessing data simultaneously
- **Scalability** - Growing data volumes and user base

### Performance Metrics

| Metric | Target | Critical Threshold |
|--------|--------|--------------------|
| Query Response Time | < 100ms | > 500ms |
| Connection Pool Usage | < 80% | > 95% |
| Index Hit Ratio | > 99% | < 95% |
| Cache Hit Ratio | > 95% | < 90% |
| Concurrent Connections | < 100 | > 200 |

## 📊 Indexing Strategies

### Current Index Configuration

The schema includes strategic indexes for common query patterns:

#### User-Based Queries
```sql
-- Role-based user filtering
CREATE INDEX idx_users_role_active ON users(role, isActive);

-- Ward assignment queries
CREATE INDEX idx_users_ward ON users(wardId);

-- Authentication lookups
CREATE INDEX idx_users_email ON users(email);
```

#### Complaint Queries
```sql
-- User-specific complaints with temporal ordering
CREATE INDEX idx_complaints_submitted_created ON complaints(submittedById, createdAt);

-- Geographic filtering
CREATE INDEX idx_complaints_ward_status ON complaints(wardId, status);

-- Assignment-based queries
CREATE INDEX idx_complaints_assigned_status ON complaints(assignedToId, status);
CREATE INDEX idx_complaints_maintenance_status ON complaints(maintenanceTeamId, status);

-- Type and priority filtering
CREATE INDEX idx_complaints_type_status ON complaints(type, status);
CREATE INDEX idx_complaints_priority_status ON complaints(priority, status);

-- Temporal queries
CREATE INDEX idx_complaints_submitted ON complaints(submittedOn);
CREATE INDEX idx_complaints_status_created ON complaints(status, createdAt);
```

### Index Optimization Guidelines

#### 1. Composite Index Order

Order columns by selectivity (most selective first):

```sql
-- Good: Status is more selective than ward
CREATE INDEX idx_complaints_status_ward ON complaints(status, wardId);

-- Less optimal: Ward is less selective
CREATE INDEX idx_complaints_ward_status ON complaints(wardId, status);
```

#### 2. Covering Indexes

Include frequently accessed columns:

```sql
-- Covering index for complaint list queries
CREATE INDEX idx_complaints_list_covering ON complaints(status, wardId) 
INCLUDE (title, submittedOn, priority);
```

#### 3. Partial Indexes

Index only relevant subsets:

```sql
-- Index only active complaints
CREATE INDEX idx_active_complaints ON complaints(status, wardId) 
WHERE status NOT IN ('CLOSED', 'RESOLVED');

-- Index only recent complaints
CREATE INDEX idx_recent_complaints ON complaints(submittedOn, status) 
WHERE submittedOn > CURRENT_DATE - INTERVAL '30 days';
```

#### 4. Expression Indexes

Index computed values:

```sql
-- Index for case-insensitive email searches
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- Index for date-based queries
CREATE INDEX idx_complaints_submitted_date ON complaints(DATE(submittedOn));
```

### Index Maintenance

#### Monitor Index Usage
```sql
-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

#### Identify Unused Indexes
```sql
-- Find indexes that are never used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey';
```

#### Index Size Analysis
```sql
-- Analyze index sizes
SELECT 
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
ORDER BY pg_relation_size(indexrelid) DESC;
```

## 🔍 Query Optimization

### Common Query Patterns

#### 1. Complaint Dashboard Queries

**Optimized Query:**
```sql
-- Dashboard complaint list with proper indexing
SELECT 
  c.id,
  c.complaintId,
  c.title,
  c.status,
  c.priority,
  c.submittedOn,
  u.fullName as submittedBy,
  w.name as wardName
FROM complaints c
LEFT JOIN users u ON c.submittedById = u.id
LEFT JOIN wards w ON c.wardId = w.id
WHERE c.status IN ('REGISTERED', 'ASSIGNED', 'IN_PROGRESS')
  AND c.wardId = $1
ORDER BY c.priority DESC, c.submittedOn DESC
LIMIT 50;
```

**Index Support:**
```sql
CREATE INDEX idx_complaints_dashboard ON complaints(wardId, status, priority, submittedOn);
```

#### 2. User Role-Based Queries

**Optimized Query:**
```sql
-- Get complaints assigned to maintenance team member
SELECT 
  c.*,
  ct.name as complaintTypeName,
  ct.slaHours
FROM complaints c
LEFT JOIN complaint_types ct ON c.complaintTypeId = ct.id
WHERE c.maintenanceTeamId = $1
  AND c.status IN ('ASSIGNED', 'IN_PROGRESS')
ORDER BY c.deadline ASC NULLS LAST;
```

**Index Support:**
```sql
CREATE INDEX idx_complaints_maintenance_deadline ON complaints(maintenanceTeamId, status, deadline);
```

#### 3. Geographic Queries

**Optimized Query:**
```sql
-- Get complaints by ward with sub-zone details
SELECT 
  c.id,
  c.complaintId,
  c.area,
  c.landmark,
  w.name as wardName,
  sz.name as subZoneName
FROM complaints c
JOIN wards w ON c.wardId = w.id
LEFT JOIN sub_zones sz ON c.subZoneId = sz.id
WHERE c.wardId = $1
  AND c.submittedOn >= $2
ORDER BY c.submittedOn DESC;
```

### Query Performance Analysis

#### Using EXPLAIN ANALYZE
```sql
-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT * FROM complaints 
WHERE status = 'REGISTERED' 
  AND wardId = 'ward_123'
ORDER BY submittedOn DESC;
```

#### Query Plan Interpretation
```json
{
  "Plan": {
    "Node Type": "Index Scan",
    "Index Name": "idx_complaints_ward_status",
    "Actual Total Time": 0.123,
    "Actual Rows": 25,
    "Buffers": {
      "Shared Hit": 4,
      "Shared Read": 0
    }
  }
}
```

### Query Optimization Techniques

#### 1. Use Appropriate JOINs
```sql
-- Use LEFT JOIN for optional relationships
SELECT c.*, u.fullName
FROM complaints c
LEFT JOIN users u ON c.submittedById = u.id;

-- Use INNER JOIN for required relationships
SELECT c.*, w.name
FROM complaints c
INNER JOIN wards w ON c.wardId = w.id;
```

#### 2. Limit Result Sets
```sql
-- Always use LIMIT for paginated queries
SELECT * FROM complaints
WHERE status = 'REGISTERED'
ORDER BY submittedOn DESC
LIMIT 20 OFFSET 0;
```

#### 3. Use EXISTS Instead of IN
```sql
-- More efficient for large subqueries
SELECT * FROM complaints c
WHERE EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = c.submittedById 
    AND u.role = 'CITIZEN'
);
```

## 🔗 Connection Management

### Prisma Connection Pool

Configure optimal connection pooling:

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Connection string with pool settings
DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=20&pool_timeout=20"
```

### Connection Pool Configuration

```javascript
// Custom Prisma client configuration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

// Connection pool monitoring
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn(`Slow query detected: ${e.duration}ms`);
  }
});
```

### Connection Monitoring

```sql
-- Monitor active connections
SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE state = 'active';
```

## 📈 Monitoring & Analysis

### Performance Monitoring Queries

#### 1. Slow Query Analysis
```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
SELECT pg_reload_conf();

-- Analyze slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### 2. Table Statistics
```sql
-- Table access patterns
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
```

#### 3. Database Size Analysis
```sql
-- Database size breakdown
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
  pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
  pg_size_pretty(pg_total_relation_size(tablename::regclass) - pg_relation_size(tablename::regclass)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### Automated Monitoring

#### Performance Monitoring Script
```javascript
// scripts/monitor-db-performance.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function monitorPerformance() {
  // Check connection count
  const connections = await prisma.$queryRaw`
    SELECT count(*) as active_connections
    FROM pg_stat_activity 
    WHERE state = 'active'
  `;
  
  // Check slow queries
  const slowQueries = await prisma.$queryRaw`
    SELECT query, calls, mean_time
    FROM pg_stat_statements
    WHERE mean_time > 1000
    ORDER BY mean_time DESC
    LIMIT 5
  `;
  
  // Check index usage
  const indexUsage = await prisma.$queryRaw`
    SELECT 
      schemaname,
      tablename,
      attname,
      n_distinct,
      correlation
    FROM pg_stats
    WHERE schemaname = 'public'
    ORDER BY n_distinct DESC
  `;
  
  return {
    connections: connections[0].active_connections,
    slowQueries,
    indexUsage
  };
}
```

## 💾 Caching Strategies

### Application-Level Caching

#### 1. Query Result Caching
```javascript
// Cache frequently accessed data
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }
  
  async getComplaintTypes() {
    const cacheKey = 'complaint_types';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const data = await prisma.complaintType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}
```

#### 2. Configuration Caching
```javascript
// Cache system configuration
class ConfigCache {
  constructor() {
    this.configCache = new Map();
    this.refreshInterval = 10 * 60 * 1000; // 10 minutes
  }
  
  async getConfig(key) {
    const cached = this.configCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.refreshInterval) {
      return cached.value;
    }
    
    const config = await prisma.systemConfig.findFirst({
      where: { key, isActive: true }
    });
    
    const value = config?.value || null;
    this.configCache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    return value;
  }
}
```

### Database-Level Caching

#### PostgreSQL Configuration
```sql
-- Optimize PostgreSQL settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

## 🛠️ Maintenance Procedures

### Regular Maintenance Tasks

#### 1. VACUUM and ANALYZE
```sql
-- Regular maintenance script
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'VACUUM ANALYZE ' || table_name;
        RAISE NOTICE 'Vacuumed and analyzed: %', table_name;
    END LOOP;
END $$;
```

#### 2. Index Maintenance
```sql
-- Rebuild fragmented indexes
REINDEX INDEX CONCURRENTLY idx_complaints_status_created;
REINDEX INDEX CONCURRENTLY idx_users_role_active;
```

#### 3. Statistics Update
```sql
-- Update table statistics
ANALYZE complaints;
ANALYZE users;
ANALYZE wards;
```

### Automated Maintenance

#### Maintenance Script
```bash
#!/bin/bash
# db_maintenance.sh

echo "Starting database maintenance..."

# Update statistics
psql -d $DATABASE_URL -c "ANALYZE;"

# Vacuum tables
psql -d $DATABASE_URL -c "VACUUM (ANALYZE, VERBOSE);"

# Check for bloated tables
psql -d $DATABASE_URL -f scripts/check_table_bloat.sql

echo "Database maintenance completed."
```

#### Scheduled Maintenance
```bash
# Add to crontab for weekly maintenance
0 2 * * 0 /path/to/db_maintenance.sh >> /var/log/db_maintenance.log 2>&1
```

## 🔧 Troubleshooting

### Common Performance Issues

#### 1. Slow Queries
**Symptoms:**
- High response times
- User interface delays
- Database CPU spikes

**Diagnosis:**
```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  (total_time/calls) as avg_time
FROM pg_stat_statements
WHERE calls > 100
ORDER BY mean_time DESC
LIMIT 10;
```

**Solutions:**
- Add appropriate indexes
- Optimize query structure
- Use query result caching
- Consider query rewriting

#### 2. High Connection Count
**Symptoms:**
- Connection pool exhaustion
- "Too many connections" errors
- Application timeouts

**Diagnosis:**
```sql
-- Check connection usage
SELECT 
  state,
  count(*) as connections
FROM pg_stat_activity
GROUP BY state;
```

**Solutions:**
- Optimize connection pool settings
- Fix connection leaks in application
- Implement connection pooling (PgBouncer)
- Scale database resources

#### 3. Index Bloat
**Symptoms:**
- Degraded query performance
- Increased storage usage
- Slow index scans

**Diagnosis:**
```sql
-- Check index bloat
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Solutions:**
- REINDEX affected indexes
- Schedule regular maintenance
- Monitor index usage patterns

### Performance Tuning Checklist

- [ ] **Indexes** - Appropriate indexes for query patterns
- [ ] **Queries** - Optimized query structure and JOINs
- [ ] **Connections** - Proper connection pool configuration
- [ ] **Caching** - Application and database-level caching
- [ ] **Monitoring** - Performance monitoring and alerting
- [ ] **Maintenance** - Regular VACUUM and ANALYZE
- [ ] **Configuration** - Optimized PostgreSQL settings
- [ ] **Hardware** - Adequate CPU, memory, and storage

## 📊 Performance Benchmarks

### Baseline Performance Metrics

| Operation | Target Time | Acceptable | Critical |
|-----------|-------------|------------|----------|
| User Login | < 50ms | < 100ms | > 200ms |
| Complaint List | < 100ms | < 200ms | > 500ms |
| Complaint Create | < 200ms | < 500ms | > 1000ms |
| Dashboard Load | < 150ms | < 300ms | > 600ms |
| Search Results | < 200ms | < 400ms | > 800ms |

### Load Testing

```javascript
// Basic load testing script
async function loadTest() {
  const concurrent = 50;
  const duration = 60000; // 1 minute
  
  const promises = Array(concurrent).fill().map(async (_, i) => {
    const startTime = Date.now();
    let operations = 0;
    
    while (Date.now() - startTime < duration) {
      await prisma.complaint.findMany({
        where: { status: 'REGISTERED' },
        take: 20
      });
      operations++;
    }
    
    return operations;
  });
  
  const results = await Promise.all(promises);
  const totalOps = results.reduce((sum, ops) => sum + ops, 0);
  
  console.log(`Total operations: ${totalOps}`);
  console.log(`Operations per second: ${totalOps / (duration / 1000)}`);
}
```

## 🔗 See Also

- **[Schema Reference](schema_reference.md)** - Database schema and relationships
- **[Migration Guidelines](migration_guidelines.md)** - Schema change procedures
- **[Seed & Fallback Logic](seed_fallback_logic.md)** - Database initialization
- **[System Configuration](../System/system_config_overview.md)** - Configuration management
- **[Monitoring & Logging](../System/logging_monitoring.md)** - System monitoring strategies