import { Router } from 'express';
import { activityController } from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// All activity routes require authentication
router.use(protect);

router.get('/', activityController.getActivities);
router.post('/', activityController.createActivity);
router.patch('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

export default router;
