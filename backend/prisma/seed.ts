import { PrismaClient, Role, ShiftStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to get dates relative to today
function getDate(daysOffset: number, hours: number = 0, minutes: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// Helper to get day of week (0-6) for a given offset from today
function getDayOfWeek(daysOffset: number): number {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.getDay();
}

async function main() {
  console.log('Starting database seed...');

  // Check if data already exists
  const existingOrg = await prisma.organization.findFirst();
  if (existingOrg) {
    console.log('Database already contains data. Clearing existing data...');
    // Clear in correct order to respect foreign keys
    await prisma.shift.deleteMany();
    await prisma.shiftTemplate.deleteMany();
    await prisma.employeeAvailability.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.department.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    console.log('Existing data cleared.');
  }

  // Hash passwords once
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  // ===================
  // CREATE ORGANIZATION
  // ===================
  const organization = await prisma.organization.create({
    data: {
      name: 'Shiftly Demo Company',
    },
  });
  console.log(`Created organization: ${organization.name}`);

  // ==================
  // CREATE DEPARTMENTS
  // ==================
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Sales',
        color: '#3B82F6', // Blue
        organizationId: organization.id,
      },
    }),
    prisma.department.create({
      data: {
        name: 'IT',
        color: '#10B981', // Green
        organizationId: organization.id,
      },
    }),
    prisma.department.create({
      data: {
        name: 'Customer Service',
        color: '#F59E0B', // Amber
        organizationId: organization.id,
      },
    }),
    prisma.department.create({
      data: {
        name: 'Operations',
        color: '#EF4444', // Red
        organizationId: organization.id,
      },
    }),
    prisma.department.create({
      data: {
        name: 'Marketing',
        color: '#8B5CF6', // Purple
        organizationId: organization.id,
      },
    }),
  ]);

  const [salesDept, itDept, csDept, opsDept, marketingDept] = departments;
  console.log(`Created ${departments.length} departments`);

  // ============
  // CREATE USERS
  // ============
  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        email: 'admin@shiftly.com',
        password: adminPassword,
        name: 'Alex Admin',
        role: Role.ADMIN,
        organizationId: organization.id,
      },
    }),
    // Manager users
    prisma.user.create({
      data: {
        email: 'manager.sales@shiftly.com',
        password: managerPassword,
        name: 'Sam Manager',
        role: Role.MANAGER,
        organizationId: organization.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager.ops@shiftly.com',
        password: managerPassword,
        name: 'Morgan Manager',
        role: Role.MANAGER,
        organizationId: organization.id,
      },
    }),
    // Employee users
    prisma.user.create({
      data: {
        email: 'employee1@shiftly.com',
        password: employeePassword,
        name: 'Emma Employee',
        role: Role.EMPLOYEE,
        organizationId: organization.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'employee2@shiftly.com',
        password: employeePassword,
        name: 'Ethan Employee',
        role: Role.EMPLOYEE,
        organizationId: organization.id,
      },
    }),
  ]);
  console.log(`Created ${users.length} users`);

  // ================
  // CREATE EMPLOYEES
  // ================
  const employeeData = [
    // Sales Department
    { name: 'John Smith', email: 'john.smith@example.com', phone: '+1-555-0101', position: 'Sales Representative', color: '#3B82F6', weeklyHoursLimit: 40, departmentId: salesDept.id },
    { name: 'Sarah Johnson', email: 'sarah.johnson@example.com', phone: '+1-555-0102', position: 'Sales Representative', color: '#60A5FA', weeklyHoursLimit: 40, departmentId: salesDept.id },
    { name: 'Michael Chen', email: 'michael.chen@example.com', phone: '+1-555-0103', position: 'Senior Sales Rep', color: '#2563EB', weeklyHoursLimit: 45, departmentId: salesDept.id },

    // IT Department
    { name: 'Emily Davis', email: 'emily.davis@example.com', phone: '+1-555-0201', position: 'Software Developer', color: '#10B981', weeklyHoursLimit: 40, departmentId: itDept.id },
    { name: 'David Wilson', email: 'david.wilson@example.com', phone: '+1-555-0202', position: 'System Administrator', color: '#34D399', weeklyHoursLimit: 40, departmentId: itDept.id },
    { name: 'Lisa Anderson', email: 'lisa.anderson@example.com', phone: '+1-555-0203', position: 'IT Support', color: '#059669', weeklyHoursLimit: 35, departmentId: itDept.id },

    // Customer Service
    { name: 'James Brown', email: 'james.brown@example.com', phone: '+1-555-0301', position: 'CS Representative', color: '#F59E0B', weeklyHoursLimit: 40, departmentId: csDept.id },
    { name: 'Jennifer Martinez', email: 'jennifer.martinez@example.com', phone: '+1-555-0302', position: 'CS Representative', color: '#FBBF24', weeklyHoursLimit: 30, departmentId: csDept.id },
    { name: 'Robert Taylor', email: 'robert.taylor@example.com', phone: '+1-555-0303', position: 'CS Team Lead', color: '#D97706', weeklyHoursLimit: 45, departmentId: csDept.id },
    { name: 'Amanda White', email: 'amanda.white@example.com', phone: '+1-555-0304', position: 'CS Representative', color: '#F59E0B', weeklyHoursLimit: 25, departmentId: csDept.id },

    // Operations
    { name: 'Christopher Lee', email: 'chris.lee@example.com', phone: '+1-555-0401', position: 'Operations Coordinator', color: '#EF4444', weeklyHoursLimit: 40, departmentId: opsDept.id },
    { name: 'Michelle Garcia', email: 'michelle.garcia@example.com', phone: '+1-555-0402', position: 'Logistics Specialist', color: '#F87171', weeklyHoursLimit: 40, departmentId: opsDept.id },
    { name: 'Daniel Harris', email: 'daniel.harris@example.com', phone: '+1-555-0403', position: 'Warehouse Associate', color: '#DC2626', weeklyHoursLimit: 35, departmentId: opsDept.id },

    // Marketing
    { name: 'Nicole Thompson', email: 'nicole.thompson@example.com', phone: '+1-555-0501', position: 'Marketing Specialist', color: '#8B5CF6', weeklyHoursLimit: 40, departmentId: marketingDept.id },
    { name: 'Kevin Robinson', email: 'kevin.robinson@example.com', phone: '+1-555-0502', position: 'Content Creator', color: '#A78BFA', weeklyHoursLimit: 35, departmentId: marketingDept.id },
  ];

  const employees = await Promise.all(
    employeeData.map((emp) =>
      prisma.employee.create({
        data: {
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          position: emp.position,
          color: emp.color,
          weeklyHoursLimit: emp.weeklyHoursLimit,
          organizationId: organization.id,
          departmentId: emp.departmentId,
        },
      })
    )
  );
  console.log(`Created ${employees.length} employees`);

  // ===========================
  // CREATE EMPLOYEE AVAILABILITY
  // ===========================
  const availabilityData: { employeeId: string; dayOfWeek: number; startTime: string; endTime: string }[] = [];

  // Full-time employees (40 hours) - available Mon-Fri 8am-6pm
  const fullTimeEmployees = employees.filter((e) => {
    const data = employeeData.find((d) => d.email === e.email);
    return data && data.weeklyHoursLimit && data.weeklyHoursLimit >= 40;
  });

  for (const emp of fullTimeEmployees) {
    for (let day = 1; day <= 5; day++) { // Monday to Friday
      availabilityData.push({
        employeeId: emp.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '18:00',
      });
    }
  }

  // Part-time employees - various availability
  const partTimeEmployees = employees.filter((e) => {
    const data = employeeData.find((d) => d.email === e.email);
    return data && data.weeklyHoursLimit && data.weeklyHoursLimit < 40;
  });

  for (let i = 0; i < partTimeEmployees.length; i++) {
    const emp = partTimeEmployees[i];
    // Alternate between morning and afternoon availability
    const isEvenIndex = i % 2 === 0;

    // Available 3-4 days per week
    const availableDays = isEvenIndex ? [1, 2, 3, 4] : [2, 3, 4, 5];
    const startTime = isEvenIndex ? '08:00' : '12:00';
    const endTime = isEvenIndex ? '14:00' : '20:00';

    for (const day of availableDays) {
      availabilityData.push({
        employeeId: emp.id,
        dayOfWeek: day,
        startTime,
        endTime,
      });
    }
  }

  await prisma.employeeAvailability.createMany({
    data: availabilityData,
  });
  console.log(`Created ${availabilityData.length} availability records`);

  // =======================
  // CREATE SHIFT TEMPLATES
  // =======================
  const templateData = [
    // Sales - weekday shifts
    { name: 'Sales Morning Shift', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', position: 'Sales Representative', requiredEmployees: 2, departmentId: salesDept.id },
    { name: 'Sales Morning Shift', dayOfWeek: 2, startTime: '09:00', endTime: '17:00', position: 'Sales Representative', requiredEmployees: 2, departmentId: salesDept.id },
    { name: 'Sales Morning Shift', dayOfWeek: 3, startTime: '09:00', endTime: '17:00', position: 'Sales Representative', requiredEmployees: 2, departmentId: salesDept.id },
    { name: 'Sales Morning Shift', dayOfWeek: 4, startTime: '09:00', endTime: '17:00', position: 'Sales Representative', requiredEmployees: 2, departmentId: salesDept.id },
    { name: 'Sales Morning Shift', dayOfWeek: 5, startTime: '09:00', endTime: '17:00', position: 'Sales Representative', requiredEmployees: 2, departmentId: salesDept.id },

    // IT - 24/7 coverage
    { name: 'IT Day Shift', dayOfWeek: 1, startTime: '08:00', endTime: '16:00', position: 'IT Support', requiredEmployees: 1, departmentId: itDept.id },
    { name: 'IT Evening Shift', dayOfWeek: 1, startTime: '16:00', endTime: '00:00', position: 'IT Support', requiredEmployees: 1, departmentId: itDept.id },

    // Customer Service - extended hours
    { name: 'CS Morning Shift', dayOfWeek: 1, startTime: '08:00', endTime: '14:00', position: 'CS Representative', requiredEmployees: 2, departmentId: csDept.id },
    { name: 'CS Afternoon Shift', dayOfWeek: 1, startTime: '14:00', endTime: '20:00', position: 'CS Representative', requiredEmployees: 2, departmentId: csDept.id },
    { name: 'CS Morning Shift', dayOfWeek: 2, startTime: '08:00', endTime: '14:00', position: 'CS Representative', requiredEmployees: 2, departmentId: csDept.id },
    { name: 'CS Afternoon Shift', dayOfWeek: 2, startTime: '14:00', endTime: '20:00', position: 'CS Representative', requiredEmployees: 2, departmentId: csDept.id },

    // Operations - warehouse hours
    { name: 'Ops Morning Shift', dayOfWeek: 1, startTime: '06:00', endTime: '14:00', position: 'Warehouse Associate', requiredEmployees: 2, departmentId: opsDept.id },
    { name: 'Ops Afternoon Shift', dayOfWeek: 1, startTime: '14:00', endTime: '22:00', position: 'Warehouse Associate', requiredEmployees: 1, departmentId: opsDept.id },

    // Marketing - standard hours
    { name: 'Marketing Shift', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', position: 'Marketing Specialist', requiredEmployees: 1, departmentId: marketingDept.id },
    { name: 'Marketing Shift', dayOfWeek: 2, startTime: '09:00', endTime: '17:00', position: 'Marketing Specialist', requiredEmployees: 1, departmentId: marketingDept.id },
    { name: 'Marketing Shift', dayOfWeek: 3, startTime: '09:00', endTime: '17:00', position: 'Marketing Specialist', requiredEmployees: 1, departmentId: marketingDept.id },
    { name: 'Marketing Shift', dayOfWeek: 4, startTime: '09:00', endTime: '17:00', position: 'Marketing Specialist', requiredEmployees: 1, departmentId: marketingDept.id },
    { name: 'Marketing Shift', dayOfWeek: 5, startTime: '09:00', endTime: '17:00', position: 'Marketing Specialist', requiredEmployees: 1, departmentId: marketingDept.id },
  ];

  await prisma.shiftTemplate.createMany({
    data: templateData.map((t) => ({
      ...t,
      organizationId: organization.id,
    })),
  });
  console.log(`Created ${templateData.length} shift templates`);

  // ==============
  // CREATE SHIFTS
  // ==============
  const shiftData: {
    employeeId: string;
    startTime: Date;
    endTime: Date;
    position: string;
    notes: string | null;
    status: ShiftStatus;
    departmentId: string;
  }[] = [];

  // Get employees by department for easier assignment
  const salesEmployees = employees.filter((e) => employeeData.find((d) => d.email === e.email)?.departmentId === salesDept.id);
  const itEmployees = employees.filter((e) => employeeData.find((d) => d.email === e.email)?.departmentId === itDept.id);
  const csEmployees = employees.filter((e) => employeeData.find((d) => d.email === e.email)?.departmentId === csDept.id);
  const opsEmployees = employees.filter((e) => employeeData.find((d) => d.email === e.email)?.departmentId === opsDept.id);
  const marketingEmployees = employees.filter((e) => employeeData.find((d) => d.email === e.email)?.departmentId === marketingDept.id);

  // Past shifts (completed) - last 7 days
  for (let dayOffset = -7; dayOffset < 0; dayOffset++) {
    const dayOfWeek = getDayOfWeek(dayOffset);

    // Skip weekends for most departments
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Sales shifts
      shiftData.push({
        employeeId: salesEmployees[0].id,
        startTime: getDate(dayOffset, 9, 0),
        endTime: getDate(dayOffset, 17, 0),
        position: 'Sales Representative',
        notes: null,
        status: ShiftStatus.COMPLETED,
        departmentId: salesDept.id,
      });
      shiftData.push({
        employeeId: salesEmployees[1].id,
        startTime: getDate(dayOffset, 9, 0),
        endTime: getDate(dayOffset, 17, 0),
        position: 'Sales Representative',
        notes: null,
        status: ShiftStatus.COMPLETED,
        departmentId: salesDept.id,
      });

      // IT shifts
      shiftData.push({
        employeeId: itEmployees[dayOffset % itEmployees.length < 0 ? itEmployees.length + (dayOffset % itEmployees.length) : dayOffset % itEmployees.length].id,
        startTime: getDate(dayOffset, 8, 0),
        endTime: getDate(dayOffset, 16, 0),
        position: 'IT Support',
        notes: null,
        status: ShiftStatus.COMPLETED,
        departmentId: itDept.id,
      });

      // CS shifts (morning)
      shiftData.push({
        employeeId: csEmployees[0].id,
        startTime: getDate(dayOffset, 8, 0),
        endTime: getDate(dayOffset, 14, 0),
        position: 'CS Representative',
        notes: null,
        status: ShiftStatus.COMPLETED,
        departmentId: csDept.id,
      });
      // CS shifts (afternoon)
      shiftData.push({
        employeeId: csEmployees[1].id,
        startTime: getDate(dayOffset, 14, 0),
        endTime: getDate(dayOffset, 20, 0),
        position: 'CS Representative',
        notes: null,
        status: ShiftStatus.COMPLETED,
        departmentId: csDept.id,
      });
    }
  }

  // Current day shifts (confirmed)
  const today = getDayOfWeek(0);
  if (today !== 0 && today !== 6) {
    shiftData.push({
      employeeId: salesEmployees[2].id,
      startTime: getDate(0, 9, 0),
      endTime: getDate(0, 17, 0),
      position: 'Senior Sales Rep',
      notes: 'Covering for team meeting',
      status: ShiftStatus.CONFIRMED,
      departmentId: salesDept.id,
    });

    shiftData.push({
      employeeId: itEmployees[0].id,
      startTime: getDate(0, 8, 0),
      endTime: getDate(0, 16, 0),
      position: 'Software Developer',
      notes: 'Sprint planning day',
      status: ShiftStatus.CONFIRMED,
      departmentId: itDept.id,
    });

    shiftData.push({
      employeeId: csEmployees[2].id,
      startTime: getDate(0, 8, 0),
      endTime: getDate(0, 17, 0),
      position: 'CS Team Lead',
      notes: null,
      status: ShiftStatus.CONFIRMED,
      departmentId: csDept.id,
    });

    shiftData.push({
      employeeId: opsEmployees[0].id,
      startTime: getDate(0, 6, 0),
      endTime: getDate(0, 14, 0),
      position: 'Operations Coordinator',
      notes: 'Inventory check',
      status: ShiftStatus.CONFIRMED,
      departmentId: opsDept.id,
    });

    shiftData.push({
      employeeId: marketingEmployees[0].id,
      startTime: getDate(0, 9, 0),
      endTime: getDate(0, 17, 0),
      position: 'Marketing Specialist',
      notes: 'Campaign launch day',
      status: ShiftStatus.CONFIRMED,
      departmentId: marketingDept.id,
    });
  }

  // Future shifts (scheduled) - next 14 days
  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    const dayOfWeek = getDayOfWeek(dayOffset);

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Rotate employees through shifts
    const salesIndex = dayOffset % salesEmployees.length;
    const itIndex = dayOffset % itEmployees.length;
    const csIndex = dayOffset % csEmployees.length;
    const opsIndex = dayOffset % opsEmployees.length;
    const marketingIndex = dayOffset % marketingEmployees.length;

    // Sales shifts
    shiftData.push({
      employeeId: salesEmployees[salesIndex].id,
      startTime: getDate(dayOffset, 9, 0),
      endTime: getDate(dayOffset, 17, 0),
      position: 'Sales Representative',
      notes: null,
      status: ShiftStatus.SCHEDULED,
      departmentId: salesDept.id,
    });
    shiftData.push({
      employeeId: salesEmployees[(salesIndex + 1) % salesEmployees.length].id,
      startTime: getDate(dayOffset, 9, 0),
      endTime: getDate(dayOffset, 17, 0),
      position: 'Sales Representative',
      notes: null,
      status: ShiftStatus.SCHEDULED,
      departmentId: salesDept.id,
    });

    // IT shifts
    shiftData.push({
      employeeId: itEmployees[itIndex].id,
      startTime: getDate(dayOffset, 8, 0),
      endTime: getDate(dayOffset, 16, 0),
      position: 'IT Support',
      notes: null,
      status: ShiftStatus.SCHEDULED,
      departmentId: itDept.id,
    });

    // CS shifts
    shiftData.push({
      employeeId: csEmployees[csIndex].id,
      startTime: getDate(dayOffset, 8, 0),
      endTime: getDate(dayOffset, 14, 0),
      position: 'CS Representative',
      notes: null,
      status: ShiftStatus.SCHEDULED,
      departmentId: csDept.id,
    });
    shiftData.push({
      employeeId: csEmployees[(csIndex + 1) % csEmployees.length].id,
      startTime: getDate(dayOffset, 14, 0),
      endTime: getDate(dayOffset, 20, 0),
      position: 'CS Representative',
      notes: null,
      status: ShiftStatus.SCHEDULED,
      departmentId: csDept.id,
    });

    // Ops shifts
    shiftData.push({
      employeeId: opsEmployees[opsIndex].id,
      startTime: getDate(dayOffset, 6, 0),
      endTime: getDate(dayOffset, 14, 0),
      position: 'Warehouse Associate',
      notes: null,
      status: ShiftStatus.SCHEDULED,
      departmentId: opsDept.id,
    });

    // Marketing shifts
    shiftData.push({
      employeeId: marketingEmployees[marketingIndex].id,
      startTime: getDate(dayOffset, 9, 0),
      endTime: getDate(dayOffset, 17, 0),
      position: 'Marketing Specialist',
      notes: null,
      status: ShiftStatus.SCHEDULED,
      departmentId: marketingDept.id,
    });
  }

  // Add a few cancelled shifts for realism
  shiftData.push({
    employeeId: salesEmployees[0].id,
    startTime: getDate(3, 9, 0),
    endTime: getDate(3, 17, 0),
    position: 'Sales Representative',
    notes: 'Employee called in sick',
    status: ShiftStatus.CANCELLED,
    departmentId: salesDept.id,
  });

  shiftData.push({
    employeeId: csEmployees[3].id,
    startTime: getDate(5, 14, 0),
    endTime: getDate(5, 20, 0),
    position: 'CS Representative',
    notes: 'Personal emergency',
    status: ShiftStatus.CANCELLED,
    departmentId: csDept.id,
  });

  await prisma.shift.createMany({
    data: shiftData.map((s) => ({
      ...s,
      organizationId: organization.id,
    })),
  });
  console.log(`Created ${shiftData.length} shifts`);

  // ==============
  // SUMMARY
  // ==============
  console.log('\n========================================');
  console.log('Database seeding completed successfully!');
  console.log('========================================\n');
  console.log('Summary:');
  console.log(`  - 1 Organization: ${organization.name}`);
  console.log(`  - ${departments.length} Departments: Sales, IT, Customer Service, Operations, Marketing`);
  console.log(`  - ${users.length} Users (login accounts)`);
  console.log(`  - ${employees.length} Employees`);
  console.log(`  - ${availabilityData.length} Availability records`);
  console.log(`  - ${templateData.length} Shift templates`);
  console.log(`  - ${shiftData.length} Shifts (past, present, future)`);
  console.log('\n----------------------------------------');
  console.log('Login Credentials:');
  console.log('----------------------------------------');
  console.log('Admin:');
  console.log('  Email: admin@shiftly.com');
  console.log('  Password: admin123');
  console.log('\nManager:');
  console.log('  Email: manager.sales@shiftly.com');
  console.log('  Email: manager.ops@shiftly.com');
  console.log('  Password: manager123');
  console.log('\nEmployee:');
  console.log('  Email: employee1@shiftly.com');
  console.log('  Email: employee2@shiftly.com');
  console.log('  Password: employee123');
  console.log('----------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
