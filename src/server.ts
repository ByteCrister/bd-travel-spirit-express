import { server } from "./app";

import { connectDB, disconnectDB } from "./config/db";
import { env } from "./config/env";
import logger from "./config/logger";

async function startServer() {
    try {
        await connectDB();

        server.listen(env.PORT, () => {
            logger.info(`Server ▶ Listening on port ${env.PORT}`);
        });

        const shutdown = async () => {
            logger.info("Server ▶ Shutdown initiated");

            await disconnectDB();

            server.close(() => {
                logger.info("Server ▶ HTTP server closed");
                process.exit(0);
            });
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

    } catch (error) {
        logger.error("Server ▶ Failed to start:", error);
        process.exit(1);
    }
}

startServer();