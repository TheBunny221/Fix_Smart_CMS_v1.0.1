/**
 * ComplaintType Seed Script
 * 
 * Seeds the ComplaintType table with default complaint types
 * 
 * Usage: node server/scripts/seedComplaintTypes.js
 */

import { loadEnvironmentConfig } from "../config/environment.js";
import { getPrisma } from "../db/connection.js";
import logger from "../utils/logger.js";

// Load environment configuration
loadEnvironmentConfig();

console.log('🚀 Starting ComplaintType seeding script...');

const prisma = getPrisma();

const defaultComplaintTypes = [
  {
    name: 'Water Supply',
    description: 'Issues related to water supply, quality, and availability',
    priority: 'HIGH',
    slaHours: 24
  },
  {
    name: 'Electricity',
    description: 'Electrical issues including power outages and street lights',
    priority: 'HIGH',
    slaHours: 48
  },
  {
    name: 'Road Repair',
    description: 'Road maintenance, potholes, and infrastructure issues',
    priority: 'MEDIUM',
    slaHours: 72
  },
  {
    name: 'Waste Management',
    description: 'Garbage collection and waste disposal issues',
    priority: 'MEDIUM',
    slaHours: 48
  },
  {
    name: 'Sewage',
    description: 'Sewage system problems and drainage issues',
    priority: 'HIGH',
    slaHours: 24
  },
  {
    name: 'Street Light',
    description: 'Street lighting maintenance and repairs',
    priority: 'MEDIUM',
    slaHours: 72
  },
  {
    name: 'Public Transport',
    description: 'Public transportation related complaints',
    priority: 'LOW',
    slaHours: 96
  },
  {
    name: 'Parks & Gardens',
    description: 'Maintenance of public parks and green spaces',
    priority: 'LOW',
    slaHours: 120
  },
  {
    name: 'Noise Pollution',
    description: 'Noise related complaints and disturbances',
    priority: 'MEDIUM',
    slaHours: 48
  },
  {
    name: 'Stray Animals',
    description: 'Issues with stray animals and animal control',
    priority: 'MEDIUM',
    slaHours: 72
  }
];

async function seedComplaintTypes() {
  console.log('🌱 Seeding ComplaintType table...');
  
  try {
    // Test database connection
    console.log('Testing database connection...');
    const testCount = await prisma.complaintType.count();
    console.log(`Found ${testCount} existing ComplaintType entries`);
    
  } catch (connectionError) {
    console.error('❌ Database connection failed:', connectionError.message);
    throw connectionError;
  }
  
  try {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const complaintType of defaultComplaintTypes) {
      const existing = await prisma.complaintType.findUnique({
        where: { name: complaintType.name }
      });
      
      if (existing) {
        if (existing.description !== complaintType.description || 
            existing.priority !== complaintType.priority ||
            existing.slaHours !== complaintType.slaHours) {
          await prisma.complaintType.update({
            where: { name: complaintType.name },
            data: {
              description: complaintType.description,
              priority: complaintType.priority,
              slaHours: complaintType.slaHours,
              isActive: true
            }
          });
          updated++;
          console.log(`✅ Updated: ${complaintType.name} (${complaintType.slaHours}h SLA)`);
        } else {
          skipped++;
          console.log(`⏭️  Skipped: ${complaintType.name} (no changes)`);
        }
      } else {
        await prisma.complaintType.create({
          data: complaintType
        });
        created++;
        console.log(`🆕 Created: ${complaintType.name} (${complaintType.slaHours}h SLA)`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total:   ${defaultComplaintTypes.length}`);
    
    console.log('\n✅ ComplaintType seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding ComplaintType:', error);
    logger.error('ComplaintType seeding failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📋 Script execution detected, starting seeding...');
  seedComplaintTypes()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedComplaintTypes };
export default seedComplaintTypes;