import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes.js";

const router = Router();

// Auth routes -----------------------------------
router.use("/auth", AuthRoutes);


export const IndexRoutes = router;