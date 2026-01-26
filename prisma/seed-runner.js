const seedModule =
  process.env.APP_ENV === "test" ? "./seed.test" : "./seed";

const { runSeed } = require(seedModule);

runSeed().catch((error) => {
  console.error(error);
  process.exit(1);
});
