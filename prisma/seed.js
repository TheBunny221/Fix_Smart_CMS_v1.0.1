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

// Main seeding function
async function main() {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Read seed data from JSON file
    const seedDataPath = join(__dirname,"seeds" , "seed.json");
    const seedData = JSON.parse(readFileSync(seedDataPath, "utf8"));
    
    // Get environment variables
    const adminEmail = process.env.ADMIN_EMAIL || "admin@fixsmart.dev";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin@123";
    const destructive = process.env.DESTRUCTIVE_SEED === "true";
    
    console.log(`🔧 Mode: ${destructive ? "Destructive" : "Non-destructive"}`);
    
    // Clear existing data if destructive mode
    if (destructive) {
      console.log("🧹 Clearing existing data...");
      
      const deleteOrder = [
        "attachment", "notification", "statusLog", "oTPSession",
        "complaint", "complaintType", "subZone", "user", "ward", "systemConfig"
      ];
      
      for (const modelName of deleteOrder) {
        try {
          await prisma[modelName].deleteMany({});
          console.log(`  ✅ Cleared ${modelName}`);
        } catch (error) {
          console.log(`  ⚠️ Could not clear ${modelName}: ${error.message}`);
        }
      }
    }
    
    // Seed System Configuration
    if (seedData.systemConfig) {
      console.log(`📝 Seeding systemConfig (${seedData.systemConfig.length} records)...`);
      
      for (const config of seedData.systemConfig) {
        try {
          await prisma.systemConfig.upsert({
            where: { key: config.key },
            update: {
              value: config.value,
              description: config.description || null,
              isActive: config.isActive !== undefined ? config.isActive : true,
            },
            create: {
              key: config.key,
              value: config.value,
              description: config.description || null,
              isActive: config.isActive !== undefined ? config.isActive : true,
            },
          });
        } catch (error) {
          console.log(`    ❌ Error inserting config ${config.key}: ${error.message}`);
        }
      }
      console.log(`  ✅ systemConfig seeding completed`);
    }
    
    // Seed Wards
    if (seedData.ward) {
      console.log(`📝 Seeding wards (${seedData.ward.length} records)...`);
      
      for (const ward of seedData.ward) {
        try {
          await prisma.ward.upsert({
            where: { name: ward.name },
            update: {
              description: ward.description,
              isActive: ward.isActive !== undefined ? ward.isActive : true,
            },
            create: {
              name: ward.name,
              description: ward.description,
              isActive: ward.isActive !== undefined ? ward.isActive : true,
            },
          });
        } catch (error) {
          console.log(`    ❌ Error inserting ward ${ward.name}: ${error.message}`);
        }
      }
      console.log(`  ✅ wards seeding completed`);
    }
    
    // Seed Complaint Types
    if (seedData.complaintType) {
      console.log(`📝 Seeding complaintTypes (${seedData.complaintType.length} records)...`);
      
      for (const type of seedData.complaintType) {
        try {
          await prisma.complaintType.upsert({
            where: { name: type.name },
            update: {
              description: type.description,
              priority: type.priority,
              slaHours: type.slaHours,
              isActive: type.isActive !== undefined ? type.isActive : true,
            },
            create: {
              name: type.name,
              description: type.description,
              priority: type.priority,
              slaHours: type.slaHours,
              isActive: type.isActive !== undefined ? type.isActive : true,
            },
          });
        } catch (error) {
          console.log(`    ❌ Error inserting complaint type ${type.name}: ${error.message}`);
        }
      }
      console.log(`  ✅ complaintTypes seeding completed`);
    }
    
    // Create admin user
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
    
    console.log("🎉 Database seeding completed successfully!");
    
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });