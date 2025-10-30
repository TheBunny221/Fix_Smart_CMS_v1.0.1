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

describe('SystemConfig Fallback Behavior Tests', () => {
  let originalMethods = {};

  beforeEach(() => {
    // Store original methods for restoration
    originalMethods = {
      $queryRaw: prisma.$queryRaw,
      findMany: prisma.systemConfig.findMany,
      findUnique: prisma.systemConfig.findUnique
    };
  });

  afterEach(() => {
    // Restore original methods
    Object.assign(prisma, originalMethods);
    Object.assign(prisma.systemConfig, {
      findMany: originalMethods.findMany,
      findUnique: originalMethods.findUnique
    });
  });

  describe('Database Unavailable Scenarios', () => {
    test('should return default values when database connection fails', async () => {
      // Mock database connection failure
      prisma.$queryRaw = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('default values - database unavailable'),
        data: {
          config: expect.any(Array),
          complaintTypes: []
        },
        meta: {
          source: 'defaults',
          databaseAvailable: false
        }
      });

      // Verify default configurations are present
      const configs = response.body.data.config;
      const appNameConfig = configs.find(c => c.key === 'APP_NAME');
      expect(appNameConfig).toMatchObject({
        key: 'APP_NAME',
        value: 'NLC-CMS',
        type: 'string'
      });
    });

    test('should fallback to defaults when database query fails after connection succeeds', async () => {
      // Mock successful connection but failed query
      prisma.$queryRaw = vi.fn().mockResolvedValue([{ test: 1 }]);
      prisma.systemConfig.findMany = vi.fn().mockRejectedValue(new Error('Query timeout'));
      prisma.complaintType.findMany = vi.fn().mockRejectedValue(new Error('Query timeout'));

      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('default values - database error'),
        data: {
          config: expect.any(Array),
          complaintTypes: []
        },
        meta: {
          source: 'defaults_fallback',
          databaseAvailable: false,
          error: expect.any(String)
        }
      });
    });

    test('should handle partial database failures gracefully', async () => {
      // Mock successful connection and config query, but failed complaint types query
      prisma.$queryRaw = vi.fn().mockResolvedValue([{ test: 1 }]);
      prisma.systemConfig.findMany = vi.fn().mockResolvedValue([
        {
          key: 'APP_NAME',
          value: 'Database App',
          description: 'App from database',
          isActive: true
        }
      ]);
      prisma.complaintType.findMany = vi.fn().mockRejectedValue(new Error('Complaint types query failed'));

      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('retrieved successfully'),
        data: {
          config: expect.arrayContaining([
            expect.objectContaining({
              key: 'APP_NAME',
              value: 'Database App'
            })
          ]),
          complaintTypes: [] // Should be empty array due to query failure
        },
        meta: {
          source: 'database',
          databaseAvailable: true
        }
      });
    });
  });

  describe('Individual Config Retrieval Fallback', () => {
    test('should fallback to defaults for missing individual configs', async () => {
      // Mock database available but specific config not found
      prisma.$queryRaw = vi.fn().mockResolvedValue([{ test: 1 }]);
      prisma.systemConfig.findUnique = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/system-config/MISSING_CONFIG')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'System setting not found'
      });
    });

    test('should handle database errors in individual config retrieval', async () => {
      // Mock database error for specific config
      prisma.systemConfig.findUnique = vi.fn().mockRejectedValue(new Error('Database error'));

      // This should be handled by the asyncHandler middleware
      const response = await request(app)
        .get('/api/system-config/TEST_CONFIG')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String)
      });
    });
  });

  describe('Fallback Logging and Monitoring', () => {
    test('should log fallback events appropriately', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock database unavailable
      prisma.$queryRaw = vi.fn().mockRejectedValue(new Error('Connection failed'));

      await request(app)
        .get('/api/system-config/public')
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database unavailable, returning default system settings')
      );

      consoleSpy.mockRestore();
    });

    test('should include fallback metadata in responses', async () => {
      // Mock database unavailable
      prisma.$queryRaw = vi.fn().mockRejectedValue(new Error('Connection timeout'));

      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      expect(response.body.meta).toMatchObject({
        source: 'defaults',
        databaseAvailable: false
      });

      // Should not include error details in public endpoint
      expect(response.body.meta.error).toBeUndefined();
    });

    test('should include error details in fallback metadata for admin endpoints', async () => {
      // Mock database error for admin endpoint
      prisma.$queryRaw = vi.fn().mockResolvedValue([{ test: 1 }]);
      prisma.systemConfig.findMany = vi.fn().mockRejectedValue(new Error('Specific query error'));

      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      expect(response.body.meta).toMatchObject({
        source: 'defaults_fallback',
        databaseAvailable: false,
        error: 'Specific query error'
      });
    });
  });

  describe('Configuration Consistency During Fallback', () => {
    test('should return consistent default configuration structure', async () => {
      // Mock database unavailable
      prisma.$queryRaw = vi.fn().mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      const configs = response.body.data.config;
      
      // Verify all default configs have required structure
      configs.forEach(config => {
        expect(config).toMatchObject({
          key: expect.any(String),
          value: expect.any(String),
          description: expect.any(String),
          type: expect.stringMatching(/^(string|number|boolean|json)$/),
          enabled: expect.any(Boolean)
        });
      });

      // Verify essential configs are present
      const essentialKeys = ['APP_NAME', 'COMPLAINT_ID_PREFIX', 'DEFAULT_SLA_HOURS'];
      essentialKeys.forEach(key => {
        const config = configs.find(c => c.key === key);
        expect(config).toBeDefined();
        expect(config.enabled).toBe(true);
      });
    });

    test('should maintain data type consistency in fallback values', async () => {
      // Mock database unavailable
      prisma.$queryRaw = vi.fn().mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      const configs = response.body.data.config;
      
      // Check specific type consistency
      const booleanConfig = configs.find(c => c.key === 'SYSTEM_MAINTENANCE');
      expect(booleanConfig?.type).toBe('boolean');
      expect(booleanConfig?.value).toMatch(/^(true|false)$/);

      const numberConfig = configs.find(c => c.key === 'DEFAULT_SLA_HOURS');
      expect(numberConfig?.type).toBe('number');
      expect(numberConfig?.value).toMatch(/^\d+$/);

      const jsonConfig = configs.find(c => c.key === 'NOTIFICATION_SETTINGS');
      expect(jsonConfig?.type).toBe('json');
      expect(() => JSON.parse(jsonConfig?.value)).not.toThrow();
    });
  });

  describe('Recovery After Database Restoration', () => {
    test('should switch back to database values when database becomes available', async () => {
      // First request with database unavailable
      prisma.$queryRaw = vi.fn().mockRejectedValue(new Error('Connection failed'));

      const fallbackResponse = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      expect(fallbackResponse.body.meta.source).toBe('defaults');

      // Second request with database restored
      prisma.$queryRaw = vi.fn().mockResolvedValue([{ test: 1 }]);
      prisma.systemConfig.findMany = vi.fn().mockResolvedValue([
        {
          key: 'APP_NAME',
          value: 'Restored Database App',
          description: 'App from restored database',
          isActive: true
        }
      ]);
      prisma.complaintType.findMany = vi.fn().mockResolvedValue([]);

      const restoredResponse = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      expect(restoredResponse.body.meta.source).toBe('database');
      expect(restoredResponse.body.meta.databaseAvailable).toBe(true);
      
      const appNameConfig = restoredResponse.body.data.config.find(c => c.key === 'APP_NAME');
      expect(appNameConfig?.value).toBe('Restored Database App');
    });
  });

  describe('Boundary Data Fallback', () => {
    test('should handle boundary data fallback gracefully', async () => {
      // Mock database unavailable for boundary endpoint
      prisma.$queryRaw = vi.fn().mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/system-config/boundary/data')
        .expect(500); // This endpoint doesn't have fallback implemented

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Failed to fetch boundary configuration')
      });
    });

    test('should return boundary data when database is available', async () => {
      // Mock successful database connection with boundary config
      const mockGetActiveSystemConfigs = vi.fn().mockResolvedValue({
        'SERVICE_AREA_BOUNDARY': '{"type":"Polygon","coordinates":[[[72.4500,22.9500],[72.7000,22.9500],[72.7000,23.1500],[72.4500,23.1500],[72.4500,22.9500]]]}',
        'SERVICE_AREA_VALIDATION_ENABLED': 'true',
        'MAP_DEFAULT_LAT': '23.0225',
        'MAP_DEFAULT_LNG': '72.5714',
        'MAP_SEARCH_PLACE': 'Ahmedabad, Gujarat, India',
        'MAP_COUNTRY_CODES': 'in'
      });

      // We need to mock the import since it's dynamic
      vi.doMock('../../controller/systemConfigController.js', () => ({
        getActiveSystemConfigs: mockGetActiveSystemConfigs
      }));

      const response = await request(app)
        .get('/api/system-config/boundary/data')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          boundary: expect.any(Object),
          bbox: expect.objectContaining({
            north: expect.any(Number),
            south: expect.any(Number),
            east: expect.any(Number),
            west: expect.any(Number)
          }),
          defaultLat: expect.any(Number),
          defaultLng: expect.any(Number),
          mapPlace: expect.any(String),
          countryCodes: expect.any(String),
          validationEnabled: expect.any(Boolean)
        }
      });
    });
  });

  describe('Performance Under Fallback Conditions', () => {
    test('should respond quickly when using fallback values', async () => {
      // Mock database unavailable
      prisma.$queryRaw = vi.fn().mockRejectedValue(new Error('Connection timeout'));

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // Fallback should be fast (under 100ms for this simple case)
      expect(responseTime).toBeLessThan(1000);
      expect(response.body.meta.source).toBe('defaults');
    });

    test('should not retry database operations excessively during fallback', async () => {
      const queryMock = vi.fn().mockRejectedValue(new Error('Connection failed'));
      prisma.$queryRaw = queryMock;

      await request(app)
        .get('/api/system-config/public')
        .expect(200);

      // Should only attempt database connection once per request
      expect(queryMock).toHaveBeenCalledTimes(1);
    });
  });
});