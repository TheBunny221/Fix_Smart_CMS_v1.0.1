/**
 * Utility functions for handling complaint ID formatting and placeholders
 */

export interface ComplaintIdConfig {
  prefix: string;
  length: number;
  startNumber: number;
}

/**
 * Generates a dynamic complaint ID placeholder based on system configuration
 * @param config - The complaint ID configuration from system settings
 * @returns A formatted example complaint ID (e.g., "CMP-00045")
 */
export const generateComplaintIdPlaceholder = (config: ComplaintIdConfig): string => {
  const { prefix, length, startNumber } = config;
  
  // Generate a sample number that's a bit higher than the start number for demonstration
  const sampleNumber = startNumber + 44; // Adding 44 to make it look like there are existing complaints
  
  // Pad the number with zeros based on the configured length
  const paddedNumber = sampleNumber.toString().padStart(length, '0');
  
  return `${prefix}-${paddedNumber}`;
};

/**
 * Extracts complaint ID configuration from system config
 * @param systemConfig - The system configuration object
 * @returns ComplaintIdConfig object with defaults if not found
 */
export const getComplaintIdConfig = (systemConfig: Record<string, string>): ComplaintIdConfig => {
  return {
    prefix: systemConfig.COMPLAINT_ID_PREFIX || 'CMP',
    length: parseInt(systemConfig.COMPLAINT_ID_LENGTH || '5', 10),
    startNumber: parseInt(systemConfig.COMPLAINT_ID_START_NUMBER || '1', 10),
  };
};

/**
 * Validates if a complaint ID matches the expected format
 * @param complaintId - The complaint ID to validate
 * @param config - The complaint ID configuration
 * @returns boolean indicating if the format is valid
 */
export const validateComplaintIdFormat = (
  complaintId: string,
  config: ComplaintIdConfig
): boolean => {
  const { prefix, length } = config;
  const expectedPattern = new RegExp(`^${prefix}-\\d{${length}}$`);
  return expectedPattern.test(complaintId);
};