import { MongoMemoryServer } from "mongodb-memory-server";

console.log("Khởi động MongoDB local trên port 27017...");

const mongod = await MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbName: "pr_evidence",
  },
});

console.log(`MongoDB đã sẵn sàng tại: ${mongod.getUri()}`);

// Giữ tiến trình chạy nền
process.on("SIGINT", async () => {
  await mongod.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongod.stop();
  process.exit(0);
});

// Giữ event loop hoạt động
setInterval(() => {}, 1000 * 60);
