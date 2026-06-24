require("dotenv").config();

const app = require("./app");
const config = require("./config");

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`⚽ World Cup Simulator berjalan di http://localhost:${PORT}`);
});
