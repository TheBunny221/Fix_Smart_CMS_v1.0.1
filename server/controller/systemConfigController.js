/**
 * SystemConfig Controller
 * 
 * Handles API endpoints for system configuration management
 * and provides cached config data to frontend.
 * 
 * @version 1.0.3
 * @author Fix_Smart_CMS Team
 */

import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import systemConfigCache from "../services/systemConfigCache.js";
import logger from "../utils/logger.js";

const prisma = getPrisma();

/**
 * @desc    Get public system configuration for frontend
 * @route   GET /api/config/public
 * @access  Public
 */
export const getPublicConfig = asyncHandler(async (req, res) => {
  try {
    const appConfig = systemConfigCache.getAppConfig();
    const emailConfig = systemConfigCache.getEmailConfig();
    
    // Only expose safe, public configuration values
    const publicConfig = {
      appName: appConfig.appName,
      appVersion: appConfig.appVersion,
      organizationName: appConfig.organizationName,
      websiteUrl: appConfig.websiteUrl,
      logoUrl: appConfig.logoUrl,
      primaryColor: appConfig.primaryColor,
      secondaryColor: appConfig.secondaryColor,
      supportEmail: emailConfig.replyToEmail,
      // Add complaint-specific configs
      complaintIdPrefix: systemConfigCache.get('COMPLAINT_ID_PREFIX', 'KSC'),
      complaintIdLength: parseInt(systemConfigCache.get('COMPLAINT_ID_LENGTH', '4')),
      autoAssignComplaints: systemConfigCache.get('AUTO_ASSIGN_COMPLAINTS', 'false') === 'true',
      // Add any other public configs as needed
      maintenanceMode: systemConfigCache.get('MAINTENANCE_MODE', 'false') === 'true',
      registrationEnabled: systemConfigCache.get('REGISTRATION_ENABLED', 'true') === 'true'
    };

    res.json({
      success: true,
      data: publicConfig,
      cached: systemConfigCache.getStats()
    });

  } catch (error) {
    logger.error('Failed to get public config', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system configuration'
    });
  }
});

/**
 * @desc    Get all system configuration (admin only)
 * @route   GET /api/config/admin
 * @access  Private (Admin)
 */
export const getAdminConfig = asyncHandler(async (req, res) => {
  try {
    // Get all configs from cache
    const allConfigs = systemConfigCache.getAll();
    const cacheStats = systemConfigCache.getStats();

    // Also get fresh data from database for comparison
    const dbConfigs = await prisma.systemConfig.findMany({
      where: { isActive: true },
      orderBy: [
        { type: 'asc' },
        { key: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: {
        cached: allConfigs,
        database: dbConfigs,
        cacheStats
      }
    });

  } catch (error) {
    logger.error('Failed to get admin config', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin configuration'
    });
  }
});

/**
 * @desc    Update system configuration
 * @route   PUT /api/config/:key
 * @access  Private (Admin)
 */
export const updateConfig = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, type, description } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Key and value are required'
    });
  }

  try {
    // Update in database
    const updatedConfig = await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value: String(value),
        type: type || null,
        description: description || null,
        updatedAt: new Date()
      },
      create: {
        key,
        value: String(value),
        type: type || null,
        description: description || null,
        isActive: true
      }
    });

    // Force refresh cache to pick up changes immediately
    await systemConfigCache.forceRefresh();

    logger.info('System configuration updated', {
      key,
      value,
      type,
      updatedBy: req.user?.id
    });

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: updatedConfig
    });

  } catch (error) {
    logger.error('Failed to update config', {
      key,
      value,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update configuration'
    });
  }
});

/**
 * @desc    Delete system configuration
 * @route   DELETE /api/config/:key
 * @access  Private (Admin)
 */
export const deleteConfig = asyncHandler(async (req, res) => {
  const { key } = req.params;

  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'Configuration key is required'
    });
  }

  try {
    // Soft delete by setting isActive to false
    const updatedConfig = await prisma.systemConfig.update({
      where: { key },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Force refresh cache
    await systemConfigCache.forceRefresh();

    logger.info('System configuration deleted', {
      key,
      deletedBy: req.user?.id
    });

    res.json({
      success: true,
      message: 'Configuration deleted successfully',
      data: updatedConfig
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    logger.error('Failed to delete config', {
      key,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete configuration'
    });
  }
});

/**
 * @desc    Refresh system configuration cache
 * @route   POST /api/config/refresh
 * @access  Private (Admin)
 */
export const refreshCache = asyncHandler(async (req, res) => {
  try {
    await systemConfigCache.forceRefresh();
    const stats = systemConfigCache.getStats();

    logger.info('System configuration cache refreshed manually', {
      refreshedBy: req.user?.id,
      stats
    });

    res.json({
      success: true,
      message: 'Configuration cache refreshed successfully',
      data: stats
    });

  } catch (error) {
    logger.error('Failed to refresh config cache', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to refresh configuration cache'
    });
  }
});

/**
 * @desc    Get cache statistics
 * @route   GET /api/config/stats
 * @access  Private (Admin)
 */
export const getCacheStats = asyncHandler(async (req, res) => {
  try {
    const stats = systemConfigCache.getStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get cache stats', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics'
    });
  }
});

/**
 * @desc    Bulk update system configurations
 * @route   POST /api/config/bulk
 * @access  Private (Admin)
 */
export const bulkUpdateConfig = asyncHandler(async (req, res) => {
  const { configs } = req.body;

  if (!configs || !Array.isArray(configs) || configs.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Configs array is required and must not be empty'
    });
  }

  // Validate each config object
  for (const config of configs) {
    if (!config.key || config.value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Each config must have key and value properties'
      });
    }
  }

  try {
    const results = await systemConfigCache.bulkUpdate(configs);

    logger.info('Bulk configuration update completed', {
      updated: results.updated.length,
      created: results.created.length,
      errors: results.errors.length,
      updatedBy: req.user?.id
    });

    res.json({
      success: true,
      message: 'Bulk configuration update completed',
      data: results
    });

  } catch (error) {
    logger.error('Failed to bulk update configs', {
      error: error.message,
      configCount: configs.length,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to bulk update configurations'
    });
  }
});

/**
 * @desc    Get configurations by type
 * @route   GET /api/config/type/:type
 * @access  Private (Admin)
 */
export const getConfigByType = asyncHandler(async (req, res) => {
  const { type } = req.params;

  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Configuration type is required'
    });
  }

  try {
    const configs = systemConfigCache.getByType(type);
    
    res.json({
      success: true,
      data: {
        type,
        configs,
        count: Object.keys(configs).length
      }
    });

  } catch (error) {
    logger.error('Failed to get configs by type', {
      type,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve configurations by type'
    });
  }
});

/**
 * @desc    Get configurations by pattern
 * @route   GET /api/config/pattern/:pattern
 * @access  Private (Admin)
 */
export const getConfigByPattern = asyncHandler(async (req, res) => {
  const { pattern } = req.params;
  const { matchType = 'startsWith' } = req.query;

  if (!pattern) {
    return res.status(400).json({
      success: false,
      message: 'Pattern is required'
    });
  }

  const validMatchTypes = ['startsWith', 'endsWith', 'includes'];
  if (!validMatchTypes.includes(matchType)) {
    return res.status(400).json({
      success: false,
      message: `Match type must be one of: ${validMatchTypes.join(', ')}`
    });
  }

  try {
    const configs = systemConfigCache.getByPattern(pattern, matchType);
    
    res.json({
      success: true,
      data: {
        pattern,
        matchType,
        configs,
        count: Object.keys(configs).length
      }
    });

  } catch (error) {
    logger.error('Failed to get configs by pattern', {
      pattern,
      matchType,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve configurations by pattern'
    });
  }
});

/**
 * @desc    Create new system configuration
 * @route   POST /api/config
 * @access  Private (Admin)
 */
export const createConfig = asyncHandler(async (req, res) => {
  const { key, value, type, description } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Key and value are required'
    });
  }

  try {
    // Check if key already exists
    if (systemConfigCache.has(key)) {
      return res.status(409).json({
        success: false,
        message: 'Configuration key already exists'
      });
    }

    const result = await systemConfigCache.set(key, value, type, description);

    logger.info('System configuration created', {
      key,
      value,
      type,
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: 'Configuration created successfully',
      data: result
    });

  } catch (error) {
    logger.error('Failed to create config', {
      key,
      value,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create configuration'
    });
  }
});

export default {
  getPublicConfig,
  getAdminConfig,
  updateConfig,
  deleteConfig,
  refreshCache,
  getCacheStats,
  bulkUpdateConfig,
  getConfigByType,
  getConfigByPattern,
  createConfig
};