import prisma from "./src/config/prisma.js";

async function test() {
  try {
    const users = await prisma.user.findMany();
    console.log("Users:", users);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
