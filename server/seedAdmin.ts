
import { storage } from "./storage";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedAdmin() {
  try {
    console.log("🌱 Starting admin seeding process...");

    // Hash the admin password
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await hashPassword(adminPassword);

    // Admin user data
    const adminData = {
      id: "admin_seed_001",
      username: "admin",
      firstName: "System",
      lastName: "Administrator",
      email: "admin@betchat.com",
      password: hashedPassword,
      isAdmin: true,
      level: 10,
      points: 10000,
      balance: "100000.00",
      streak: 30,
      referralCode: "ADMIN001",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists:", existingAdmin[0].username);
      
      // Update existing admin to ensure it has admin privileges and password
      await db
        .update(users)
        .set({ 
          isAdmin: true, 
          password: hashedPassword,
          updatedAt: new Date(),
          status: "active"
        })
        .where(eq(users.id, existingAdmin[0].id));
      
      console.log("✅ Admin privileges and password updated for existing user");
    } else {
      // Create new admin user
      await db.insert(users).values(adminData);
      console.log("✅ New admin user created:", adminData.username);
    }

    // Create a secondary admin for backup
    const backupAdminData = {
      id: "admin_seed_002",
      username: "superadmin",
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@betchat.com",
      password: hashedPassword,
      isAdmin: true,
      level: 10,
      points: 10000,
      balance: "100000.00",
      streak: 30,
      referralCode: "SUPER001",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existingBackupAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "superadmin"))
      .limit(1);

    if (existingBackupAdmin.length === 0) {
      await db.insert(users).values(backupAdminData);
      console.log("✅ Backup admin user created:", backupAdminData.username);
    } else {
      // Update existing backup admin with proper password
      await db
        .update(users)
        .set({ 
          isAdmin: true, 
          password: hashedPassword,
          updatedAt: new Date(),
          status: "active"
        })
        .where(eq(users.id, existingBackupAdmin[0].id));
      
      console.log("✅ Backup admin user already exists and password updated:", existingBackupAdmin[0].username);
    }

    console.log("\n🎉 Admin seeding completed successfully!");
    console.log("\n📋 Admin Login Credentials:");
    console.log("Username: admin");
    console.log("Password: admin123 (or use ADMIN_PASSWORD env var)");
    console.log("\nBackup Admin:");
    console.log("Username: superadmin");
    console.log("Password: admin123 (or use ADMIN_PASSWORD env var)");
    console.log("\n🌐 Admin Login URL: /admin/login");

  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    throw error;
  }
}

// Export the function for use as a module
export default seedAdmin;

// Run seeding if called directly (ESM module)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin()
    .then(() => {
      console.log("Admin seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Admin seeding failed:", error);
      process.exit(1);
    });
}

export { seedAdmin };
