import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

// Helper function to hash passwords
async function hash(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Helper function to check if a model exists in the current schema
function hasModel(modelName) {
  try {
    return prisma[modelName] !== undefined;
  } catch {
    return false;
  }
}

// Helper function to get model name from Prisma (handles case sensitivity)
function getModelName(jsonKey) {
  // Convert JSON key to potential Prisma model names
  const variations = [
    jsonKey,
    jsonKey.toLowerCase(),
    jsonKey.charAt(0).toLowerCase() + jsonKey.slice(1),
    jsonKey.charAt(0).toUpperCase() + jsonKey.slice(1)
  ];
  
  for (const variation of variations) {
    if (hasModel(variation)) {
      return variation;
    }
  }
  return null;
}

// Main seeding function
async function seedFromJSON() {
  try {
    console.log("🌱 Starting JSON-based seeding...");
    
    // Read seed data from JSON file
    const seedDataPath = join(__dirname, "seed.json");
    const seedData = JSON.parse(readFileSync(seedDataPath, "utf8"));
    
    // Get environment variables for admin setup
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const destructive = process.env.DESTRUCTIVE_SEED === "true";
    
    console.log(`🔧 Mode: ${destructive ? "Destructive" : "Non-destructive"}`);
    
    // If destructive mode, clear existing data
    if (destructive) {
      console.log("🧹 Clearing existing data...");
      
      const deleteOrder = [
        "attachment", "complaintPhoto", "material", "notification", "message",
        "serviceRequestStatusLog", "statusLog", "oTPSession", "serviceRequest",
        "complaint", "complaintType", "subZone", "user", "ward", "systemConfig",
        "department", "report"
      ];
      
      for (const modelName of deleteOrder) {
        if (hasModel(modelName)) {
          try {
            await prisma[modelName].deleteMany({});
            console.log(`  ✅ Cleared ${modelName}`);
          } catch (error) {
            console.log(`  ⚠️ Could not clear ${modelName}: ${error.message}`);
          }
        }
      }
    }
    
    // Process each model in the JSON data
    for (const [jsonKey, records] of Object.entries(seedData)) {
      const modelName = getModelName(jsonKey);
      
      if (!modelName) {
        console.log(`⚠️ Model '${jsonKey}' not found in Prisma schema, skipping...`);
        continue;
      }
      
      if (!Array.isArray(records)) {
        console.log(`⚠️ Data for '${jsonKey}' is not an array, skipping...`);
        continue;
      }
      
      console.log(`📝 Seeding ${modelName} (${records.length} records)...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const record of records) {
        try {
          // Handle special cases for different models
          if (modelName === "systemConfig") {
            await prisma[modelName].upsert({
              where: { key: record.key },
              update: {
                value: record.value,
                description: record.description || null,
                isActive: record.isActive !== undefined ? record.isActive : true,
              },
              create: {
                key: record.key,
                value: record.value,
                description: record.description || null,
                isActive: record.isActive !== undefined ? record.isActive : true,
              },
            });
          } else if (modelName === "ward") {
            await prisma[modelName].upsert({
              where: { name: record.name },
              update: {
                description: record.description,
                isActive: record.isActive !== undefined ? record.isActive : true,
              },
              create: {
                name: record.name,
                description: record.description,
                isActive: record.isActive !== undefined ? record.isActive : true,
              },
            });
          } else if (modelName === "complaintType") {
            await prisma[modelName].upsert({
              where: { name: record.name },
              update: {
                description: record.description,
                priority: record.priority,
                slaHours: record.slaHours,
                isActive: record.isActive !== undefined ? record.isActive : true,
              },
              create: {
                name: record.name,
                description: record.description,
                priority: record.priority,
                slaHours: record.slaHours,
                isActive: record.isActive !== undefined ? record.isActive : true,
              },
            });
          } else {
            // Generic upsert for other models
            // Try to find a unique field for upsert
            const uniqueField = record.name ? "name" : record.email ? "email" : record.key ? "key" : "id";
            
            if (record[uniqueField]) {
              await prisma[modelName].upsert({
                where: { [uniqueField]: record[uniqueField] },
                update: record,
                create: record,
              });
            } else {
              // If no unique field found, just create
              await prisma[modelName].create({
                data: record,
              });
            }
          }
          
          successCount++;
        } catch (error) {
          console.log(`    ❌ Error inserting record: ${error.message}`);
          errorCount++;
        }
      }
      
      console.log(`  ✅ ${modelName}: ${successCount} successful, ${errorCount} errors`);
    }
    
    // Create admin user if credentials provided
    if (adminEmail && adminPassword) {
      console.log("👤 Setting up admin user...");
      
      try {
        const existingAdmin = await prisma.user.findUnique({
          where: { email: adminEmail },
        });
        
        if (!existingAdmin) {
          const hashedPassword = await hash(adminPassword);
          await prisma.user.create({
            data: {
              email: adminEmail,
              fullName: "Administrator",
              password: hashedPassword,
              role: "ADMINISTRATOR",
              language: "en",
              isActive: true,
              joinedOn: new Date(),
            },
          });
          console.log(`  ✅ Created admin: ${adminEmail}`);
        } else if (existingAdmin.role !== "ADMINISTRATOR") {
          await prisma.user.update({
            where: { email: adminEmail },
            data: { role: "ADMINISTRATOR" },
          });
          console.log(`  ✅ Promoted ${adminEmail} to ADMINISTRATOR`);
        } else {
          console.log(`  ℹ️ Admin ${adminEmail} already exists`);
        }
      } catch (error) {
        console.log(`  ❌ Error setting up admin: ${error.message}`);
      }
    } else {
      console.log("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not provided; skipping admin creation");
    }
    
    console.log("🎉 JSON-based seeding completed successfully!");
    
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    throw error;
  }
}

// Run the seeding
async function main() {
  await seedFromJSON();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });