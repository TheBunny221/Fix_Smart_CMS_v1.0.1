import bcrypt from "bcryptjs";

// Helper function to hash passwords
async function hash(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Helper function to get random element from array
function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to add jitter to coordinates
function jitter(value, amount = 0.01) {
  return value + (Math.random() - 0.5) * amount;
}

// Helper function to convert string to token format
function toToken(str) {
  return String(str || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// Helper function to check if a model exists in the current schema
function hasModel(prisma, modelName) {
  try {
    return prisma[modelName] !== undefined;
  } catch {
    return false;
  }
}

// Export helper functions for use in other seed scripts
export {
  hash,
  randomFrom,
  jitter,
  toToken,
  hasModel
};

// Legacy export for backward compatibility
export default async function seedCommon(prisma, options = {}) {
  console.log("⚠️ seedCommon is deprecated. Please use the new JSON-based seeding with 'npx prisma db seed'");
  console.log("ℹ️ The new seeding system reads data from prisma/seed.json");
  
  // You can still call the new seeding system if needed
  // But it's recommended to use 'npx prisma db seed' directly
}