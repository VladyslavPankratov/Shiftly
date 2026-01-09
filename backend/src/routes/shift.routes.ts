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

router.get('/', getShifts);
router.post('/', createShift);
router.put('/:id', updateShift);
router.delete('/:id', deleteShift);
router.post('/auto-schedule', autoScheduleShifts);
router.post('/check-conflicts', checkConflicts);

export default router;
