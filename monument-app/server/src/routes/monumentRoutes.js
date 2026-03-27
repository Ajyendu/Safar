import { Router } from "express";
import { getMonumentBySlug, listMonuments } from "../controllers/monumentController.js";
import { getNavigationRoute } from "../controllers/navigationController.js";

const router = Router();

router.get("/", listMonuments);
/** Must be before /:slug to avoid "navigation" being parsed as slug */
router.get("/:slug/navigation", getNavigationRoute);
router.get("/:slug", getMonumentBySlug);

export default router;
