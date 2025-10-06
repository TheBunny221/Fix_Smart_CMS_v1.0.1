import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("⚠️ This seed file is deprecated. Please use the new JSON-based seeding system:");
  console.log("📝 Set environment variables:");
  console.log("   ADMIN_EMAIL=your-admin@email.com");
  console.log("   ADMIN_PASSWORD=your-secure-password");
  console.log("   DESTRUCTIVE_SEED=false  # for production");
  console.log("🚀 Then run: npx prisma db seed");
  console.log("");
  console.log("ℹ️ The new system reads seed data from prisma/seed.json");
  console.log("ℹ️ You can customize the data by editing that file");
  
  const adminEmail = process.env.ADMIN_EMAIL || null;
  const adminPassword = process.env.ADMIN_PASSWORD || null;

  if (!adminEmail || !adminPassword) {
    console.log("⚠️ ADMIN_EMAIL and ADMIN_PASSWORD not set. Admin creation will be skipped.");
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
