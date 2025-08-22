require("dotenv").config();
const app = require("./index");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Lissen API running on port ${PORT}`);
  });
});
