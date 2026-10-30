import express from "express";
import { createServer } from "http";
import swaggerUi from "swagger-ui-express";
import { createRequire } from "module";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { PORT } from "./config.js";
import { initSocket } from "./socket.js";
import authRouter from "./routes/auth.js";
import ordersRouter from "./routes/orders.js";
import usersRouter from "./routes/users.js";
import uploadRouter from "./routes/media.js";
import productsRouter from "./routes/products.js";
import cartsRouter from "./routes/carts.js";
import paymentsRouter from "./routes/payments.js";
import reportsRouter from "./routes/reports.js";
import couponsRouter from "./routes/coupons.js";
import reviewsRouter from "./routes/reviews.js";

const require = createRequire(import.meta.url);
const swaggerDocument = require("./swagger.json");

const app = express();
const server = createServer(app);
initSocket(server); // Initialize Socket.IO with the HTTP server

app.use(cors());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 100 : 1000,
}));
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth", authRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/users", usersRouter);
app.use("/uploads", express.static("uploads"));
app.use("/api/media", uploadRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/reviews", reviewsRouter);

server.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
