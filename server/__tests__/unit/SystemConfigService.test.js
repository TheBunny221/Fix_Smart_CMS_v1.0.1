import { describe, test, expect, beforeEach, vi } from 'vitest';
import SystemConfigService from '../../services/SystemConfigService.js';
import configurationLogger from '../../services/ConfigurationLogger.js';

// Mock the dependencies
vi.mock('../../db/connection.dev.js', () => ({
  getPrisma: vi.fn(() => ({
    systemConfig: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn()
    },
    $queryRaw: vi.fn()
  }))
}));

vi.mock('../../services/ConfigurationLogger.js', () => ({
  default: {
    logInitialization: vi.fn(),
    logSeedDataLoading: vi.fn(),
    logDatabaseConnectivity: vi.fn(),
    logDatabaseLoading: vi.fn(),
    logFallbackUsage: vi.fn(),
    logConfigRetrieval: vi.fn(),
    logConfigUpdate: vi.fn(),
    logCacheOperation: vi.fn(),
    logValidation: vi.fn(),
    logPerformance: vi.fn(),
    logError: vi.fn(),
    logHealthStatus: vi.fn(),
    logStatistics: vi.fn()
  }
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn()
}));

describe('SystemConfigService Configuration Logging', () => {
  let systemConfigService;
  let mockPrisma;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create a new instance for each test
    systemConfigService = new (SystemConfigService.constructor)();
    mockPrisma = systemConfigService.prisma;
    
    // Mock seed data
    systemConfigService.seedData = {
      systemConfig: [
        { key: 'APP_NAME', value: 'Test App', isActive: true },
        { key: 'COMPLAINT_ID_PREFIX', value: 'CMP', isActive: true }
      ]
    };
  });

  describe('Initialization Logging', () => {
    test('should log successful initialization', async () => {
      const fs = await import('fs');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        systemConfig: [{ key: 'TEST_KEY', value: 'test_value', isActive: true }]
      }));

      await systemConfigService.initialize();

      expect(configurationLogger.logInitialization).toHaveBeenCalledWith(
        true,
        expect.objectContaining({
          seedPath: expect.stringContaining('seed.json'),
          cacheTTL: expect.any(Number)
        })
      );
    });

    test('should log failed initialization', async () => {
      const fs = await import('fs');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      try {
        await systemConfigService.initialize();
      } catch (error) {
        // Expected to throw
      }

      expect(configurationLogger.logInitialization).toHaveBeenCalledWith(
        false,
        expect.objectContaining({
          error: expect.any(String),
          seedPath: expect.stringContaining('seed.json')
        })
      );
    });
  });

  describe('Database Connectivity Logging', () => {
    test('should log successful database connectivity', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);

      const result = await systemConfigService.isDatabaseAvailable();

      expect(result).toBe(true);
      expect(configurationLogger.logDatabaseConnectivity).toHaveBeenCalledWith(true);
    });

    test('should log failed database connectivity', async () => {
      const error = new Error('Database connection failed');
      mockPrisma.$queryRaw.mockRejectedValue(error);

      const result = await systemConfigService.isDatabaseAvailable();

      expect(result).toBe(false);
      expect(configurationLogger.logDatabaseConnectivity).toHaveBeenCalledWith(
        false,
        { error: error.message }
      );
    });
  });

  describe('Configuration Loading Logging', () => {
    test('should log successful database loading', async () => {
      const mockConfigs = [
        { key: 'APP_NAME', value: 'Test App', description: 'App name', updatedAt: new Date() }
      ];
      mockPrisma.systemConfig.findMany.mockResolvedValue(mockConfigs);

      await systemConfigService.loadFromDatabase();

      expect(configurationLogger.logDatabaseLoading).toHaveBeenCalledWith(
        true,
        { configCount: 1 }
      );
      expect(configurationLogger.logPerformance).toHaveBeenCalledWith(
        'loadFromDatabase',
        expect.any(Number),
        { configCount: 1 }
      );
    });

    test('should log failed database loading', async () => {
      const error = new Error('Database query failed');
      mockPrisma.systemConfig.findMany.mockRejectedValue(error);

      try {
        await systemConfigService.loadFromDatabase();
      } catch (e) {
        // Expected to throw
      }

      expect(configurationLogger.logDatabaseLoading).toHaveBeenCalledWith(
        false,
        { error: error.message }
      );
    });
  });

  describe('Fallback Logging', () => {
    test('should log fallback usage when database is unavailable', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      await systemConfigService.getConfig('APP_NAME', 'Default App');

      expect(configurationLogger.logFallbackUsage).toHaveBeenCalledWith(
        'APP_NAME',
        'database_unavailable',
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );
    });

    test('should log fallback usage when config not found in database', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
      mockPrisma.systemConfig.findUnique.mockResolvedValue(null);

      await systemConfigService.getConfig('MISSING_KEY', 'default');

      expect(configurationLogger.logFallbackUsage).toHaveBeenCalledWith(
        'MISSING_KEY',
        'config_not_found',
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Configuration Retrieval Logging', () => {
    test('should log successful config retrieval from database', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
      mockPrisma.systemConfig.findUnique.mockResolvedValue({
        key: 'APP_NAME',
        value: 'Test App',
        description: 'App name',
        updatedAt: new Date()
      });

      const result = await systemConfigService.getConfig('APP_NAME');

      expect(result).toBe('Test App');
      expect(configurationLogger.logConfigRetrieval).toHaveBeenCalledWith(
        'APP_NAME',
        'database',
        true
      );
    });

    test('should log successful config retrieval from seed', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB unavailable'));

      const result = await systemConfigService.getConfig('APP_NAME');

      expect(result).toBe('Test App');
      expect(configurationLogger.logConfigRetrieval).toHaveBeenCalledWith(
        'APP_NAME',
        'seed',
        true
      );
    });

    test('should log failed config retrieval with default value', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB unavailable'));
      systemConfigService.seedData = { systemConfig: [] };

      const result = await systemConfigService.getConfig('MISSING_KEY', 'default_value');

      expect(result).toBe('default_value');
      expect(configurationLogger.logConfigRetrieval).toHaveBeenCalledWith(
        'MISSING_KEY',
        'default',
        false,
        expect.objectContaining({
          reason: 'not_found',
          defaultValue: 'default_value'
        })
      );
    });
  });

  describe('Configuration Update Logging', () => {
    test('should log successful config update', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
      mockPrisma.systemConfig.upsert.mockResolvedValue({
        key: 'APP_NAME',
        value: 'Updated App',
        description: 'Updated description'
      });

      await systemConfigService.updateConfig('APP_NAME', 'Updated App', 'Updated description');

      expect(configurationLogger.logConfigUpdate).toHaveBeenCalledWith(
        'APP_NAME',
        true,
        expect.objectContaining({
          value: 'Updated App',
          description: 'Updated description',
          operation: 'upsert'
        })
      );
    });

    test('should log failed config update when database unavailable', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB unavailable'));

      try {
        await systemConfigService.updateConfig('APP_NAME', 'Updated App');
      } catch (error) {
        // Expected to throw
      }

      expect(configurationLogger.logConfigUpdate).toHaveBeenCalledWith(
        'APP_NAME',
        false,
        expect.objectContaining({
          value: 'Updated App',
          error: expect.any(String)
        })
      );
    });
  });

  describe('Cache Operation Logging', () => {
    test('should log cache hit', async () => {
      // Set up cache
      systemConfigService.setCacheValue('TEST_KEY', {
        value: 'cached_value',
        source: 'database'
      });

      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);

      await systemConfigService.getConfig('TEST_KEY');

      expect(configurationLogger.logCacheOperation).toHaveBeenCalledWith(
        'hit',
        'TEST_KEY',
        true,
        expect.objectContaining({
          source: 'database'
        })
      );
    });

    test('should log cache invalidation', () => {
      systemConfigService.setCacheValue('TEST_KEY', { value: 'test' });

      systemConfigService.invalidateCache('TEST_KEY');

      expect(configurationLogger.logCacheOperation).toHaveBeenCalledWith(
        'invalidate',
        'TEST_KEY',
        true
      );
    });

    test('should log cache refresh', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
      mockPrisma.systemConfig.findMany.mockResolvedValue([
        { key: 'APP_NAME', value: 'Test App', description: 'App name', updatedAt: new Date() }
      ]);

      await systemConfigService.refreshCache();

      expect(configurationLogger.logCacheOperation).toHaveBeenCalledWith(
        'refresh',
        null,
        true,
        expect.objectContaining({
          config_count: expect.any(Number),
          duration_ms: expect.any(Number)
        })
      );
    });
  });

  describe('Validation Logging', () => {
    test('should log successful validation', () => {
      const config = {
        'APP_NAME': 'Test App',
        'COMPLAINT_ID_PREFIX': 'CMP',
        'DEFAULT_SLA_HOURS': '24',
        'ADMIN_EMAIL': 'admin@test.com'
      };

      const result = systemConfigService.validateConfiguration(config);

      expect(result).toBe(true);
      expect(configurationLogger.logValidation).toHaveBeenCalledWith(
        true,
        expect.objectContaining({
          validated_keys: 4,
          config_source: 'unknown'
        })
      );
    });

    test('should log failed validation with missing keys', () => {
      const config = {
        'APP_NAME': 'Test App'
      };

      const result = systemConfigService.validateConfiguration(config);

      expect(result).toBe(false);
      expect(configurationLogger.logValidation).toHaveBeenCalledWith(
        false,
        expect.objectContaining({
          missing: expect.arrayContaining(['COMPLAINT_ID_PREFIX', 'DEFAULT_SLA_HOURS', 'ADMIN_EMAIL']),
          total_required: 4,
          found: 1
        })
      );
    });
  });

  describe('Health Status Logging', () => {
    test('should log healthy status', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);

      const health = await systemConfigService.getHealthStatus();

      expect(health.healthy).toBe(true);
      expect(configurationLogger.logHealthStatus).toHaveBeenCalledWith(
        true,
        expect.objectContaining({
          healthy: true,
          database_available: true,
          seed_data_loaded: true,
          initialized: expect.any(Boolean)
        })
      );
    });

    test('should log unhealthy status', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB error'));
      systemConfigService.seedData = null;

      const health = await systemConfigService.getHealthStatus();

      expect(health.healthy).toBe(false);
      expect(configurationLogger.logHealthStatus).toHaveBeenCalledWith(
        false,
        expect.objectContaining({
          healthy: false,
          database_available: false,
          seed_data_loaded: false
        })
      );
    });
  });

  describe('Statistics Logging', () => {
    test('should log cache statistics', () => {
      systemConfigService.setCacheValue('KEY1', { value: 'value1' });
      systemConfigService.setCacheValue('KEY2', { value: 'value2' });

      const stats = systemConfigService.getCacheStats();

      expect(configurationLogger.logStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 2,
          ttl: expect.any(Number),
          keys: expect.arrayContaining(['KEY1', 'KEY2']),
          timestamp: expect.any(String)
        })
      );
    });
  });
});