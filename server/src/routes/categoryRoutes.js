import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// All category routes require authentication
router.use(protect);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.patch('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
