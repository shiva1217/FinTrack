import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

async function startServer() {
  await connectDatabase();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Backend server running on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend server");
  console.error(error);
  process.exit(1);
});
