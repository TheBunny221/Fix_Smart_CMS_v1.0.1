/**
 * Complaint Email Hooks
 * 
 * This module provides integration hooks for automatically triggering
 * email broadcasts when complaint status changes occur.
 * 
 * @version 1.0.3
 * @author Fix_Smart_CMS Team
 */

import emailBroadcaster from "../services/emailBroadcaster.js";
import logger from "./logger.js";

/**
 * Hook for complaint creation
 * 
 * @param {Object} complaint - Created complaint object
 * @param {string} createdByUserId - ID of user who created the complaint
 * @returns {Promise<void>}
 */
export const onComplaintCreated = async (complaint, createdByUserId) => {
  try {
    logger.info('Triggering email broadcast for complaint creation', {
      complaintId: complaint.id,
      complaintIdReadable: complaint.complaintId,
      createdByUserId
    });

    await emailBroadcaster.broadcastComplaintCreated({
      complaintId: complaint.id,
      createdByUserId
    });

  } catch (error) {
    logger.error('Failed to send complaint creation emails', {
      complaintId: complaint.id,
      error: error.message
    });
    // Don't throw - email failure shouldn't break complaint creation
  }
};

/**
 * Hook for complaint status updates
 * 
 * @param {Object} params - Status update parameters
 * @param {string} params.complaintId - Complaint ID
 * @param {string} params.newStatus - New status
 * @param {string} params.previousStatus - Previous status
 * @param {string} params.comment - Optional comment
 * @param {string} params.updatedByUserId - ID of user who made the update
 * @param {Object} params.additionalData - Additional data
 * @returns {Promise<void>}
 */
export const onComplaintStatusUpdated = async ({
  complaintId,
  newStatus,
  previousStatus,
  comment,
  updatedByUserId,
  additionalData = {}
}) => {
  try {
    logger.info('Triggering email broadcast for status update', {
      complaintId,
      newStatus,
      previousStatus,
      updatedByUserId
    });

    await emailBroadcaster.broadcastStatusUpdate({
      complaintId,
      newStatus,
      previousStatus,
      comment,
      updatedByUserId,
      additionalData
    });

  } catch (error) {
    logger.error('Failed to send status update emails', {
      complaintId,
      newStatus,
      error: error.message
    });
    // Don't throw - email failure shouldn't break status update
  }
};

/**
 * Hook for complaint assignment
 * 
 * @param {Object} params - Assignment parameters
 * @param {string} params.complaintId - Complaint ID
 * @param {string} params.assignedToUserId - ID of assigned user
 * @param {string} params.assignedByUserId - ID of user who made assignment
 * @param {string} params.assignmentType - Type of assignment ('ward_officer' or 'maintenance_team')
 * @param {string} params.comment - Optional comment
 * @returns {Promise<void>}
 */
export const onComplaintAssigned = async ({
  complaintId,
  assignedToUserId,
  assignedByUserId,
  assignmentType,
  comment
}) => {
  try {
    logger.info('Triggering email broadcast for complaint assignment', {
      complaintId,
      assignedToUserId,
      assignedByUserId,
      assignmentType
    });

    await emailBroadcaster.broadcastAssignmentUpdate({
      complaintId,
      assignedToUserId,
      assignedByUserId,
      assignmentType,
      comment
    });

  } catch (error) {
    logger.error('Failed to send assignment emails', {
      complaintId,
      assignedToUserId,
      error: error.message
    });
    // Don't throw - email failure shouldn't break assignment
  }
};

/**
 * Hook for maintenance work log updates
 * 
 * @param {Object} params - Work log parameters
 * @param {string} params.complaintId - Complaint ID
 * @param {string} params.workNote - Work note/comment
 * @param {string} params.updatedByUserId - ID of maintenance team member
 * @param {Array} params.attachments - Optional work photos/attachments
 * @returns {Promise<void>}
 */
export const onMaintenanceWorkLogged = async ({
  complaintId,
  workNote,
  updatedByUserId,
  attachments = []
}) => {
  try {
    logger.info('Triggering email broadcast for maintenance work log', {
      complaintId,
      updatedByUserId,
      hasAttachments: attachments.length > 0
    });

    await emailBroadcaster.broadcastStatusUpdate({
      complaintId,
      newStatus: 'IN_PROGRESS',
      comment: workNote,
      updatedByUserId,
      additionalData: {
        isMaintenanceUpdate: true,
        attachments: attachments.map(att => ({
          id: att.id,
          fileName: att.fileName,
          originalName: att.originalName
        }))
      }
    });

  } catch (error) {
    logger.error('Failed to send maintenance work log emails', {
      complaintId,
      error: error.message
    });
    // Don't throw - email failure shouldn't break work logging
  }
};

/**
 * Hook for complaint resolution
 * 
 * @param {Object} params - Resolution parameters
 * @param {string} params.complaintId - Complaint ID
 * @param {string} params.resolutionNote - Resolution note/comment
 * @param {string} params.resolvedByUserId - ID of user who resolved
 * @param {Array} params.resolutionPhotos - Optional resolution photos
 * @returns {Promise<void>}
 */
export const onComplaintResolved = async ({
  complaintId,
  resolutionNote,
  resolvedByUserId,
  resolutionPhotos = []
}) => {
  try {
    logger.info('Triggering email broadcast for complaint resolution', {
      complaintId,
      resolvedByUserId,
      hasResolutionPhotos: resolutionPhotos.length > 0
    });

    await emailBroadcaster.broadcastStatusUpdate({
      complaintId,
      newStatus: 'RESOLVED',
      comment: resolutionNote,
      updatedByUserId: resolvedByUserId,
      additionalData: {
        isResolution: true,
        resolutionPhotos: resolutionPhotos.map(photo => ({
          id: photo.id,
          fileName: photo.fileName,
          originalName: photo.originalName
        }))
      }
    });

  } catch (error) {
    logger.error('Failed to send complaint resolution emails', {
      complaintId,
      error: error.message
    });
    // Don't throw - email failure shouldn't break resolution
  }
};

/**
 * Hook for complaint closure
 * 
 * @param {Object} params - Closure parameters
 * @param {string} params.complaintId - Complaint ID
 * @param {string} params.closureNote - Closure note/comment
 * @param {string} params.closedByUserId - ID of user who closed
 * @param {Object} params.citizenFeedback - Optional citizen feedback
 * @returns {Promise<void>}
 */
export const onComplaintClosed = async ({
  complaintId,
  closureNote,
  closedByUserId,
  citizenFeedback = null
}) => {
  try {
    logger.info('Triggering email broadcast for complaint closure', {
      complaintId,
      closedByUserId,
      hasCitizenFeedback: !!citizenFeedback
    });

    await emailBroadcaster.broadcastStatusUpdate({
      complaintId,
      newStatus: 'CLOSED',
      comment: closureNote,
      updatedByUserId: closedByUserId,
      additionalData: {
        isClosure: true,
        citizenFeedback
      }
    });

  } catch (error) {
    logger.error('Failed to send complaint closure emails', {
      complaintId,
      error: error.message
    });
    // Don't throw - email failure shouldn't break closure
  }
};

/**
 * Hook for complaint reopening
 * 
 * @param {Object} params - Reopening parameters
 * @param {string} params.complaintId - Complaint ID
 * @param {string} params.reopenReason - Reason for reopening
 * @param {string} params.reopenedByUserId - ID of user who reopened
 * @returns {Promise<void>}
 */
export const onComplaintReopened = async ({
  complaintId,
  reopenReason,
  reopenedByUserId
}) => {
  try {
    logger.info('Triggering email broadcast for complaint reopening', {
      complaintId,
      reopenedByUserId
    });

    await emailBroadcaster.broadcastStatusUpdate({
      complaintId,
      newStatus: 'REOPENED',
      previousStatus: 'CLOSED',
      comment: reopenReason,
      updatedByUserId: reopenedByUserId,
      additionalData: {
        isReopening: true
      }
    });

  } catch (error) {
    logger.error('Failed to send complaint reopening emails', {
      complaintId,
      error: error.message
    });
    // Don't throw - email failure shouldn't break reopening
  }
};

/**
 * Utility function to safely trigger email hooks
 * 
 * @param {Function} hookFunction - Hook function to execute
 * @param {Object} params - Parameters for the hook
 * @param {string} hookName - Name of the hook for logging
 * @returns {Promise<void>}
 */
export const safelyTriggerHook = async (hookFunction, params, hookName) => {
  try {
    await hookFunction(params);
  } catch (error) {
    logger.error(`Email hook failed: ${hookName}`, {
      params,
      error: error.message,
      stack: error.stack
    });
    // Don't re-throw to prevent breaking the main operation
  }
};

export default {
  onComplaintCreated,
  onComplaintStatusUpdated,
  onComplaintAssigned,
  onMaintenanceWorkLogged,
  onComplaintResolved,
  onComplaintClosed,
  onComplaintReopened,
  safelyTriggerHook
};