import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplates,
} from '../controllers/template.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Get all shift templates
 *     description: |
 *       Retrieves all shift templates for the authenticated user's organization.
 *       Results are ordered by day of week, then by start time.
 *
 *       Templates define recurring shift patterns that can be applied to generate actual shifts.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter templates by department ID
 *     responses:
 *       200:
 *         description: List of templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShiftTemplate'
 *             example:
 *               - id: 123e4567-e89b-12d3-a456-426614174000
 *                 name: Morning Shift
 *                 dayOfWeek: 1
 *                 startTime: '09:00'
 *                 endTime: '17:00'
 *                 position: Cashier
 *                 requiredEmployees: 2
 *                 departmentId: 123e4567-e89b-12d3-a456-426614174001
 *                 department:
 *                   id: 123e4567-e89b-12d3-a456-426614174001
 *                   name: Sales
 *               - id: 123e4567-e89b-12d3-a456-426614174002
 *                 name: Evening Shift
 *                 dayOfWeek: 1
 *                 startTime: '17:00'
 *                 endTime: '23:00'
 *                 position: Cashier
 *                 requiredEmployees: 1
 *                 departmentId: null
 *                 department: null
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
router.get('/', getTemplates);

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     description: Retrieves a specific shift template by its ID.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The template's unique identifier
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiftTemplate'
 *             example:
 *               id: 123e4567-e89b-12d3-a456-426614174000
 *               name: Morning Shift
 *               dayOfWeek: 1
 *               startTime: '09:00'
 *               endTime: '17:00'
 *               position: Cashier
 *               requiredEmployees: 2
 *               departmentId: 123e4567-e89b-12d3-a456-426614174001
 *               department:
 *                 id: 123e4567-e89b-12d3-a456-426614174001
 *                 name: Sales
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Template not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getTemplate);

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: Create a new shift template
 *     description: |
 *       Creates a new shift template that defines a recurring shift pattern.
 *
 *       **Day of Week Values:**
 *       - 0 = Sunday
 *       - 1 = Monday
 *       - 2 = Tuesday
 *       - 3 = Wednesday
 *       - 4 = Thursday
 *       - 5 = Friday
 *       - 6 = Saturday
 *
 *       **Time Format:** Use HH:mm format (e.g., "09:00", "17:30")
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTemplateRequest'
 *           example:
 *             name: Morning Shift
 *             dayOfWeek: 1
 *             startTime: '09:00'
 *             endTime: '17:00'
 *             position: Cashier
 *             departmentId: 123e4567-e89b-12d3-a456-426614174001
 *             requiredEmployees: 2
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiftTemplate'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   message: Name, day of week, start/end time, and position are required
 *               invalidDay:
 *                 summary: Invalid day of week
 *                 value:
 *                   message: Day of week must be between 0 (Sunday) and 6 (Saturday)
 *               invalidTime:
 *                 summary: Invalid time format
 *                 value:
 *                   message: Invalid time format. Use HH:mm
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createTemplate);

/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     summary: Update a shift template
 *     description: Updates an existing shift template. Only provided fields will be updated.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The template's unique identifier
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTemplateRequest'
 *           example:
 *             name: Early Morning Shift
 *             startTime: '07:00'
 *             endTime: '15:00'
 *             requiredEmployees: 3
 *     responses:
 *       200:
 *         description: Template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiftTemplate'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidDay:
 *                 summary: Invalid day of week
 *                 value:
 *                   message: Day of week must be between 0 (Sunday) and 6 (Saturday)
 *               invalidTime:
 *                 summary: Invalid time format
 *                 value:
 *                   message: Invalid start time format. Use HH:mm
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
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Template not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateTemplate);

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: Delete a shift template
 *     description: |
 *       Permanently deletes a shift template.
 *
 *       **Note:** Existing shifts created from this template are not affected.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The template's unique identifier
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: Template deleted
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Template not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteTemplate);

/**
 * @swagger
 * /api/templates/apply:
 *   post:
 *     summary: Preview shifts from templates
 *     description: |
 *       Generates a preview of shifts that would be created from the selected templates
 *       for a given date range.
 *
 *       This endpoint does **not** create actual shifts - it returns a preview.
 *       To create the shifts with employee assignments, use the `/api/shifts/auto-schedule` endpoint.
 *
 *       **Use Case:** Show users what shifts would be generated before committing.
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplyTemplatesRequest'
 *           example:
 *             templateIds:
 *               - 123e4567-e89b-12d3-a456-426614174000
 *               - 123e4567-e89b-12d3-a456-426614174001
 *             startDate: '2024-01-15'
 *             endDate: '2024-01-21'
 *     responses:
 *       200:
 *         description: Preview generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplyTemplatesResponse'
 *             example:
 *               preview: true
 *               count: 14
 *               shifts:
 *                 - templateId: 123e4567-e89b-12d3-a456-426614174000
 *                   templateName: Morning Shift
 *                   startTime: '2024-01-15T09:00:00.000Z'
 *                   endTime: '2024-01-15T17:00:00.000Z'
 *                   position: Cashier
 *                   departmentId: 123e4567-e89b-12d3-a456-426614174001
 *                   departmentName: Sales
 *                   dayOfWeek: 1
 *               message: Use auto-schedule to assign employees to these shifts
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noTemplates:
 *                 summary: No templates selected
 *                 value:
 *                   message: At least one template must be selected
 *               noDates:
 *                 summary: Missing dates
 *                 value:
 *                   message: Start date and end date are required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Templates not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Templates not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/apply', applyTemplates);

export default router;
