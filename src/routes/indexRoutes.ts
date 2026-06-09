import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes.js";
import { OrganizationRoutes } from "../modules/organization/organization.routes.js";
import { ResourceRoutes } from "../modules/resource/resource.routes.js";
import { BookingRoutes } from "../modules/booking/booking.router.js";
import { AvailabilityRoutes } from "../modules/availability/availability.routes.js";

const router = Router();

// Auth routes -----------------------------------
router.use("/auth", AuthRoutes);

// organization routes -----------------------------------
router.use("/organization", OrganizationRoutes); 
// Resource routes -----------------------------------
router.use("/resources", ResourceRoutes);
// Booking routes -----------------------------------
router.use("/bookings", BookingRoutes);
// availability routes -----------------------------------
router.use("/availability", AvailabilityRoutes);







// test route
router.get("/health", (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

export const IndexRoutes = router;