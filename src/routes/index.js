// index.js
const express = require("express");
const app = express();
const cors = require('cors');
const themesRoutes = require('./routes/themes.routes');
const biblesRoutes = require('./routes/bibles.routes');
const booksRoutes = require('./routes/books.routes');
const meditationsRoutes = require('./routes/meditations.routes');

app.use(cors());
app.use(express.json());

app.use('/api/themes', themesRoutes);
app.use('/api/bibles', biblesRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/meditations', meditationsRoutes);

app.get('/', (_, res) => {
  res.send('Lissen API is running ✅');
});

module.exports = app;
