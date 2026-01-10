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

// CRUD routes
router.get('/', getTemplates);
router.get('/:id', getTemplate);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

// Apply templates to generate shifts
router.post('/apply', applyTemplates);

export default router;
