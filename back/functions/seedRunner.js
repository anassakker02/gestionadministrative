const { seedFirestore } = require("./src/utils/seedData");

const runSeeder = async () => {
  try {
    console.log("Starting database seeding...");
    await seedFirestore();
    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during database seeding:", error);
    process.exit(1);
  }
};

runSeeder();
