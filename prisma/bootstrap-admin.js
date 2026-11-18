const { randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('The bootstrap admin command is only for a production deployment.');
  }

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password || password.length < 16) {
    throw new Error('Set ADMIN_BOOTSTRAP_EMAIL and a unique ADMIN_BOOTSTRAP_PASSWORD of at least 16 characters.');
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
    select: { id: true },
  });
  if (existingAdmin) {
    throw new Error('An active super administrator already exists; bootstrap is one-time only.');
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    throw new Error('That email is already in use. Choose an unused address for the first administrator.');
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = randomBytes(6);
  const anonymousId = `SINO-${Array.from(random, byte => chars[byte % chars.length]).join('')}`;

  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      anonymousId,
      profile: {
        create: {
          displayName: 'Администратор',
          themePreference: 'NIGHT',
          language: 'ru',
        },
      },
    },
  });

  console.log(`Created the first super administrator: ${email}`);
}

main()
  .catch((error) => {
    console.error('Admin bootstrap failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

