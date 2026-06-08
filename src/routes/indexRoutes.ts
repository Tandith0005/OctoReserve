import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes.js";
import { OrganizationRoutes } from "../modules/organization/organization.routes.js";
import { ResourceRoutes } from "../modules/resource/resource.routes.js";

const router = Router();

// Auth routes -----------------------------------
router.use("/auth", AuthRoutes);

// organization routes -----------------------------------
router.use("/organization", OrganizationRoutes); 
// Resource routes -----------------------------------
router.use("/resources", ResourceRoutes);

export const IndexRoutes = router;