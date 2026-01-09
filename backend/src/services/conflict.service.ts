import prisma from '../utils/prisma';

// ============ TYPES ============

export enum ConflictType {
  OVERLAPPING_SHIFT = 'OVERLAPPING_SHIFT',
  OUTSIDE_AVAILABILITY = 'OUTSIDE_AVAILABILITY',
  WEEKLY_HOURS_EXCEEDED = 'WEEKLY_HOURS_EXCEEDED',
}

export enum ConflictSeverity {
  ERROR = 'error',     // Blocks creation unless overridden
  WARNING = 'warning', // Allows creation but warns user
}

export interface Conflict {
  type: ConflictType;
  severity: ConflictSeverity;
  message: string;
  details: Record<string, unknown>;
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: Conflict[];
  canOverride: boolean;
  suggestions?: TimeSuggestion[];
}

export interface TimeSuggestion {
  startTime: Date;
  endTime: Date;
  reason: string;
}

export interface ShiftInput {
  employeeId: string;
  startTime: Date;
  endTime: Date;
  shiftId?: string; // For updates - exclude this shift from overlap check
}

// ============ HELPER FUNCTIONS ============

function getWeekBounds(date: Date): { weekStart: Date; weekEnd: Date } {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

function calculateShiftHours(startTime: Date, endTime: Date): number {
  return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
}

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function dateToMinutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

// ============ CONFLICT CHECKS ============

/**
 * Check if employee has overlapping shifts
 */
export async function checkOverlappingShifts(
  input: ShiftInput,
  organizationId: string
): Promise<Conflict | null> {
  const { employeeId, startTime, endTime, shiftId } = input;

  const overlappingShift = await prisma.shift.findFirst({
    where: {
      employeeId,
      organizationId,
      status: { not: 'CANCELLED' },
      id: shiftId ? { not: shiftId } : undefined,
      OR: [
        // New shift starts during existing shift
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        // New shift ends during existing shift
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        // New shift completely contains existing shift
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
    include: {
      department: true,
    },
  });

  if (overlappingShift) {
    return {
      type: ConflictType.OVERLAPPING_SHIFT,
      severity: ConflictSeverity.ERROR,
      message: `Працівник вже має зміну з ${overlappingShift.startTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })} до ${overlappingShift.endTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`,
      details: {
        conflictingShiftId: overlappingShift.id,
        conflictingStartTime: overlappingShift.startTime,
        conflictingEndTime: overlappingShift.endTime,
        department: overlappingShift.department?.name,
      },
    };
  }

  return null;
}

/**
 * Check if shift falls within employee's availability
 */
export async function checkAvailability(
  input: ShiftInput
): Promise<Conflict | null> {
  const { employeeId, startTime, endTime } = input;

  const dayOfWeek = startTime.getDay();

  const availability = await prisma.employeeAvailability.findFirst({
    where: {
      employeeId,
      dayOfWeek,
    },
  });

  // If no availability set for this day, consider it unavailable
  if (!availability) {
    const dayNames = ['неділю', 'понеділок', 'вівторок', 'середу', 'четвер', "п'ятницю", 'суботу'];
    return {
      type: ConflictType.OUTSIDE_AVAILABILITY,
      severity: ConflictSeverity.WARNING,
      message: `Працівник не доступний у ${dayNames[dayOfWeek]}`,
      details: {
        dayOfWeek,
        availabilitySet: false,
      },
    };
  }

  const shiftStartMinutes = dateToMinutesOfDay(startTime);
  const shiftEndMinutes = dateToMinutesOfDay(endTime);
  const availStartMinutes = timeStringToMinutes(availability.startTime);
  const availEndMinutes = timeStringToMinutes(availability.endTime);

  // Check if shift is outside availability window
  if (shiftStartMinutes < availStartMinutes || shiftEndMinutes > availEndMinutes) {
    return {
      type: ConflictType.OUTSIDE_AVAILABILITY,
      severity: ConflictSeverity.WARNING,
      message: `Зміна виходить за межі доступності (${availability.startTime} - ${availability.endTime})`,
      details: {
        dayOfWeek,
        availabilityStart: availability.startTime,
        availabilityEnd: availability.endTime,
        shiftStart: startTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
        shiftEnd: endTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      },
    };
  }

  return null;
}

/**
 * Check if adding this shift would exceed weekly hours limit
 */
export async function checkWeeklyHoursLimit(
  input: ShiftInput
): Promise<Conflict | null> {
  const { employeeId, startTime, endTime, shiftId } = input;

  // Get employee with weekly hours limit
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee || !employee.weeklyHoursLimit) {
    return null; // No limit set
  }

  const { weekStart, weekEnd } = getWeekBounds(startTime);

  // Get all shifts for this employee in the same week
  const existingShifts = await prisma.shift.findMany({
    where: {
      employeeId,
      status: { not: 'CANCELLED' },
      id: shiftId ? { not: shiftId } : undefined,
      startTime: { gte: weekStart },
      endTime: { lte: weekEnd },
    },
  });

  // Calculate total hours
  const existingHours = existingShifts.reduce((sum: number, shift: { startTime: Date; endTime: Date }) => {
    return sum + calculateShiftHours(shift.startTime, shift.endTime);
  }, 0);

  const newShiftHours = calculateShiftHours(startTime, endTime);
  const totalHours = existingHours + newShiftHours;

  if (totalHours > employee.weeklyHoursLimit) {
    return {
      type: ConflictType.WEEKLY_HOURS_EXCEEDED,
      severity: ConflictSeverity.WARNING,
      message: `Перевищення ліміту годин: ${totalHours.toFixed(1)}/${employee.weeklyHoursLimit} год/тиждень`,
      details: {
        weeklyLimit: employee.weeklyHoursLimit,
        currentHours: existingHours,
        newShiftHours,
        totalHours,
        exceededBy: totalHours - employee.weeklyHoursLimit,
      },
    };
  }

  return null;
}

// ============ MAIN CHECK FUNCTION ============

/**
 * Run all conflict checks for a shift
 */
export async function checkShiftConflicts(
  input: ShiftInput,
  organizationId: string
): Promise<ConflictCheckResult> {
  const conflicts: Conflict[] = [];

  // Run all checks in parallel
  const [overlapConflict, availabilityConflict, hoursConflict] = await Promise.all([
    checkOverlappingShifts(input, organizationId),
    checkAvailability(input),
    checkWeeklyHoursLimit(input),
  ]);

  if (overlapConflict) conflicts.push(overlapConflict);
  if (availabilityConflict) conflicts.push(availabilityConflict);
  if (hoursConflict) conflicts.push(hoursConflict);

  const hasErrors = conflicts.some((c) => c.severity === ConflictSeverity.ERROR);

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    canOverride: !hasErrors, // Can override warnings, but not errors
  };
}

/**
 * Generate time suggestions when conflicts exist
 */
export async function suggestAlternativeTimes(
  input: ShiftInput,
  organizationId: string
): Promise<TimeSuggestion[]> {
  const { employeeId, startTime, endTime } = input;
  const shiftDuration = endTime.getTime() - startTime.getTime();
  const suggestions: TimeSuggestion[] = [];

  // Get availability for this day
  const dayOfWeek = startTime.getDay();
  const availability = await prisma.employeeAvailability.findFirst({
    where: { employeeId, dayOfWeek },
  });

  if (!availability) return suggestions;

  // Get existing shifts for this day
  const dayStart = new Date(startTime);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startTime);
  dayEnd.setHours(23, 59, 59, 999);

  const existingShifts = await prisma.shift.findMany({
    where: {
      employeeId,
      organizationId,
      status: { not: 'CANCELLED' },
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
    },
    orderBy: { startTime: 'asc' },
  });

  // Find gaps in the schedule within availability
  const [availStartHour, availStartMin] = availability.startTime.split(':').map(Number);
  const [availEndHour, availEndMin] = availability.endTime.split(':').map(Number);

  const availStart = new Date(startTime);
  availStart.setHours(availStartHour, availStartMin, 0, 0);
  const availEnd = new Date(startTime);
  availEnd.setHours(availEndHour, availEndMin, 0, 0);

  // Check start of availability
  if (existingShifts.length === 0) {
    const suggestedEnd = new Date(availStart.getTime() + shiftDuration);
    if (suggestedEnd <= availEnd) {
      suggestions.push({
        startTime: new Date(availStart),
        endTime: suggestedEnd,
        reason: 'Початок доступного часу',
      });
    }
  } else {
    // Check gap before first shift
    const firstShift = existingShifts[0];
    if (availStart.getTime() + shiftDuration <= firstShift.startTime.getTime()) {
      suggestions.push({
        startTime: new Date(availStart),
        endTime: new Date(availStart.getTime() + shiftDuration),
        reason: 'Перед першою зміною',
      });
    }

    // Check gaps between shifts
    for (let i = 0; i < existingShifts.length - 1; i++) {
      const currentEnd = existingShifts[i].endTime;
      const nextStart = existingShifts[i + 1].startTime;
      const gapDuration = nextStart.getTime() - currentEnd.getTime();

      if (gapDuration >= shiftDuration) {
        suggestions.push({
          startTime: new Date(currentEnd),
          endTime: new Date(currentEnd.getTime() + shiftDuration),
          reason: 'Між змінами',
        });
      }
    }

    // Check gap after last shift
    const lastShift = existingShifts[existingShifts.length - 1];
    if (lastShift.endTime.getTime() + shiftDuration <= availEnd.getTime()) {
      suggestions.push({
        startTime: new Date(lastShift.endTime),
        endTime: new Date(lastShift.endTime.getTime() + shiftDuration),
        reason: 'Після останньої зміни',
      });
    }
  }

  return suggestions.slice(0, 3); // Return max 3 suggestions
}
