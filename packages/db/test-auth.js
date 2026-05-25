const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

async function run() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  console.log("Testing auth for user:", user.email);

  // Use the login API to get tokens
  // wait, we don't have the password, we can just generate a token directly using jwtService!
}
run();
