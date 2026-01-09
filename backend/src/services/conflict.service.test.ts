import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ConflictType,
  ConflictSeverity,
  checkOverlappingShifts,
  checkAvailability,
  checkWeeklyHoursLimit,
  checkShiftConflicts,
} from './conflict.service';

// Mock Prisma
vi.mock('../utils/prisma', () => ({
  default: {
    shift: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    employee: {
      findUnique: vi.fn(),
    },
    employeeAvailability: {
      findFirst: vi.fn(),
    },
  },
}));

import prisma from '../utils/prisma';

describe('ConflictService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkOverlappingShifts', () => {
    it('should return null when no overlapping shifts exist', async () => {
      vi.mocked(prisma.shift.findFirst).mockResolvedValue(null);

      const result = await checkOverlappingShifts(
        {
          employeeId: 'emp-1',
          startTime: new Date('2024-01-15T09:00:00'),
          endTime: new Date('2024-01-15T17:00:00'),
        },
        'org-1'
      );

      expect(result).toBeNull();
    });

    it('should return ERROR conflict when shift overlaps', async () => {
      vi.mocked(prisma.shift.findFirst).mockResolvedValue({
        id: 'shift-existing',
        startTime: new Date('2024-01-15T08:00:00'),
        endTime: new Date('2024-01-15T12:00:00'),
        department: { name: 'Sales' },
      } as any);

      const result = await checkOverlappingShifts(
        {
          employeeId: 'emp-1',
          startTime: new Date('2024-01-15T10:00:00'),
          endTime: new Date('2024-01-15T14:00:00'),
        },
        'org-1'
      );

      expect(result).not.toBeNull();
      expect(result!.type).toBe(ConflictType.OVERLAPPING_SHIFT);
      expect(result!.severity).toBe(ConflictSeverity.ERROR);
      expect(result!.details.conflictingShiftId).toBe('shift-existing');
    });

    it('should exclude current shift when updating', async () => {
      vi.mocked(prisma.shift.findFirst).mockResolvedValue(null);

      await checkOverlappingShifts(
        {
          employeeId: 'emp-1',
          startTime: new Date('2024-01-15T09:00:00'),
          endTime: new Date('2024-01-15T17:00:00'),
          shiftId: 'shift-current',
        },
        'org-1'
      );

      expect(prisma.shift.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'shift-current' },
          }),
        })
      );
    });
  });

  describe('checkAvailability', () => {
    it('should return null when shift is within availability', async () => {
      vi.mocked(prisma.employeeAvailability.findFirst).mockResolvedValue({
        id: 'avail-1',
        employeeId: 'emp-1',
        dayOfWeek: 1, // Monday
        startTime: '08:00',
        endTime: '18:00',
      } as any);

      const monday = new Date('2024-01-15T09:00:00'); // Monday
      const result = await checkAvailability({
        employeeId: 'emp-1',
        startTime: monday,
        endTime: new Date('2024-01-15T17:00:00'),
      });

      expect(result).toBeNull();
    });

    it('should return WARNING when no availability set for day', async () => {
      vi.mocked(prisma.employeeAvailability.findFirst).mockResolvedValue(null);

      const result = await checkAvailability({
        employeeId: 'emp-1',
        startTime: new Date('2024-01-15T09:00:00'),
        endTime: new Date('2024-01-15T17:00:00'),
      });

      expect(result).not.toBeNull();
      expect(result!.type).toBe(ConflictType.OUTSIDE_AVAILABILITY);
      expect(result!.severity).toBe(ConflictSeverity.WARNING);
      expect(result!.details.availabilitySet).toBe(false);
    });

    it('should return WARNING when shift is outside availability window', async () => {
      vi.mocked(prisma.employeeAvailability.findFirst).mockResolvedValue({
        id: 'avail-1',
        employeeId: 'emp-1',
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '16:00',
      } as any);

      const result = await checkAvailability({
        employeeId: 'emp-1',
        startTime: new Date('2024-01-15T08:00:00'), // Before availability starts
        endTime: new Date('2024-01-15T14:00:00'),
      });

      expect(result).not.toBeNull();
      expect(result!.type).toBe(ConflictType.OUTSIDE_AVAILABILITY);
      expect(result!.severity).toBe(ConflictSeverity.WARNING);
    });
  });

  describe('checkWeeklyHoursLimit', () => {
    it('should return null when no weekly limit set', async () => {
      vi.mocked(prisma.employee.findUnique).mockResolvedValue({
        id: 'emp-1',
        weeklyHoursLimit: null,
      } as any);

      const result = await checkWeeklyHoursLimit({
        employeeId: 'emp-1',
        startTime: new Date('2024-01-15T09:00:00'),
        endTime: new Date('2024-01-15T17:00:00'),
      });

      expect(result).toBeNull();
    });

    it('should return null when within limit', async () => {
      vi.mocked(prisma.employee.findUnique).mockResolvedValue({
        id: 'emp-1',
        weeklyHoursLimit: 40,
      } as any);

      vi.mocked(prisma.shift.findMany).mockResolvedValue([
        {
          startTime: new Date('2024-01-15T09:00:00'),
          endTime: new Date('2024-01-15T17:00:00'), // 8 hours
        },
      ] as any);

      const result = await checkWeeklyHoursLimit({
        employeeId: 'emp-1',
        startTime: new Date('2024-01-16T09:00:00'),
        endTime: new Date('2024-01-16T17:00:00'), // Another 8 hours = 16 total
      });

      expect(result).toBeNull();
    });

    it('should return WARNING when exceeding limit', async () => {
      vi.mocked(prisma.employee.findUnique).mockResolvedValue({
        id: 'emp-1',
        weeklyHoursLimit: 40,
      } as any);

      // Already worked 36 hours this week
      vi.mocked(prisma.shift.findMany).mockResolvedValue([
        {
          startTime: new Date('2024-01-15T06:00:00'),
          endTime: new Date('2024-01-15T18:00:00'), // 12 hours
        },
        {
          startTime: new Date('2024-01-16T06:00:00'),
          endTime: new Date('2024-01-16T18:00:00'), // 12 hours
        },
        {
          startTime: new Date('2024-01-17T06:00:00'),
          endTime: new Date('2024-01-17T18:00:00'), // 12 hours
        },
      ] as any);

      const result = await checkWeeklyHoursLimit({
        employeeId: 'emp-1',
        startTime: new Date('2024-01-18T09:00:00'),
        endTime: new Date('2024-01-18T17:00:00'), // 8 more = 44 total
      });

      expect(result).not.toBeNull();
      expect(result!.type).toBe(ConflictType.WEEKLY_HOURS_EXCEEDED);
      expect(result!.severity).toBe(ConflictSeverity.WARNING);
      expect(result!.details.totalHours).toBe(44);
      expect(result!.details.weeklyLimit).toBe(40);
    });
  });

  describe('checkShiftConflicts', () => {
    it('should run all checks in parallel and aggregate results', async () => {
      // No overlapping shift
      vi.mocked(prisma.shift.findFirst).mockResolvedValue(null);
      
      // No availability for this day
      vi.mocked(prisma.employeeAvailability.findFirst).mockResolvedValue(null);
      
      // No weekly limit
      vi.mocked(prisma.employee.findUnique).mockResolvedValue({
        id: 'emp-1',
        weeklyHoursLimit: null,
      } as any);

      const result = await checkShiftConflicts(
        {
          employeeId: 'emp-1',
          startTime: new Date('2024-01-15T09:00:00'),
          endTime: new Date('2024-01-15T17:00:00'),
        },
        'org-1'
      );

      expect(result.hasConflicts).toBe(true); // Has availability warning
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].type).toBe(ConflictType.OUTSIDE_AVAILABILITY);
      expect(result.canOverride).toBe(true); // Only warnings, no errors
    });

    it('should set canOverride to false when ERROR conflicts exist', async () => {
      // Overlapping shift exists
      vi.mocked(prisma.shift.findFirst).mockResolvedValue({
        id: 'shift-existing',
        startTime: new Date('2024-01-15T08:00:00'),
        endTime: new Date('2024-01-15T12:00:00'),
        department: null,
      } as any);
      
      vi.mocked(prisma.employeeAvailability.findFirst).mockResolvedValue({
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '18:00',
      } as any);
      
      vi.mocked(prisma.employee.findUnique).mockResolvedValue({
        weeklyHoursLimit: null,
      } as any);

      const result = await checkShiftConflicts(
        {
          employeeId: 'emp-1',
          startTime: new Date('2024-01-15T09:00:00'),
          endTime: new Date('2024-01-15T17:00:00'),
        },
        'org-1'
      );

      expect(result.hasConflicts).toBe(true);
      expect(result.canOverride).toBe(false); // Has ERROR (overlapping)
    });

    it('should return no conflicts when everything is valid', async () => {
      vi.mocked(prisma.shift.findFirst).mockResolvedValue(null);
      
      vi.mocked(prisma.employeeAvailability.findFirst).mockResolvedValue({
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '18:00',
      } as any);
      
      vi.mocked(prisma.employee.findUnique).mockResolvedValue({
        weeklyHoursLimit: 40,
      } as any);
      
      vi.mocked(prisma.shift.findMany).mockResolvedValue([]);

      const result = await checkShiftConflicts(
        {
          employeeId: 'emp-1',
          startTime: new Date('2024-01-15T09:00:00'),
          endTime: new Date('2024-01-15T17:00:00'),
        },
        'org-1'
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
      expect(result.canOverride).toBe(true);
    });
  });
});
