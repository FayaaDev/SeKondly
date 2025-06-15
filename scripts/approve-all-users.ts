import { storage } from "../server/storage";

async function approveAllUsers() {
  try {
    console.log("Starting to approve all users...");
    
    // Get all unapproved users
    const allUsers = await storage.getAllUsers();
    const unapprovedUsers = allUsers.filter(user => !user.isApproved);
    
    console.log(`Found ${unapprovedUsers.length} unapproved users`);
    
    // Approve each user
    for (const user of unapprovedUsers) {
      console.log(`Approving user: ${user.email} (${user.firstName} ${user.lastName})`);
      await storage.approveUser(user.id, "auto-approval-script");
    }
    
    console.log("All users approved successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error approving users:", error);
    process.exit(1);
  }
}

approveAllUsers();
