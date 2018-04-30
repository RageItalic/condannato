const express = require('express');
const cors    = require('cors');
const app     = express();
const PORT    = 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

const counsellors = require('./routes/counsellors.js');
const clients = require('./routes/clients.js');

app.use('/counsellors', counsellors);
app.use('/clients', clients);

app.get('/', (req, res) => {
  var message = {
    status: 200,
    content: "HELLO"
  }
  res.json(message)
})

app.listen(PORT, () => console.log(`Successfully listening on ${PORT}`));