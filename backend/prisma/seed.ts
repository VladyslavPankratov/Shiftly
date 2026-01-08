import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@shiftly.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }

  // Create organization with admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const organization = await prisma.organization.create({
    data: {
      name: 'Shiftly Demo',
      users: {
        create: {
          email: 'admin@shiftly.com',
          password: hashedPassword,
          name: 'Admin',
          role: 'ADMIN',
        },
      },
      departments: {
        create: [
          { name: 'Kitchen', color: '#EF4444' },
          { name: 'Service', color: '#3B82F6' },
          { name: 'Bar', color: '#8B5CF6' },
        ],
      },
    },
    include: {
      users: true,
      departments: true,
    },
  });

  // Create sample employees
  const departments = organization.departments;
  
  await prisma.employee.createMany({
    data: [
      {
        name: 'John Smith',
        email: 'john@example.com',
        position: 'Chef',
        color: '#EF4444',
        organizationId: organization.id,
        departmentId: departments.find(d => d.name === 'Kitchen')?.id,
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        position: 'Waiter',
        color: '#3B82F6',
        organizationId: organization.id,
        departmentId: departments.find(d => d.name === 'Service')?.id,
      },
      {
        name: 'Mike Brown',
        email: 'mike@example.com',
        position: 'Bartender',
        color: '#8B5CF6',
        organizationId: organization.id,
        departmentId: departments.find(d => d.name === 'Bar')?.id,
      },
    ],
  });

  console.log('✅ Seed completed!');
  console.log('');
  console.log('📧 Admin credentials:');
  console.log('   Email: admin@shiftly.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
