const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit'); //standard
const helmet = require('helmet'); // standard
const mongoSanitize = require('express-mongo-sanitize'); // standard
const xss = require('xss-clean'); // standard
const hpp = require('hpp'); // standard

const AppError = require('./utils/appError');
const globalErrorhandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// 1, GLOBAL MIDDLEWARE
// Set security HTTP headers
app.use(helmet());

// Developmement logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //allow 100 request in the same ip in 1 hour
  message: 'Too many requests from this IP, Please try again in an hour',
});

app.use('/api', limiter);

// Body parser, reading body from body into req.body
app.use(express.json({ limit: '10Kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Serving static files
app.use(express.static('./public'));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers)
  next();
});

//3. ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `can't find ${req.originalUrl} on this server`,
  // });

  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorhandler);

module.exports = app;
