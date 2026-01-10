import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateTenantResources } from '../utils/tenant';

export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { departmentId } = req.query;

    const where: any = {
      organizationId: req.user!.organizationId,
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const templates = await prisma.shiftTemplate.findMany({
      where,
      include: {
        department: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Помилка отримання шаблонів' });
  }
};

export const getTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.shiftTemplate.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
      },
      include: {
        department: true,
      },
    });

    if (!template) {
      return res.status(404).json({ message: 'Шаблон не знайдено' });
    }

    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ message: 'Помилка отримання шаблону' });
  }
};

export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { name, dayOfWeek, startTime, endTime, position, departmentId, requiredEmployees } = req.body;

    // Validate required fields
    if (!name || dayOfWeek === undefined || !startTime || !endTime || !position) {
      return res.status(400).json({ 
        message: 'Назва, день тижня, час початку/закінчення та позиція обов\'язкові' 
      });
    }

    // Validate dayOfWeek (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ message: 'День тижня має бути від 0 (неділя) до 6 (субота)' });
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ message: 'Невірний формат часу. Використовуйте HH:mm' });
    }

    // Validate department belongs to organization
    if (departmentId) {
      const validation = await validateTenantResources(req.user!.organizationId, {
        departmentId,
      });

      if (!validation.valid) {
        return res.status(403).json({ message: validation.error });
      }
    }

    const template = await prisma.shiftTemplate.create({
      data: {
        name,
        dayOfWeek,
        startTime,
        endTime,
        position,
        departmentId: departmentId || null,
        requiredEmployees: requiredEmployees || 1,
        organizationId: req.user!.organizationId,
      },
      include: {
        department: true,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Помилка створення шаблону' });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, dayOfWeek, startTime, endTime, position, departmentId, requiredEmployees } = req.body;

    const existingTemplate = await prisma.shiftTemplate.findFirst({
      where: { id, organizationId: req.user!.organizationId },
    });

    if (!existingTemplate) {
      return res.status(404).json({ message: 'Шаблон не знайдено' });
    }

    // Validate dayOfWeek if provided
    if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 6)) {
      return res.status(400).json({ message: 'День тижня має бути від 0 (неділя) до 6 (субота)' });
    }

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return res.status(400).json({ message: 'Невірний формат часу початку. Використовуйте HH:mm' });
    }
    if (endTime && !timeRegex.test(endTime)) {
      return res.status(400).json({ message: 'Невірний формат часу закінчення. Використовуйте HH:mm' });
    }

    // Validate department belongs to organization
    if (departmentId) {
      const validation = await validateTenantResources(req.user!.organizationId, {
        departmentId,
      });

      if (!validation.valid) {
        return res.status(403).json({ message: validation.error });
      }
    }

    const template = await prisma.shiftTemplate.update({
      where: { id },
      data: {
        name,
        dayOfWeek,
        startTime,
        endTime,
        position,
        departmentId,
        requiredEmployees,
      },
      include: {
        department: true,
      },
    });

    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Помилка оновлення шаблону' });
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.shiftTemplate.findFirst({
      where: { id, organizationId: req.user!.organizationId },
    });

    if (!template) {
      return res.status(404).json({ message: 'Шаблон не знайдено' });
    }

    await prisma.shiftTemplate.delete({ where: { id } });

    res.json({ message: 'Шаблон видалено' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Помилка видалення шаблону' });
  }
};

export const applyTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { templateIds, startDate, endDate, preview } = req.body;

    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      return res.status(400).json({ message: 'Потрібно вибрати хоча б один шаблон' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Дата початку та закінчення обов\'язкові' });
    }

    // Get templates
    const templates = await prisma.shiftTemplate.findMany({
      where: {
        id: { in: templateIds },
        organizationId: req.user!.organizationId,
      },
      include: {
        department: true,
      },
    });

    if (templates.length === 0) {
      return res.status(404).json({ message: 'Шаблони не знайдено' });
    }

    const shiftsToCreate: any[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Iterate through dates
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();

      // Find templates for this day
      const dayTemplates = templates.filter(t => t.dayOfWeek === dayOfWeek);

      for (const template of dayTemplates) {
        const [startHour, startMinute] = template.startTime.split(':').map(Number);
        const [endHour, endMinute] = template.endTime.split(':').map(Number);

        const shiftStart = new Date(date);
        shiftStart.setHours(startHour, startMinute, 0, 0);

        const shiftEnd = new Date(date);
        shiftEnd.setHours(endHour, endMinute, 0, 0);

        // Handle overnight shifts
        if (shiftEnd <= shiftStart) {
          shiftEnd.setDate(shiftEnd.getDate() + 1);
        }

        for (let i = 0; i < template.requiredEmployees; i++) {
          shiftsToCreate.push({
            templateId: template.id,
            templateName: template.name,
            startTime: new Date(shiftStart),
            endTime: new Date(shiftEnd),
            position: template.position,
            departmentId: template.departmentId,
            departmentName: template.department?.name || null,
            dayOfWeek: template.dayOfWeek,
          });
        }
      }
    }

    // Return preview of shifts to be created
    // Actual shift creation requires employee assignment (via auto-schedule endpoint)
    res.json({
      preview: true,
      count: shiftsToCreate.length,
      shifts: shiftsToCreate,
      message: 'Використовуйте автоматичне планування для призначення працівників на ці зміни',
    });
  } catch (error) {
    console.error('Apply templates error:', error);
    res.status(500).json({ message: 'Помилка застосування шаблонів' });
  }
};
