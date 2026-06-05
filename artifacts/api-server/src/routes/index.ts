import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import meRouter from "./me";
import teamRouter from "./team";
import recordsRouter from "./records";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(meRouter);
router.use(teamRouter);
router.use(recordsRouter);

export default router;
