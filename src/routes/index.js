const express = require("express");
const router = express.Router();

router.get("/", (req, res) => res.send("Lissen API OK 🚀"));

module.exports = router;
