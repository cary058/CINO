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
  const allowlist = new Set((process.env.STAFF_ACCESS_EMAILS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
  if (!email || !password || password.length < 16 || !allowlist.has(email)) {
    throw new Error('Set matching ADMIN_BOOTSTRAP_EMAIL and STAFF_ACCESS_EMAILS, plus a unique ADMIN_BOOTSTRAP_PASSWORD of at least 16 characters.');
  }

  const marker = await prisma.systemSetting.findUnique({ where: { key: 'SINGLE_STAFF_BOOTSTRAP_COMPLETE' } });
  if (marker) {
    console.log('The single staff account has already been bootstrapped; skipping.');
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = randomBytes(6);
  const anonymousId = existingUser?.anonymousId || `SINO-${Array.from(random, byte => chars[byte % chars.length]).join('')}`;

  // Revoke all seeded staff roles and grant the single configured account every role.
  await prisma.user.updateMany({
    where: { email: { not: email }, role: { in: ['VOLUNTEER', 'COORDINATOR', 'PROFESSIONAL', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] } },
    data: { role: 'USER' },
  });

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: await bcrypt.hash(password, 12),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
    },
    create: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      anonymousId,
    },
  });

  if (!existingUser?.profile) {
    await prisma.profile.upsert({
      where: { userId: admin.id },
      update: { displayName: 'Администратор' },
      create: { userId: admin.id, displayName: 'Администратор', themePreference: 'NIGHT', language: 'ru' },
    });
  }

  await prisma.session.deleteMany({ where: { userId: admin.id } });
  await prisma.systemSetting.create({
    data: { key: 'SINGLE_STAFF_BOOTSTRAP_COMPLETE', value: 'true', description: 'Одноразовая настройка единого служебного аккаунта' },
  });

  console.log(`Bootstrapped the single staff account: ${email}`);
}

main()
  .catch((error) => {
    console.error('Admin bootstrap failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

