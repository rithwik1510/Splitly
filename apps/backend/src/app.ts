import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { env } from "./config/env";
import { attachUser } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { generalRateLimiter } from "./middleware/rate-limit";
import { registerRoutes } from "./routes";

const app = express();

app.disable("x-powered-by");
app.use(compression());
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "tiny"));
app.use(generalRateLimiter);
app.use(attachUser);

registerRoutes(app);

app.use(errorHandler);

export { app };
