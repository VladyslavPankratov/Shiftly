import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateDepartmentTenant } from '../utils/tenant';

export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { organizationId: req.user!.organizationId },
      include: {
        department: true,
        availability: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Помилка отримання працівників' });
  }
};

export const getEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
      },
      include: {
        department: true,
        availability: true,
        shifts: {
          orderBy: { startTime: 'desc' },
          take: 10,
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Працівника не знайдено' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Помилка отримання працівника' });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, position, departmentId, color, weeklyHoursLimit, availability } = req.body;

    // Validate that department belongs to the same organization
    if (departmentId) {
      const validation = await validateDepartmentTenant(departmentId, req.user!.organizationId);
      if (!validation.valid) {
        return res.status(403).json({ message: validation.error });
      }
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        position,
        departmentId,
        color: color || '#3B82F6',
        weeklyHoursLimit,
        organizationId: req.user!.organizationId,
        availability: availability ? {
          create: availability,
        } : undefined,
      },
      include: {
        department: true,
        availability: true,
      },
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Помилка створення працівника' });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, position, departmentId, color, weeklyHoursLimit, availability } = req.body;

    // Check if employee belongs to organization
    const existingEmployee = await prisma.employee.findFirst({
      where: { id, organizationId: req.user!.organizationId },
    });

    if (!existingEmployee) {
      return res.status(404).json({ message: 'Працівника не знайдено' });
    }

    // Validate that department belongs to the same organization
    if (departmentId) {
      const validation = await validateDepartmentTenant(departmentId, req.user!.organizationId);
      if (!validation.valid) {
        return res.status(403).json({ message: validation.error });
      }
    }

    // Update availability if provided
    if (availability) {
      await prisma.employeeAvailability.deleteMany({
        where: { employeeId: id },
      });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        position,
        departmentId,
        color,
        weeklyHoursLimit,
        availability: availability ? {
          create: availability,
        } : undefined,
      },
      include: {
        department: true,
        availability: true,
      },
    });

    res.json(employee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Помилка оновлення працівника' });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findFirst({
      where: { id, organizationId: req.user!.organizationId },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Працівника не знайдено' });
    }

    await prisma.employee.delete({ where: { id } });

    res.json({ message: 'Працівника видалено' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Помилка видалення працівника' });
  }
};
