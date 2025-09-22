// bootstrap.cjs
(async () => {
  try {
    await import("./src/server.js");
  } catch (e) {
    console.error("Bootstrap error:", e);
    process.exit(1);
  }
})();
