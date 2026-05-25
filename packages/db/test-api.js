const { PrismaClient } = require('@prisma/client');
const { JwtService } = require('@nestjs/jwt');
const axios = require('axios');
const fs = require('fs');

async function run() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  const membership = await prisma.membership.findFirst({ where: { userId: user.id } });
  
  // Read secret from env
  const content = fs.readFileSync('/Users/processdrive/Downloads/Me/Project/brandflow/.env', 'utf8');
  const secretLine = content.split('\n').find(l => l.startsWith('JWT_SECRET='));
  const secret = secretLine.split('=')[1].trim();

  const jwtService = new JwtService({ secret });
  
  const token = jwtService.sign({
    sub: user.id,
    businessId: membership.businessId,
    email: user.email,
    roleId: membership.roleId,
  });

  console.log("Generated token:", token);

  try {
    const res = await axios.get('http://localhost:4000/api/v1/approvals/queue/count', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success! Data:", res.data);
  } catch (err) {
    console.log("Failed:", err.response?.data || err.message);
  }
}
run();
