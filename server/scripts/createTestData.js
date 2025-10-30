/**
 * Create Test Data Script
 * 
 * Creates test complaint types and complaints for testing the dashboard
 * 
 * Usage: node server/scripts/createTestData.js
 */

import { loadEnvironmentConfig } from "../config/environment.js";
import { getPrisma } from "../db/connection.js";

// Load environment configuration
loadEnvironmentConfig();

console.log('🚀 Creating test data...');

const prisma = getPrisma();

async function createTestData() {
  try {
    console.log('📊 Checking existing data...');
    
    // Check if we have complaint types
    const existingTypes = await prisma.complaintType.count();
    console.log(`Found ${existingTypes} existing complaint types`);
    
    // Create complaint types if none exist
    if (existingTypes === 0) {
      console.log('🆕 Creating complaint types...');
      
      const complaintTypes = [
        { name: 'Water Supply', description: 'Water related issues', priority: 'HIGH', slaHours: 24 },
        { name: 'Electricity', description: 'Electrical issues', priority: 'HIGH', slaHours: 48 },
        { name: 'Road Repair', description: 'Road maintenance', priority: 'MEDIUM', slaHours: 72 },
        { name: 'Waste Management', description: 'Garbage collection', priority: 'MEDIUM', slaHours: 48 },
        { name: 'Street Light', description: 'Street lighting', priority: 'MEDIUM', slaHours: 72 }
      ];
      
      for (const type of complaintTypes) {
        await prisma.complaintType.create({ data: type });
        console.log(`✅ Created: ${type.name}`);
      }
    }
    
    // Check if we have complaints
    const existingComplaints = await prisma.complaint.count();
    console.log(`Found ${existingComplaints} existing complaints`);
    
    // Create some test complaints if we have less than 10
    if (existingComplaints < 10) {
      console.log('🆕 Creating test complaints...');
      
      // Get available complaint types and wards
      const types = await prisma.complaintType.findMany({ where: { isActive: true } });
      const wards = await prisma.ward.findMany({ where: { isActive: true } });
      
      if (types.length === 0) {
        console.log('❌ No complaint types found, cannot create complaints');
        return;
      }
      
      if (wards.length === 0) {
        console.log('❌ No wards found, cannot create complaints');
        return;
      }
      
      // Create test complaints
      const testComplaints = [
        { description: 'Water supply issue in area', type: 'WATER_SUPPLY', complaintTypeId: types[0]?.id },
        { description: 'Street light not working', type: 'STREET_LIGHT', complaintTypeId: types.find(t => t.name === 'Street Light')?.id },
        { description: 'Road has potholes', type: 'ROAD_REPAIR', complaintTypeId: types.find(t => t.name === 'Road Repair')?.id },
        { description: 'Garbage not collected', type: 'WASTE_MANAGEMENT', complaintTypeId: types.find(t => t.name === 'Waste Management')?.id },
        { description: 'Power outage in locality', type: 'ELECTRICITY', complaintTypeId: types.find(t => t.name === 'Electricity')?.id }
      ];
      
      for (let i = 0; i < testComplaints.length; i++) {
        const complaint = testComplaints[i];
        const ward = wards[i % wards.length];
        
        await prisma.complaint.create({
          data: {
            description: complaint.description,
            type: complaint.type,
            complaintTypeId: complaint.complaintTypeId,
            wardId: ward.id,
            area: 'Test Area',
            contactPhone: '+919999999999',
            status: 'REGISTERED',
            priority: 'MEDIUM'
          }
        });
        console.log(`✅ Created complaint: ${complaint.description}`);
      }
    }
    
    // Show final counts
    const finalTypes = await prisma.complaintType.count();
    const finalComplaints = await prisma.complaint.count();
    
    console.log(`\n📊 Final counts:`);
    console.log(`   Complaint Types: ${finalTypes}`);
    console.log(`   Complaints: ${finalComplaints}`);
    
    console.log('\n✅ Test data creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestData()
    .then(() => {
      console.log('🎉 Test data creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test data creation failed:', error);
      process.exit(1);
    });
}

export { createTestData };
export default createTestData;