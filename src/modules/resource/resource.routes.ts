import { Router } from 'express';
import { ResourceController } from './resource.controller.js';
import { requireOrgAdmin, requireEmployee } from '../../middlewares/role.middleware.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = Router();

// All resource routes require authentication
router.use(authMiddleware);

// Routes that require ORG_ADMIN
router.post('/', requireOrgAdmin, ResourceController.createResource);
router.patch('/:id', requireOrgAdmin, ResourceController.updateResource);
router.delete('/:id', requireOrgAdmin, ResourceController.deleteResource);

// Routes accessible by both ORG_ADMIN and EMPLOYEE
router.get('/', requireEmployee, ResourceController.getAllResources);
router.get('/types', requireEmployee, ResourceController.getResourceTypes);
router.get('/:id/settings', requireEmployee, ResourceController.getResourceAvailabilitySettings);
router.get('/:id', requireEmployee, ResourceController.getResource);

export const ResourceRoutes = router;