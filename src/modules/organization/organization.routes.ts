import { Router } from 'express';
import { OrganizationController } from './organization.controller.js';
import { requireOrgAdmin } from '../../middlewares/role.middleware.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = Router();

// All organization routes require authentication
router.use(authMiddleware);

// Organization management (ORG_ADMIN only)
router.post('/', requireOrgAdmin, OrganizationController.createOrganization);
router.get('/all', requireOrgAdmin, OrganizationController.getAllOrganizations);
router.get('/settings', OrganizationController.getSettings);
router.get('/:id', OrganizationController.getOrganization);
router.patch('/:id', requireOrgAdmin, OrganizationController.updateOrganization);

export const OrganizationRoutes = router;