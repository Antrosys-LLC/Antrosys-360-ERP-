import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Antrosys@2026';

interface SeedUser {
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  department: string;
}

const seedUsers: SeedUser[] = [
  { email: 'ceo@antrosys.com', role: 'CEO', firstName: 'Chief', lastName: 'Executive', department: 'Executive' },
  { email: 'cfo@antrosys.com', role: 'CFO', firstName: 'Chief', lastName: 'Financial', department: 'Finance' },
  { email: 'operations_head@antrosys.com', role: 'OPERATIONS_HEAD', firstName: 'Operations', lastName: 'Head', department: 'Operations' },
  { email: 'hr_head@antrosys.com', role: 'HR_HEAD', firstName: 'HR', lastName: 'Head', department: 'Human Resources' },
  { email: 'finance_manager@antrosys.com', role: 'FINANCE_MANAGER', firstName: 'Finance', lastName: 'Manager', department: 'Finance' },
  { email: 'project_manager@antrosys.com', role: 'PROJECT_MANAGER', firstName: 'Project', lastName: 'Manager', department: 'Projects' },
  { email: 'manager@antrosys.com', role: 'MANAGER', firstName: 'General', lastName: 'Manager', department: 'Operations' },
  { email: 'team_lead@antrosys.com', role: 'TEAM_LEAD', firstName: 'Team', lastName: 'Lead', department: 'Engineering' },
  { email: 'employee@antrosys.com', role: 'EMPLOYEE', firstName: 'Staff', lastName: 'Employee', department: 'General' },
];

async function main() {
  console.log('🌱 Starting seed...');

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  for (const seedUser of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {},
      create: {
        email: seedUser.email,
        passwordHash,
        role: seedUser.role,
        mfaEnabled: false,
        isActive: true,
      },
    });

    console.log(`✅ Created user: ${user.email} (${user.role})`);

    // Create Employee record for all users except EMPLOYEE role
    if (seedUser.role !== 'EMPLOYEE') {
      await prisma.employee.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          firstName: seedUser.firstName,
          lastName: seedUser.lastName,
          department: seedUser.department,
          joiningDate: new Date('2024-01-01'),
          isActive: true,
        },
      });
      console.log(`  📋 Created employee record for ${seedUser.email}`);
    }
  }

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
