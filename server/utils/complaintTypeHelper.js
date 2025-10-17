import { getPrisma } from "../db/connection.js";

const prisma = getPrisma();

// Cache for complaint types to reduce database queries
let complaintTypesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all active complaint types from the system
 * Uses caching to reduce database load
 */
export const getComplaintTypes = async () => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (complaintTypesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return complaintTypesCache;
  }
  
  try {
    // Fetch from new complaint_types table
    const types = await prisma.complaintType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    });
    
    if (types.length > 0) {
      complaintTypesCache = types.map(type => ({
        id: type.id,
        name: type.name,
        description: type.description,
        priority: type.priority,
        slaHours: type.slaHours,
        isActive: type.isActive
      }));
      cacheTimestamp = now;
      return complaintTypesCache;
    }
    
    // Fallback to legacy system config if no types in new table
    const legacyTypes = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: "COMPLAINT_TYPE_" },
        isActive: true
      }
    });
    
    const parsedTypes = [];
    for (const config of legacyTypes) {
      try {
        const typeData = JSON.parse(config.value);
        if (typeData.name) {
          parsedTypes.push({
            id: config.key.replace("COMPLAINT_TYPE_", ""),
            name: typeData.name,
            description: typeData.description || "",
            priority: typeData.priority || "MEDIUM",
            slaHours: typeData.slaHours || 48,
            isActive: true
          });
        }
      } catch (e) {
        console.warn(`Failed to parse complaint type config: ${config.key}`, e);
      }
    }
    
    complaintTypesCache = parsedTypes;
    cacheTimestamp = now;
    return complaintTypesCache;
    
  } catch (error) {
    console.error("Failed to fetch complaint types:", error);
    return [];
  }
};

/**
 * Get complaint type by ID or name
 */
export const getComplaintTypeById = async (identifier) => {
  const types = await getComplaintTypes();
  return types.find(type => 
    type.id === identifier || 
    type.name === identifier ||
    type.id === parseInt(identifier)
  );
};

/**
 * Validate if a complaint type exists and is active
 */
export const isValidComplaintType = async (identifier) => {
  const type = await getComplaintTypeById(identifier);
  return !!type;
};

/**
 * Clear the complaint types cache (useful after admin updates)
 */
export const clearComplaintTypesCache = () => {
  complaintTypesCache = null;
  cacheTimestamp = null;
};

/**
 * Get complaint type names for validation
 */
export const getComplaintTypeNames = async () => {
  const types = await getComplaintTypes();
  return types.map(type => type.name);
};

/**
 * Get complaint type IDs for validation
 */
export const getComplaintTypeIds = async () => {
  const types = await getComplaintTypes();
  return types.map(type => type.id);
};