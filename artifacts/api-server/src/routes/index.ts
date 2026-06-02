import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai/index";
import openaiFunctionsRouter from "./openai/functions";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", openaiRouter);
router.use("/openai", openaiFunctionsRouter);

export default router;
