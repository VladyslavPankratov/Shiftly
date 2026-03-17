import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/department.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Get all departments
 *     description: Retrieves a list of all departments in the authenticated user's organization, ordered by name. Includes employee count for each department.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of departments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Department'
 *             example:
 *               - id: 123e4567-e89b-12d3-a456-426614174000
 *                 name: Sales
 *                 color: '#6B7280'
 *                 organizationId: 123e4567-e89b-12d3-a456-426614174001
 *                 _count:
 *                   employees: 5
 *                 createdAt: '2024-01-01T00:00:00.000Z'
 *                 updatedAt: '2024-01-01T00:00:00.000Z'
 *               - id: 123e4567-e89b-12d3-a456-426614174002
 *                 name: Kitchen
 *                 color: '#EF4444'
 *                 organizationId: 123e4567-e89b-12d3-a456-426614174001
 *                 _count:
 *                   employees: 8
 *                 createdAt: '2024-01-01T00:00:00.000Z'
 *                 updatedAt: '2024-01-01T00:00:00.000Z'
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
router.get('/', getDepartments);

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create a new department
 *     description: Creates a new department in the authenticated user's organization.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDepartmentRequest'
 *           example:
 *             name: Sales
 *             color: '#6B7280'
 *     responses:
 *       201:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Department'
 *             example:
 *               id: 123e4567-e89b-12d3-a456-426614174000
 *               name: Sales
 *               color: '#6B7280'
 *               organizationId: 123e4567-e89b-12d3-a456-426614174001
 *               createdAt: '2024-01-15T10:00:00.000Z'
 *               updatedAt: '2024-01-15T10:00:00.000Z'
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
router.post('/', createDepartment);

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: Update a department
 *     description: Updates an existing department's name and/or color.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The department's unique identifier
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDepartmentRequest'
 *           example:
 *             name: Sales Team
 *             color: '#10B981'
 *     responses:
 *       200:
 *         description: Department updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Department'
 *             example:
 *               id: 123e4567-e89b-12d3-a456-426614174000
 *               name: Sales Team
 *               color: '#10B981'
 *               organizationId: 123e4567-e89b-12d3-a456-426614174001
 *               createdAt: '2024-01-01T00:00:00.000Z'
 *               updatedAt: '2024-01-15T10:00:00.000Z'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Department not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Department not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateDepartment);

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     summary: Delete a department
 *     description: |
 *       Permanently deletes a department. Employees and shifts in this department will have their departmentId set to null (not deleted).
 *
 *       **Warning:** This action cannot be undone.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The department's unique identifier
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: Department deleted
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Department not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Department not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteDepartment);

export default router;
