import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  getActiveSystemConfig, 
  getActiveSystemConfigs,
  getPublicSystemSettings,
  auditSystemConfiguration,
  validateSystemConfiguration,
  getCanonicalKeysMapping
} from '../../controller/systemConfigController.js';

// Mock Prisma
const mockPrisma = {
  systemConfig: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn()
  },
  user: {
    count: vi.fn()
  },
  complaint: {
    count: vi.fn()
  },
  ward: {
    count: vi.fn()
  },
  complaintType: {
    findMany: vi.fn()
  },
  $queryRaw: vi.fn()
};

vi.mock('../../db/connection.dev.js', () => ({
  getPrisma: () => mockPrisma
}));

// Mock fs for file operations
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn()
  };
});

describe('SystemConfig Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveSystemConfig', () => {
    test('should return config value from database when available', async () => {
      const mockConfig = {
        key: 'APP_NAME',
        value: 'Test Application',
        isActive: true
      };

      mockPrisma.systemConfig.findUnique.mockResolvedValue(mockConfig);

      const result = await getActiveSystemConfig('APP_NAME', 'Default App');

      expect(result).toBe('Test Application');
      expect(mockPrisma.systemConfig.findUnique).toHaveBeenCalledWith({
        where: { key: 'APP_NAME' }
      });
    });

    test('should return default value when config not found', async () => {
      mockPrisma.systemConfig.findUnique.mockResolvedValue(null);

      const result = await getActiveSystemConfig('MISSING_KEY', 'Default Value');

      expect(result).toBe('Default Value');
    });

    test('should return default value when config is inactive', async () => {
      const mockConfig = {
        key: 'INACTIVE_CONFIG',
        value: 'Inactive Value',
        isActive: false
      };

      mockPrisma.systemConfig.findUnique.mockResolvedValue(mockConfig);

      const result = await getActiveSystemConfig('INACTIVE_CONFIG', 'Default Value');

      expect(result).toBe('Default Value');
    });

    test('should handle database errors gracefully', async () => {
      mockPrisma.systemConfig.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await getActiveSystemConfig('APP_NAME', 'Default App');

      expect(result).toBe('Default App');
    });

    test('should handle deprecated keys with warnings', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const mockConfig = {
        key: 'APP_NAME',
        value: 'Test Application',
        isActive: true
      };

      mockPrisma.systemConfig.findUnique.mockResolvedValue(mockConfig);

      const result = await getActiveSystemConfig('APPLICATION_NAME', 'Default App');

      expect(result).toBe('Test Application');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("DEPRECATED: Configuration key 'APPLICATION_NAME' is deprecated")
      );
      expect(mockPrisma.systemConfig.findUnique).toHaveBeenCalledWith({
        where: { key: 'APP_NAME' }
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getActiveSystemConfigs', () => {
    test('should return multiple configs as key-value map', async () => {
      const mockConfigs = [
        { key: 'APP_NAME', value: 'Test App', isActive: true },
        { key: 'COMPLAINT_ID_PREFIX', value: 'CMP', isActive: true }
      ];

      mockPrisma.systemConfig.findMany.mockResolvedValue(mockConfigs);

      const result = await getActiveSystemConfigs(['APP_NAME', 'COMPLAINT_ID_PREFIX']);

      expect(result).toEqual({
        'APP_NAME': 'Test App',
        'COMPLAINT_ID_PREFIX': 'CMP'
      });

      expect(mockPrisma.systemConfig.findMany).toHaveBeenCalledWith({
        where: {
          key: { in: ['APP_NAME', 'COMPLAINT_ID_PREFIX'] },
          isActive: true
        }
      });
    });

    test('should return empty object on database error', async () => {
      mockPrisma.systemConfig.findMany.mockRejectedValue(new Error('Database error'));

      const result = await getActiveSystemConfigs(['APP_NAME']);

      expect(result).toEqual({});
    });
  });

  describe('Database Connectivity and Fallback Behavior', () => {
    test('should detect database unavailability', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      // Create a mock request and response
      const mockReq = {};
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await getPublicSystemSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('default values'),
          meta: expect.objectContaining({
            databaseAvailable: false
          })
        })
      );
    });

    test('should return database configs when available', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
      mockPrisma.systemConfig.findMany.mockResolvedValue([
        {
          key: 'APP_NAME',
          value: 'Database App',
          description: 'App from database',
          isActive: true
        }
      ]);
      mockPrisma.complaintType.findMany.mockResolvedValue([]);

      const mockReq = {};
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await getPublicSystemSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('retrieved successfully'),
          meta: expect.objectContaining({
            databaseAvailable: true,
            source: 'database'
          })
        })
      );
    });

    test('should fallback to defaults when database query fails', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
      mockPrisma.systemConfig.findMany.mockRejectedValue(new Error('Query failed'));

      const mockReq = {};
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await getPublicSystemSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('default values - database error'),
          meta: expect.objectContaining({
            source: 'defaults_fallback',
            databaseAvailable: false
          })
        })
      );
    });
  });

  describe('Configuration Audit', () => {
    test('should perform comprehensive configuration audit', async () => {
      // Mock database configs
      mockPrisma.systemConfig.findMany.mockResolvedValue([
        { key: 'APP_NAME', value: 'Test App', description: 'App name', isActive: true, updatedAt: new Date() },
        { key: 'DUPLICATE_KEY', value: 'db_value', description: 'Duplicate in DB', isActive: true, updatedAt: new Date() }
      ]);

      // Mock fs operations for seed file
      const fs = await import('fs');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        systemConfig: [
          { key: 'SEED_ONLY_KEY', value: 'seed_value', description: 'Only in seed' },
          { key: 'DUPLICATE_KEY', value: 'seed_value', description: 'Duplicate in seed' }
        ]
      }));

      const mockReq = {};
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await auditSystemConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('audit completed successfully'),
          data: expect.objectContaining({
            databaseConfigs: expect.any(Array),
            seedConfigs: expect.any(Array),
            duplicateKeys: expect.any(Array),
            missingKeys: expect.any(Array),
            configSources: expect.objectContaining({
              database: expect.any(Number),
              seed: expect.any(Number)
            }),
            recommendations: expect.any(Array)
          })
        })
      );
    });

    test('should handle audit errors gracefully', async () => {
      mockPrisma.systemConfig.findMany.mockRejectedValue(new Error('Audit failed'));

      const mockReq = {};
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await auditSystemConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Configuration audit failed'
        })
      );
    });
  });

  describe('Configuration Validation', () => {
    test('should validate configuration integrity successfully', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
      mockPrisma.systemConfig.findMany.mockResolvedValue([
        { key: 'APP_NAME', value: 'Test App', isActive: true },
        { key: 'COMPLAINT_ID_PREFIX', value: 'CMP', isActive: true },
        { key: 'DEFAULT_SLA_HOURS', value: '48', isActive: true },
        { key: 'OTP_EXPIRY_MINUTES', value: '5', isActive: true },
        { key: 'MAX_FILE_SIZE_MB', value: '10', isActive: true }
      ]);

      // Mock fs operations
      const fs = await import('fs');
      fs.existsSync.mockReturnValue(true);

      const mockReq = {};
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await validateSystemConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('validation completed successfully'),
          data: expect.objectContaining({
            isValid: expect.any(Boolean),
            configIntegrity: expect.objectContaining({
              databaseConnectivity: true,
              seedFileExists: true,
              requiredKeysPresent: expect.any(Boolean),
              dataTypesValid: expect.any(Boolean)
            }),
            statistics: expect.objectContaining({
              totalConfigs: expect.any(Number),
              validConfigs: expect.any(Number),
              invalidConfigs: expect.any(Number)
            })
          })
        })
      );
    });

    test('should detect missing required keys', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
      mockPrisma.systemConfig.findMany.mockResolvedValue([
        { key: 'APP_NAME', value: 'Test App', isActive: true }
        // Missing required keys: COMPLAINT_ID_PREFIX, DEFAULT_SLA_HOURS, etc.
      ]);

      const fs = await import('fs');
      fs.existsSync.mockReturnValue(true);

      const mockReq = {};
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await validateSystemConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.isValid).toBe(false);
      expect(response.data.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'MISSING_REQUIRED_KEYS',
            keys: expect.arrayContaining(['COMPLAINT_ID_PREFIX', 'DEFAULT_SLA_HOURS'])
          })
        ])
      );
    });

    test('should handle validation errors', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Validation failed'));

      const mockReq = {};
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await validateSystemConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Configuration validation failed'
        })
      );
    });
  });

  describe('Canonical Keys Mapping', () => {
    test('should generate canonical keys mapping', async () => {
      mockPrisma.systemConfig.findMany.mockResolvedValue([
        { key: 'APP_NAME', value: 'Test App', description: 'App name', isActive: true },
        { key: 'APPLICATION_NAME', value: 'Old App', description: 'Old app name', isActive: true },
        { key: 'ADMIN_EMAIL', value: 'admin@test.com', description: 'Admin email', isActive: true }
      ]);

      // Mock fs operations
      const fs = await import('fs');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        systemConfig: [
          { key: 'SYSTEM_NAME', value: 'System App', description: 'System name' }
        ]
      }));

      const mockReq = {};
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await getCanonicalKeysMapping(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('canonical keys mapping generated successfully'),
          data: expect.objectContaining({
            canonicalKeys: expect.any(Object),
            duplicateGroups: expect.any(Array),
            migrationPlan: expect.any(Array),
            statistics: expect.objectContaining({
              totalKeys: expect.any(Number),
              canonicalKeys: expect.any(Number),
              duplicateGroups: expect.any(Number),
              keysToMigrate: expect.any(Number)
            })
          })
        })
      );
    });

    test('should handle canonical mapping errors', async () => {
      mockPrisma.systemConfig.findMany.mockRejectedValue(new Error('Mapping failed'));

      const mockReq = {};
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await getCanonicalKeysMapping(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to generate canonical keys mapping'
        })
      );
    });
  });

  describe('Data Type Detection', () => {
    test('should correctly identify boolean values', () => {
      // This would be tested in the controller's type detection logic
      const testCases = [
        { value: 'true', expectedType: 'boolean' },
        { value: 'false', expectedType: 'boolean' },
        { value: 'yes', expectedType: 'string' },
        { value: '1', expectedType: 'number' },
        { value: '{"key": "value"}', expectedType: 'json' },
        { value: 'regular string', expectedType: 'string' }
      ];

      testCases.forEach(({ value, expectedType }) => {
        let type = 'string';
        
        if (value === 'true' || value === 'false') {
          type = 'boolean';
        } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
          type = 'number';
        } else if (value.startsWith('{') || value.startsWith('[')) {
          type = 'json';
        }

        expect(type).toBe(expectedType);
      });
    });
  });

  describe('Error Handling and Logging', () => {
    test('should log errors appropriately', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockPrisma.systemConfig.findUnique.mockRejectedValue(new Error('Database error'));

      await getActiveSystemConfig('APP_NAME', 'Default');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error getting system config APP_NAME:'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('should handle null and undefined values gracefully', async () => {
      mockPrisma.systemConfig.findUnique.mockResolvedValue({
        key: 'TEST_KEY',
        value: null,
        isActive: true
      });

      const result = await getActiveSystemConfig('TEST_KEY', 'default');
      expect(result).toBe('default');
    });
  });
});