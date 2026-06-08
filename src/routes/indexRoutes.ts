import { Router } from "express";

const router = Router();


router.use("/auth", AuthRoutes);


export const IndexRoutes = router;