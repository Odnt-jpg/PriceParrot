const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes); // Routes for login and registration
app.use('/api/products', productRoutes); // Routes for products
app.use('/api/users', userRoutes); // Routes for user
// Need to add for retailers


app.get('/', (req, res) => {
  res.send('Backend server is running!');
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});