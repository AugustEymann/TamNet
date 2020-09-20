const express = require('express');
const volleyball = require('volleyball');
const cors = require('cors');
const path = require('path')

require('dotenv').config()

const auth = require('./auth/index')
const middleware = require('./auth/middlewares')
const users = require('./api/users')
const admin = require('./api/admin')
const archive = require('./api/archive')

const app = express();  

app.use(express.json());
app.use(volleyball);
app.use(cors({
  origin: 'http://localhost:5000'
}));

app.use(middleware.checkTokenSetUser);

app.get('/', (req, res) => {
  res.json({
    message: 'Hello World! 🔥',
    user: req.user
  });
});

app.use('/cdn', express.static(path.join(__dirname, 'cdn')))
app.use('/auth', auth);

app.use('/api/v1/users', middleware.isLoggedIn, users)
app.use('/api/v1/admin', middleware.isAdmin, admin)
app.use('/api/v1/archive', archive)
app.use('/api/v1/uploads', express.static(path.join(__dirname, 'uploads')))

function notFound(req, res, next) {
  res.status(404);
  const error = new Error('Not Found - ' + req.originalUrl);
  next(error);
}

function errorHandler(err, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    stack: err.stack
  });
}

app.use(notFound);
app.use(errorHandler);

const port = 8080;
app.listen(port, () => {
  console.log('Listening on port', port);
});