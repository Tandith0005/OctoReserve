import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes.js";
import { OrganizationRoutes } from "../modules/organization/organization.routes.js";

const router = Router();

// Auth routes -----------------------------------
router.use("/auth", AuthRoutes);

// organization routes -----------------------------------
router.use("/organization", OrganizationRoutes); 


export const IndexRoutes = router;