import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { getPrisma } from '../../db/connection.dev.js';

// Mock authentication middleware for testing
vi.mock('../../middleware/auth.js', () => ({
  protect: (req, res, next) => {
    req.user = { id: '1', role: 'ADMINISTRATOR' };
    next();
  },
  authorize: (role) => (req, res, next) => {
    if (req.user?.role === role) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Access denied' });
    }
  }
}));

const prisma = getPrisma();

describe('SystemConfig API Integration Tests', () => {
  let testConfigKeys = [];

  beforeEach(async () => {
    // Clean up any test configurations
    await prisma.systemConfig.deleteMany({
      where: {
        key: {
          startsWith: 'TEST_'
        }
      }
    });

    // Create test configurations
    const testConfigs = [
      {
        key: 'TEST_APP_NAME',
        value: 'Test Application',
        description: 'Test application name',
        isActive: true
      },
      {
        key: 'TEST_INACTIVE_CONFIG',
        value: 'inactive_value',
        description: 'Test inactive configuration',
        isActive: false
      },
      {
        key: 'TEST_JSON_CONFIG',
        value: '{"enabled": true, "timeout": 30}',
        description: 'Test JSON configuration',
        isActive: true
      }
    ];

    for (const config of testConfigs) {
      await prisma.systemConfig.create({ data: config });
      testConfigKeys.push(config.key);
    }
  });

  afterEach(async () => {
    // Clean up test configurations
    await prisma.systemConfig.deleteMany({
      where: {
        key: {
          in: testConfigKeys
        }
      }
    });
    testConfigKeys = [];
  });

  describe('GET /api/system-config/public', () => {
    test('should return public system settings successfully', async () => {
      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('retrieved successfully'),
        data: {
          config: expect.any(Array),
          complaintTypes: expect.any(Array)
        },
        meta: {
          source: expect.any(String),
          databaseAvailable: expect.any(Boolean)
        }
      });

      // Verify config structure
      const configs = response.body.data.config;
      expect(configs.length).toBeGreaterThan(0);
      
      configs.forEach(config => {
        expect(config).toMatchObject({
          key: expect.any(String),
          value: expect.any(String),
          description: expect.any(String),
          type: expect.stringMatching(/^(string|number|boolean|json)$/),
          enabled: expect.any(Boolean)
        });
      });
    });

    test('should return default values when database is unavailable', async () => {
      // Mock database failure
      const originalQuery = prisma.$queryRaw;
      prisma.$queryRaw = vi.fn().mockRejectedValue(new Error('Database unavailable'));

      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('default values'),
        data: {
          config: expect.any(Array),
          complaintTypes: []
        },
        meta: {
          source: expect.stringMatching(/^(defaults|defaults_fallback)$/),
          databaseAvailable: false
        }
      });

      // Restore original method
      prisma.$queryRaw = originalQuery;
    });

    test('should include only active public configurations', async () => {
      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      const configs = response.body.data.config;
      const testConfig = configs.find(c => c.key === 'TEST_APP_NAME');
      const inactiveConfig = configs.find(c => c.key === 'TEST_INACTIVE_CONFIG');

      expect(testConfig).toBeDefined();
      expect(testConfig.enabled).toBe(true);
      expect(inactiveConfig).toBeUndefined(); // Should not be included
    });
  });

  describe('GET /api/system-config', () => {
    test('should return all system settings for admin', async () => {
      const response = await request(app)
        .get('/api/system-config')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('retrieved successfully'),
        data: expect.any(Array)
      });

      const configs = response.body.data;
      expect(configs.length).toBeGreaterThan(0);

      // Should include test configurations
      const testConfig = configs.find(c => c.key === 'TEST_APP_NAME');
      expect(testConfig).toMatchObject({
        key: 'TEST_APP_NAME',
        value: 'Test Application',
        description: 'Test application name',
        type: 'string',
        isActive: true
      });
    });

    test('should exclude complaint type configurations', async () => {
      // Create a complaint type config
      await prisma.systemConfig.create({
        data: {
          key: 'COMPLAINT_TYPE_TEST',
          value: 'test_type',
          description: 'Test complaint type',
          isActive: true
        }
      });

      const response = await request(app)
        .get('/api/system-config')
        .expect(200);

      const configs = response.body.data;
      const complaintTypeConfig = configs.find(c => c.key === 'COMPLAINT_TYPE_TEST');
      
      expect(complaintTypeConfig).toBeUndefined();

      // Clean up
      await prisma.systemConfig.delete({
        where: { key: 'COMPLAINT_TYPE_TEST' }
      });
    });
  });

  describe('GET /api/system-config/:key', () => {
    test('should return specific system setting by key', async () => {
      const response = await request(app)
        .get('/api/system-config/TEST_APP_NAME')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('retrieved successfully'),
        data: {
          key: 'TEST_APP_NAME',
          value: 'Test Application',
          description: 'Test application name',
          type: 'string',
          isActive: true
        }
      });
    });

    test('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .get('/api/system-config/NON_EXISTENT_KEY')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'System setting not found'
      });
    });

    test('should correctly identify data types', async () => {
      const response = await request(app)
        .get('/api/system-config/TEST_JSON_CONFIG')
        .expect(200);

      expect(response.body.data).toMatchObject({
        key: 'TEST_JSON_CONFIG',
        value: '{"enabled": true, "timeout": 30}',
        type: 'json'
      });
    });
  });

  describe('POST /api/system-config', () => {
    test('should create new system setting', async () => {
      const newConfig = {
        key: 'TEST_NEW_CONFIG',
        value: 'new_value',
        description: 'New test configuration',
        type: 'string'
      };

      const response = await request(app)
        .post('/api/system-config')
        .send(newConfig)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('saved successfully'),
        data: {
          key: 'TEST_NEW_CONFIG',
          value: 'new_value',
          description: 'New test configuration',
          type: 'string',
          isActive: true
        }
      });

      // Verify in database
      const dbConfig = await prisma.systemConfig.findUnique({
        where: { key: 'TEST_NEW_CONFIG' }
      });
      expect(dbConfig).toBeTruthy();
      expect(dbConfig.value).toBe('new_value');

      testConfigKeys.push('TEST_NEW_CONFIG');
    });

    test('should update existing system setting', async () => {
      const updateConfig = {
        key: 'TEST_APP_NAME',
        value: 'Updated Application',
        description: 'Updated test application name',
        type: 'string'
      };

      const response = await request(app)
        .post('/api/system-config')
        .send(updateConfig)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('saved successfully'),
        data: {
          key: 'TEST_APP_NAME',
          value: 'Updated Application',
          description: 'Updated test application name'
        }
      });

      // Verify in database
      const dbConfig = await prisma.systemConfig.findUnique({
        where: { key: 'TEST_APP_NAME' }
      });
      expect(dbConfig.value).toBe('Updated Application');
    });

    test('should validate required fields', async () => {
      const invalidConfig = {
        description: 'Missing key and value'
      };

      const response = await request(app)
        .post('/api/system-config')
        .send(invalidConfig)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Key and value are required'
      });
    });

    test('should validate boolean values', async () => {
      const invalidBooleanConfig = {
        key: 'TEST_BOOLEAN',
        value: 'invalid_boolean',
        type: 'boolean'
      };

      const response = await request(app)
        .post('/api/system-config')
        .send(invalidBooleanConfig)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: "Boolean values must be 'true' or 'false'"
      });
    });

    test('should validate JSON values', async () => {
      const invalidJsonConfig = {
        key: 'TEST_JSON',
        value: 'invalid json',
        type: 'json'
      };

      const response = await request(app)
        .post('/api/system-config')
        .send(invalidJsonConfig)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'JSON values must be valid JSON'
      });
    });
  });

  describe('PUT /api/system-config/:key', () => {
    test('should update existing system setting', async () => {
      const updateData = {
        value: 'Updated Value',
        description: 'Updated description',
        isActive: false
      };

      const response = await request(app)
        .put('/api/system-config/TEST_APP_NAME')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('updated successfully'),
        data: {
          key: 'TEST_APP_NAME',
          value: 'Updated Value',
          description: 'Updated description',
          isActive: false
        }
      });

      // Verify in database
      const dbConfig = await prisma.systemConfig.findUnique({
        where: { key: 'TEST_APP_NAME' }
      });
      expect(dbConfig.value).toBe('Updated Value');
      expect(dbConfig.isActive).toBe(false);
    });

    test('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .put('/api/system-config/NON_EXISTENT_KEY')
        .send({ value: 'test' })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'System setting not found'
      });
    });

    test('should validate JSON fields', async () => {
      // Create a JSON config first
      await prisma.systemConfig.create({
        data: {
          key: 'NOTIFICATION_SETTINGS',
          value: '{"email": true}',
          description: 'Notification settings',
          isActive: true
        }
      });

      const response = await request(app)
        .put('/api/system-config/NOTIFICATION_SETTINGS')
        .send({ value: 'invalid json' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid JSON format')
      });

      // Clean up
      await prisma.systemConfig.delete({
        where: { key: 'NOTIFICATION_SETTINGS' }
      });
    });
  });

  describe('DELETE /api/system-config/:key', () => {
    test('should delete system setting', async () => {
      const response = await request(app)
        .delete('/api/system-config/TEST_APP_NAME')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('deleted successfully')
      });

      // Verify deletion in database
      const dbConfig = await prisma.systemConfig.findUnique({
        where: { key: 'TEST_APP_NAME' }
      });
      expect(dbConfig).toBeNull();

      // Remove from cleanup list since it's already deleted
      testConfigKeys = testConfigKeys.filter(key => key !== 'TEST_APP_NAME');
    });

    test('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .delete('/api/system-config/NON_EXISTENT_KEY')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'System setting not found'
      });
    });
  });

  describe('GET /api/system-config/health', () => {
    test('should return system health status', async () => {
      const response = await request(app)
        .get('/api/system-config/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('health check completed'),
        data: {
          status: 'healthy',
          uptime: expect.any(Number),
          database: expect.any(String),
          statistics: {
            totalUsers: expect.any(Number),
            activeUsers: expect.any(Number),
            totalComplaints: expect.any(Number),
            openComplaints: expect.any(Number),
            totalWards: expect.any(Number),
            activeWards: expect.any(Number),
            systemSettings: expect.any(Number)
          },
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('POST /api/system-config/reset', () => {
    test('should reset system settings to defaults', async () => {
      const response = await request(app)
        .post('/api/system-config/reset')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset to defaults successfully')
      });

      // Verify default settings exist
      const defaultConfig = await prisma.systemConfig.findUnique({
        where: { key: 'APP_NAME' }
      });
      expect(defaultConfig).toBeTruthy();
      expect(defaultConfig.value).toBe('NLC-CMS');
    });
  });

  describe('GET /api/system-config/audit', () => {
    test('should return configuration audit results', async () => {
      const response = await request(app)
        .get('/api/system-config/audit')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('audit completed successfully'),
        data: {
          timestamp: expect.any(String),
          databaseConfigs: expect.any(Array),
          seedConfigs: expect.any(Array),
          duplicateKeys: expect.any(Array),
          missingKeys: expect.any(Array),
          unusedKeys: expect.any(Array),
          configSources: {
            database: expect.any(Number),
            seed: expect.any(Number),
            environment: expect.any(Number)
          },
          integrityIssues: expect.any(Array),
          recommendations: expect.any(Array)
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/system-config/validate', () => {
    test('should return configuration validation results', async () => {
      const response = await request(app)
        .get('/api/system-config/validate')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('validation completed successfully'),
        data: {
          timestamp: expect.any(String),
          isValid: expect.any(Boolean),
          validationErrors: expect.any(Array),
          warnings: expect.any(Array),
          configIntegrity: {
            databaseConnectivity: expect.any(Boolean),
            seedFileExists: expect.any(Boolean),
            requiredKeysPresent: expect.any(Boolean),
            dataTypesValid: expect.any(Boolean)
          },
          statistics: {
            totalConfigs: expect.any(Number),
            activeConfigs: expect.any(Number),
            inactiveConfigs: expect.any(Number),
            validConfigs: expect.any(Number),
            invalidConfigs: expect.any(Number)
          }
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/system-config/canonical-keys', () => {
    test('should return canonical keys mapping', async () => {
      const response = await request(app)
        .get('/api/system-config/canonical-keys')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('canonical keys mapping generated successfully'),
        data: {
          timestamp: expect.any(String),
          canonicalKeys: expect.any(Object),
          duplicateGroups: expect.any(Array),
          migrationPlan: expect.any(Array),
          statistics: {
            totalKeys: expect.any(Number),
            canonicalKeys: expect.any(Number),
            duplicateGroups: expect.any(Number),
            keysToMigrate: expect.any(Number)
          }
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('PUT /api/system-config/bulk', () => {
    test('should bulk update system settings', async () => {
      const bulkUpdate = {
        settings: [
          {
            key: 'TEST_APP_NAME',
            value: 'Bulk Updated App',
            description: 'Bulk updated description'
          },
          {
            key: 'TEST_JSON_CONFIG',
            value: '{"enabled": false, "timeout": 60}',
            description: 'Bulk updated JSON config'
          }
        ]
      };

      const response = await request(app)
        .put('/api/system-config/bulk')
        .send(bulkUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Updated 2 settings successfully'),
        data: {
          updated: 2,
          errors: []
        }
      });

      // Verify updates in database
      const updatedConfig = await prisma.systemConfig.findUnique({
        where: { key: 'TEST_APP_NAME' }
      });
      expect(updatedConfig.value).toBe('Bulk Updated App');
    });

    test('should handle validation errors in bulk update', async () => {
      const bulkUpdate = {
        settings: [
          {
            key: 'TEST_APP_NAME',
            value: 'Valid Update'
          },
          {
            key: 'NON_EXISTENT_KEY',
            value: 'This will fail'
          }
        ]
      };

      const response = await request(app)
        .put('/api/system-config/bulk')
        .send(bulkUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Updated 1 settings successfully'),
        data: {
          updated: 1,
          errors: expect.arrayContaining([
            expect.stringContaining('NON_EXISTENT_KEY')
          ])
        }
      });
    });

    test('should validate bulk update request format', async () => {
      const invalidBulkUpdate = {
        settings: 'not an array'
      };

      const response = await request(app)
        .put('/api/system-config/bulk')
        .send(invalidBulkUpdate)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Settings must be an array'
      });
    });
  });
});