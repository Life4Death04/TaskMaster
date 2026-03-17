/**
 * Database Connection Test
 * Run this to verify your database connection is working
 */
/* 
import { prisma } from "./config/database.js";

async function testConnection() {
  try {
    console.log("🔍 Testing database connection...\n");

    // Attempt to connect to the database
    await prisma.$connect();
    console.log("✅ Database connection successful!");

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Test query executed successfully:", result);

    // Disconnect
    await prisma.$disconnect();
    console.log("✅ Database disconnected gracefully\n");

    console.log("🎉 All database tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
    console.error("\n📝 Make sure:");
    console.error("  1. MySQL is running");
    console.error("  2. DATABASE_URL in .env is correct");
    console.error('  3. Database "taskmaster_db" exists (or create it)');
    process.exit(1);
  }
}

testConnection();
 */