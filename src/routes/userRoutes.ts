import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
} from '../controllers/userController';
import { userUpdateSchema, validateRequest } from '../utils/validation';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

router.get('/profile', authenticateToken, getProfile);
router.put(
  '/profile',
  authenticateToken,
  validateRequest(userUpdateSchema),
  updateProfile,
);

export default router;
