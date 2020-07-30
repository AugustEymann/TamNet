const express = require('express');
const Joi = require('joi');
const db = require('../db/connection');
const users = db.get('users');

const router =  express.Router()

router.get('/:user_id?', (req,res,next) => {
    console.log(req.params.user_id)
   if (req.params.user_id) {
    users.findOne({ _id: req.params.user_id }).then(function (user) {
        delete user.password;
        res.json(user);
    })
   } else {
    //Get all users
    users.find({}, {sort: {name: 1}}).then(function (users) {
        for (var i in users) {
            delete users[i].password;
        }
       res.json(users);
    })
   }
});

module.exports = router