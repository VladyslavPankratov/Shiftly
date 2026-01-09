import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateTenantResources } from '../utils/tenant';
import {
  checkShiftConflicts,
  suggestAlternativeTimes,
  ConflictSeverity,
} from '../services/conflict.service';

export const getShifts = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, employeeId, departmentId } = req.query;

    const where: any = {
      organizationId: req.user!.organizationId,
    };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        employee: true,
        department: true,
      },
      orderBy: { startTime: 'asc' },
    });

    res.json(shifts);
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ message: 'Помилка отримання змін' });
  }
};

export const createShift = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, startTime, endTime, position, departmentId, notes, status, overrideConflicts } = req.body;

    // Validate that employee and department belong to the same organization
    const validation = await validateTenantResources(req.user!.organizationId, {
      employeeId,
      departmentId,
    });

    if (!validation.valid) {
      return res.status(403).json({ message: validation.error });
    }

    const shiftStartTime = new Date(startTime);
    const shiftEndTime = new Date(endTime);

    // Check for conflicts
    const conflictResult = await checkShiftConflicts(
      { employeeId, startTime: shiftStartTime, endTime: shiftEndTime },
      req.user!.organizationId
    );

    if (conflictResult.hasConflicts) {
      const hasErrors = conflictResult.conflicts.some(
        (c) => c.severity === ConflictSeverity.ERROR
      );

      // Block if there are errors (overlapping shifts) that can't be overridden
      if (hasErrors) {
        const suggestions = await suggestAlternativeTimes(
          { employeeId, startTime: shiftStartTime, endTime: shiftEndTime },
          req.user!.organizationId
        );

        return res.status(409).json({
          message: 'Виявлено конфлікти при створенні зміни',
          ...conflictResult,
          suggestions,
        });
      }

      // Block warnings unless explicitly overridden
      if (!overrideConflicts) {
        const suggestions = await suggestAlternativeTimes(
          { employeeId, startTime: shiftStartTime, endTime: shiftEndTime },
          req.user!.organizationId
        );

        return res.status(409).json({
          message: 'Виявлено попередження при створенні зміни',
          ...conflictResult,
          suggestions,
        });
      }
    }

    const shift = await prisma.shift.create({
      data: {
        employeeId,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        position,
        departmentId,
        notes,
        status: status || 'SCHEDULED',
        organizationId: req.user!.organizationId,
      },
      include: {
        employee: true,
        department: true,
      },
    });

    res.status(201).json(shift);
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({ message: 'Помилка створення зміни' });
  }
};

export const updateShift = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { employeeId, startTime, endTime, position, departmentId, notes, status, overrideConflicts } = req.body;

    const existingShift = await prisma.shift.findFirst({
      where: { id, organizationId: req.user!.organizationId },
    });

    if (!existingShift) {
      return res.status(404).json({ message: 'Зміну не знайдено' });
    }

    // Validate that employee and department belong to the same organization
    const validation = await validateTenantResources(req.user!.organizationId, {
      employeeId,
      departmentId,
    });

    if (!validation.valid) {
      return res.status(403).json({ message: validation.error });
    }

    const shiftStartTime = startTime ? new Date(startTime) : existingShift.startTime;
    const shiftEndTime = endTime ? new Date(endTime) : existingShift.endTime;
    const shiftEmployeeId = employeeId || existingShift.employeeId;

    // Check for conflicts (exclude current shift from overlap check)
    const conflictResult = await checkShiftConflicts(
      { employeeId: shiftEmployeeId, startTime: shiftStartTime, endTime: shiftEndTime, shiftId: id },
      req.user!.organizationId
    );

    if (conflictResult.hasConflicts) {
      const hasErrors = conflictResult.conflicts.some(
        (c) => c.severity === ConflictSeverity.ERROR
      );

      // Block if there are errors (overlapping shifts) that can't be overridden
      if (hasErrors) {
        const suggestions = await suggestAlternativeTimes(
          { employeeId: shiftEmployeeId, startTime: shiftStartTime, endTime: shiftEndTime, shiftId: id },
          req.user!.organizationId
        );

        return res.status(409).json({
          message: 'Виявлено конфлікти при оновленні зміни',
          ...conflictResult,
          suggestions,
        });
      }

      // Block warnings unless explicitly overridden
      if (!overrideConflicts) {
        const suggestions = await suggestAlternativeTimes(
          { employeeId: shiftEmployeeId, startTime: shiftStartTime, endTime: shiftEndTime, shiftId: id },
          req.user!.organizationId
        );

        return res.status(409).json({
          message: 'Виявлено попередження при оновленні зміни',
          ...conflictResult,
          suggestions,
        });
      }
    }

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        employeeId,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        position,
        departmentId,
        notes,
        status,
      },
      include: {
        employee: true,
        department: true,
      },
    });

    res.json(shift);
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ message: 'Помилка оновлення зміни' });
  }
};

export const deleteShift = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const shift = await prisma.shift.findFirst({
      where: { id, organizationId: req.user!.organizationId },
    });

    if (!shift) {
      return res.status(404).json({ message: 'Зміну не знайдено' });
    }

    await prisma.shift.delete({ where: { id } });

    res.json({ message: 'Зміну видалено' });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ message: 'Помилка видалення зміни' });
  }
};

export const checkConflicts = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, startTime, endTime, shiftId } = req.body;

    if (!employeeId || !startTime || !endTime) {
      return res.status(400).json({ message: 'employeeId, startTime та endTime обов\'язкові' });
    }

    // Validate employee belongs to organization
    const validation = await validateTenantResources(req.user!.organizationId, {
      employeeId,
    });

    if (!validation.valid) {
      return res.status(403).json({ message: validation.error });
    }

    const shiftStartTime = new Date(startTime);
    const shiftEndTime = new Date(endTime);

    const conflictResult = await checkShiftConflicts(
      { employeeId, startTime: shiftStartTime, endTime: shiftEndTime, shiftId },
      req.user!.organizationId
    );

    let suggestions;
    if (conflictResult.hasConflicts) {
      suggestions = await suggestAlternativeTimes(
        { employeeId, startTime: shiftStartTime, endTime: shiftEndTime, shiftId },
        req.user!.organizationId
      );
    }

    res.json({
      ...conflictResult,
      suggestions,
    });
  } catch (error) {
    console.error('Check conflicts error:', error);
    res.status(500).json({ message: 'Помилка перевірки конфліктів' });
  }
};

export const autoScheduleShifts = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, templateIds } = req.body;

    // Get templates
    const templates = await prisma.shiftTemplate.findMany({
      where: {
        id: { in: templateIds },
        organizationId: req.user!.organizationId,
      },
    });

    // Get available employees
    const employees = await prisma.employee.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { availability: true },
    });

    const createdShifts = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Iterate through dates
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();

      // Find templates for this day
      const dayTemplates = templates.filter((t: { dayOfWeek: number }) => t.dayOfWeek === dayOfWeek);

      for (const template of dayTemplates) {
        // Find available employees for this template
        const availableEmployees = employees.filter((emp: { availability: { dayOfWeek: number }[] }) => {
          const availability = emp.availability.find((a: { dayOfWeek: number }) => a.dayOfWeek === dayOfWeek);
          return availability !== undefined;
        });

        // Assign employees (simple round-robin for now)
        const employeesToAssign = availableEmployees.slice(0, template.requiredEmployees);

        for (const employee of employeesToAssign) {
          const [startHour, startMinute] = template.startTime.split(':').map(Number);
          const [endHour, endMinute] = template.endTime.split(':').map(Number);

          const shiftStart = new Date(date);
          shiftStart.setHours(startHour, startMinute, 0, 0);

          const shiftEnd = new Date(date);
          shiftEnd.setHours(endHour, endMinute, 0, 0);

          const shift = await prisma.shift.create({
            data: {
              employeeId: employee.id,
              startTime: shiftStart,
              endTime: shiftEnd,
              position: template.position,
              departmentId: template.departmentId,
              status: 'SCHEDULED',
              organizationId: req.user!.organizationId,
            },
            include: {
              employee: true,
              department: true,
            },
          });

          createdShifts.push(shift);
        }
      }
    }

    res.status(201).json({
      message: `Створено ${createdShifts.length} змін`,
      shifts: createdShifts,
    });
  } catch (error) {
    console.error('Auto schedule error:', error);
    res.status(500).json({ message: 'Помилка автоматичного планування' });
  }
};
