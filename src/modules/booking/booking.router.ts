import { Router } from 'express';
import { BookingController } from './booking.controller.js';
import { requireOrgAdmin, requireEmployee } from '../../middlewares/role.middleware.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = Router();

// All booking routes require authentication
router.use(authMiddleware);

// Routes for authenticated users
router.post('/', requireEmployee, BookingController.createBooking);
router.get('/my-bookings', requireEmployee, BookingController.getUserBookings);
router.get('/:id', requireEmployee, BookingController.getBooking);
router.patch('/:id', requireEmployee, BookingController.updateBooking);
router.post('/:id/cancel', requireEmployee, BookingController.cancelBooking);

// Admin-only routes
router.get('/organization/all', requireOrgAdmin, BookingController.getAllOrganizationBookings);
router.get('/resource/:resourceId', requireOrgAdmin, BookingController.getResourceBookings);

export const BookingRoutes = router;