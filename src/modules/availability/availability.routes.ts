import { Router } from 'express';
import { AvailabilityController } from './availability.controller.js';
import { requireEmployee } from '../../middlewares/role.middleware.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = Router();

// All availability routes require authentication
router.use(authMiddleware);

// Routes for employees and admins
router.get('/slots', requireEmployee, AvailabilityController.getAvailableSlots);
router.post('/batch', requireEmployee, AvailabilityController.getBatchAvailability);
router.get('/daily/:resourceId', requireEmployee, AvailabilityController.getDailyAvailability);

export const AvailabilityRoutes = router;