import { Router } from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employee.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees
 *     description: Retrieves a list of all employees in the authenticated user's organization, ordered by name. Includes department and availability information.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *             example:
 *               - id: 123e4567-e89b-12d3-a456-426614174000
 *                 name: Jane Smith
 *                 email: jane.smith@company.com
 *                 phone: '+1234567890'
 *                 position: Cashier
 *                 color: '#3B82F6'
 *                 weeklyHoursLimit: 40
 *                 organizationId: 123e4567-e89b-12d3-a456-426614174001
 *                 departmentId: 123e4567-e89b-12d3-a456-426614174002
 *                 department:
 *                   id: 123e4567-e89b-12d3-a456-426614174002
 *                   name: Sales
 *                   color: '#6B7280'
 *                 availability:
 *                   - id: 123e4567-e89b-12d3-a456-426614174003
 *                     dayOfWeek: 1
 *                     startTime: '09:00'
 *                     endTime: '17:00'
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
router.get('/', getEmployees);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     description: Retrieves detailed information about a specific employee, including their department, availability, and last 10 shifts.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The employee's unique identifier
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Employee'
 *                 - type: object
 *                   properties:
 *                     shifts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Shift'
 *             example:
 *               id: 123e4567-e89b-12d3-a456-426614174000
 *               name: Jane Smith
 *               email: jane.smith@company.com
 *               phone: '+1234567890'
 *               position: Cashier
 *               color: '#3B82F6'
 *               weeklyHoursLimit: 40
 *               department:
 *                 id: 123e4567-e89b-12d3-a456-426614174002
 *                 name: Sales
 *               availability:
 *                 - dayOfWeek: 1
 *                   startTime: '09:00'
 *                   endTime: '17:00'
 *               shifts:
 *                 - id: 123e4567-e89b-12d3-a456-426614174004
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
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Employee not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getEmployee);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee
 *     description: Creates a new employee in the authenticated user's organization. Optionally includes availability schedule.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployeeRequest'
 *           example:
 *             name: Jane Smith
 *             email: jane.smith@company.com
 *             phone: '+1234567890'
 *             position: Cashier
 *             departmentId: 123e4567-e89b-12d3-a456-426614174002
 *             color: '#3B82F6'
 *             weeklyHoursLimit: 40
 *             availability:
 *               - dayOfWeek: 1
 *                 startTime: '09:00'
 *                 endTime: '17:00'
 *               - dayOfWeek: 2
 *                 startTime: '09:00'
 *                 endTime: '17:00'
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *             example:
 *               id: 123e4567-e89b-12d3-a456-426614174000
 *               name: Jane Smith
 *               email: jane.smith@company.com
 *               phone: '+1234567890'
 *               position: Cashier
 *               color: '#3B82F6'
 *               weeklyHoursLimit: 40
 *               organizationId: 123e4567-e89b-12d3-a456-426614174001
 *               departmentId: 123e4567-e89b-12d3-a456-426614174002
 *               department:
 *                 id: 123e4567-e89b-12d3-a456-426614174002
 *                 name: Sales
 *               availability:
 *                 - dayOfWeek: 1
 *                   startTime: '09:00'
 *                   endTime: '17:00'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Department belongs to different organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Access denied to this department
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Update an employee
 *     description: Updates an existing employee's information. If availability is provided, it replaces all existing availability records.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The employee's unique identifier
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEmployeeRequest'
 *           example:
 *             name: Jane Smith-Johnson
 *             position: Senior Cashier
 *             weeklyHoursLimit: 45
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Department belongs to different organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Employee not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Delete an employee
 *     description: Permanently deletes an employee and all associated data (availability, shifts are cascaded).
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The employee's unique identifier
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: Employee deleted
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Employee not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteEmployee);

export default router;
