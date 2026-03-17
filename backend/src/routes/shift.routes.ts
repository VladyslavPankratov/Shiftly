import { Router } from 'express';
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  autoScheduleShifts,
  checkConflicts,
} from '../controllers/shift.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/shifts:
 *   get:
 *     summary: Get shifts with optional filters
 *     description: |
 *       Retrieves shifts for the authenticated user's organization.
 *       Results can be filtered by date range, employee, and department.
 *       Returns shifts ordered by start time ascending.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter shifts starting from this date (inclusive)
 *         example: '2024-01-15T00:00:00.000Z'
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter shifts up to this date (inclusive)
 *         example: '2024-01-21T23:59:59.000Z'
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter shifts by employee ID
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter shifts by department ID
 *     responses:
 *       200:
 *         description: List of shifts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Shift'
 *             example:
 *               - id: 123e4567-e89b-12d3-a456-426614174000
 *                 employeeId: 123e4567-e89b-12d3-a456-426614174001
 *                 startTime: '2024-01-15T09:00:00.000Z'
 *                 endTime: '2024-01-15T17:00:00.000Z'
 *                 position: Cashier
 *                 notes: Opening shift
 *                 status: SCHEDULED
 *                 departmentId: 123e4567-e89b-12d3-a456-426614174002
 *                 employee:
 *                   id: 123e4567-e89b-12d3-a456-426614174001
 *                   name: Jane Smith
 *                   color: '#3B82F6'
 *                 department:
 *                   id: 123e4567-e89b-12d3-a456-426614174002
 *                   name: Sales
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getShifts);

/**
 * @swagger
 * /api/shifts:
 *   post:
 *     summary: Create a new shift
 *     description: |
 *       Creates a new shift for an employee. The system automatically checks for conflicts:
 *
 *       - **Overlapping shifts** (ERROR): Cannot be overridden, blocks creation
 *       - **Weekly hours exceeded** (WARNING): Can be overridden with `overrideConflicts: true`
 *       - **Outside availability** (WARNING): Can be overridden with `overrideConflicts: true`
 *
 *       If conflicts are detected, the response includes suggested alternative times.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShiftRequest'
 *           example:
 *             employeeId: 123e4567-e89b-12d3-a456-426614174001
 *             startTime: '2024-01-15T09:00:00.000Z'
 *             endTime: '2024-01-15T17:00:00.000Z'
 *             position: Cashier
 *             departmentId: 123e4567-e89b-12d3-a456-426614174002
 *             notes: Opening shift
 *             status: SCHEDULED
 *     responses:
 *       201:
 *         description: Shift created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Employee or department belongs to different organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict detected - Overlapping shift or constraint violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictResponse'
 *             example:
 *               message: Conflicts detected when creating shift
 *               hasConflicts: true
 *               conflicts:
 *                 - type: OVERLAPPING_SHIFT
 *                   severity: ERROR
 *                   message: Employee already has a shift from 08:00 to 12:00
 *               suggestions:
 *                 - startTime: '2024-01-15T13:00:00.000Z'
 *                   endTime: '2024-01-15T21:00:00.000Z'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createShift);

/**
 * @swagger
 * /api/shifts/{id}:
 *   put:
 *     summary: Update a shift
 *     description: |
 *       Updates an existing shift. Conflict checking is performed for the new time slot
 *       (excluding the shift being updated from overlap detection).
 *
 *       Partial updates are supported - only provided fields will be updated.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The shift's unique identifier
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateShiftRequest'
 *           example:
 *             startTime: '2024-01-15T10:00:00.000Z'
 *             endTime: '2024-01-15T18:00:00.000Z'
 *             status: CONFIRMED
 *     responses:
 *       200:
 *         description: Shift updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Employee or department belongs to different organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Shift not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Shift not found
 *       409:
 *         description: Conflict detected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateShift);

/**
 * @swagger
 * /api/shifts/{id}:
 *   delete:
 *     summary: Delete a shift
 *     description: Permanently deletes a shift.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The shift's unique identifier
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Shift deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: Shift deleted
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Shift not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Shift not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteShift);

/**
 * @swagger
 * /api/shifts/auto-schedule:
 *   post:
 *     summary: Auto-schedule shifts from templates
 *     description: |
 *       Automatically creates shifts based on shift templates for a date range.
 *       The system assigns available employees to shifts using a round-robin algorithm.
 *
 *       **Algorithm:**
 *       1. For each day in the date range, find matching templates (by day of week)
 *       2. For each template, find employees available on that day
 *       3. Assign employees to shifts (up to `requiredEmployees` per template)
 *
 *       **Note:** This is a simple scheduling algorithm. For complex requirements,
 *       consider manual assignment or custom scheduling logic.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AutoScheduleRequest'
 *           example:
 *             startDate: '2024-01-15'
 *             endDate: '2024-01-21'
 *             templateIds:
 *               - 123e4567-e89b-12d3-a456-426614174000
 *               - 123e4567-e89b-12d3-a456-426614174001
 *     responses:
 *       201:
 *         description: Shifts created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AutoScheduleResponse'
 *             example:
 *               message: Created 10 shifts
 *               shifts:
 *                 - id: 123e4567-e89b-12d3-a456-426614174010
 *                   employeeId: 123e4567-e89b-12d3-a456-426614174001
 *                   startTime: '2024-01-15T09:00:00.000Z'
 *                   endTime: '2024-01-15T17:00:00.000Z'
 *                   position: Cashier
 *                   status: SCHEDULED
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/auto-schedule', autoScheduleShifts);

/**
 * @swagger
 * /api/shifts/check-conflicts:
 *   post:
 *     summary: Check for shift conflicts
 *     description: |
 *       Validates a proposed shift time without creating it.
 *       Useful for checking availability before presenting options to users.
 *
 *       Returns detailed conflict information and suggested alternative times if conflicts exist.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConflictCheckRequest'
 *           example:
 *             employeeId: 123e4567-e89b-12d3-a456-426614174001
 *             startTime: '2024-01-15T09:00:00.000Z'
 *             endTime: '2024-01-15T17:00:00.000Z'
 *     responses:
 *       200:
 *         description: Conflict check completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictResponse'
 *             examples:
 *               noConflicts:
 *                 summary: No conflicts found
 *                 value:
 *                   hasConflicts: false
 *                   conflicts: []
 *               withConflicts:
 *                 summary: Conflicts detected
 *                 value:
 *                   hasConflicts: true
 *                   conflicts:
 *                     - type: WEEKLY_HOURS_EXCEEDED
 *                       severity: WARNING
 *                       message: This shift would exceed weekly hours limit (48/40 hours)
 *                   suggestions:
 *                     - startTime: '2024-01-16T09:00:00.000Z'
 *                       endTime: '2024-01-16T17:00:00.000Z'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: employeeId, startTime, and endTime are required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Employee belongs to different organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/check-conflicts', checkConflicts);

export default router;
