const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1, MIDDLEWARE

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('./public'));

app.use((req, res, next) => {
  console.log('hello from the middleware');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//3. ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);

//4. START A SERVER
module.exports = app;
