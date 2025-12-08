
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  if (prisma.request) {
    console.log("prisma.request exists");
  } else {
    console.error("prisma.request is undefined");
    process.exit(1);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
