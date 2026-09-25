import { PrismaClient } from "@prisma/client";
import { seedDemoData, DEMO_PASSWORD } from "../src/seed-data";

const prisma = new PrismaClient();

seedDemoData(prisma)
  .then(() => {
    console.log("");
    console.log("Demo credentials (development only):");
    console.log(`  Super Admin: admin@surveymasterai.dev / ${DEMO_PASSWORD}`);
    console.log(`  Org Admin:   sarah@acme-demo.com / ${DEMO_PASSWORD}`);
    console.log(`  Manager:     marcus@acme-demo.com / ${DEMO_PASSWORD}`);
    console.log(`  Respondent:  james@acme-demo.com / ${DEMO_PASSWORD}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
