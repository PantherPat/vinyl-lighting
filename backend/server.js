const path = require('path');
const express = require('express');

const catalogRouter = require('./routes/catalog');
const commandRouter = require('./routes/command');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/catalog', catalogRouter);
app.use('/command', commandRouter);

app.listen(PORT, () => {
  console.log(`Vinyl Lighting app running at http://localhost:${PORT}`);
});
