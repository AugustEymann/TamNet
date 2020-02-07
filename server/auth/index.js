const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const middleware = require('./middlewares')

const router = express.Router();

const db = require('../db/connection');
const users = db.get('users');
users.createIndex('username',{unique: true});

const userSchema = Joi.object().keys({
  username: Joi.string().regex(/(^[a-zA-Z0-9_]*$)/).min(3).max(30).required(),
  password: Joi.string().trim().min(6).required(),
})

function respondError422(res, next) {
  res.status(422);
  const error = new Error('Unable to Login!');
  next(error)
}

function createToken(user, res, next) {
  const payload = {
    _id: user._id,
    username: user.username,
    role: user.role
  };

  jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: '1d'
  }, (err, token) => {
    if (err) {
      respondError422(res, next);
    } else {
      res.json({
        token
      });
    }
  });
}

router.post('/signup', middleware.isAdmin, (req,res, next) => {
    console.log('Body', req.body)
    const result = Joi.validate(req.body,userSchema); 
    
    if(result.error === null) {
      users.findOne({username: req.body.username}).then(function(user) {
        if(user) {
        //Already a user
        const err = new Error('Username already used, Please use another one.')
        res.status(409);
        next(err);
        } else {
        //Hash Password and Create User
        bcrypt.hash(req.body.password, 12).then(hash => {
          const newUser = {
            username: req.body.username,
            password: hash,
            role: "user",
          }
          users.insert(newUser).then(result => {
            createToken(result,res,next)
          });
        });
        }
      });
    } else {
      res.status(406)
      next(result.error);
    }
});

router.post('/login', (req,res,next) => {
  const result = Joi.validate(req.body,userSchema)
  if (result.error === null) {
    users.findOne({username: req.body.username}).then(function(user) {
      if (user) {
        //User confirmed
        bcrypt.compare(req.body.password, user.password,function(err,result) {
          if (result) {
            //Password Confirmed
           createToken(user,res,next)
          } else {
            //Password Invalid
            res.status(422);
            const error = new Error('Password Incorrect!');
            next(error) 
          }   
        });
      } else {
        // Not a user!
        res.status(422);
        const error = new Error('Didnt find user!');
        next(error)
      }
    });
  } else {
    respondError422(res,next);
  }
});


module.exports = router;