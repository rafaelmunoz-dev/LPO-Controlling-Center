import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import meRouter from "./me";
import teamRouter from "./team";
import recordsRouter from "./records";
import microsoftRouter from "./microsoft";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(meRouter);
router.use(teamRouter);
router.use(recordsRouter);
router.use(microsoftRouter);

export default router;
