import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("⚠️ This seed file is deprecated. Please use the new JSON-based seeding system:");
  console.log("📝 Set environment variables:");
  console.log("   ADMIN_EMAIL=admin@cochinsmartcity.dev");
  console.log("   ADMIN_PASSWORD=admin123");
  console.log("   DESTRUCTIVE_SEED=true");
  console.log("🚀 Then run: npx prisma db seed");
  console.log("");
  console.log("ℹ️ The new system reads seed data from prisma/seed.json");
  console.log("ℹ️ You can customize the data by editing that file");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
