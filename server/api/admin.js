const express = require('express');
const Joi = require('joi');

const db = require('../db/connection');
const users = db.get('users');

function respondError422(res, next,text) {
    res.status(422);
    const error = new Error(text);
    next(error)
}

const router =  express.Router()

router.get('/delete/:user_id?', (req,res,next) => {
    console.log(req.params.user_id)
   if (req.params.user_id) {
    users.remove({ _id: req.params.user_id }).then((result)=> {
        res.json({'status': result})
    })
   } else {
    respondError422(res,next, 'Provide a User Id.')
   }
});

router.get('/demote/:user_id?', (req,res,next) => {
    console.log(req.params.user_id)
   if (req.params.user_id) {
    users.findOneAndUpdate({ _id: req.params.user_id }, { $set: { role: 'user'} }).then((result)=> {
        res.json({'status': result})
    })
   } else {
    respondError422(res,next, 'Provide a User Id.')
   }
});

router.get('/promote/:user_id?', (req,res,next) => {
    console.log(req.params.user_id)
   if (req.params.user_id) {
    users.findOneAndUpdate({ _id: req.params.user_id }, { $set: { role: 'admin'} }).then((result)=> {
        res.json({'status': result})
    })
   } else {
    respondError422(res,next, 'Provide a User Id.')
   }
});

router.post('/edit', (req,res,next) => {
    console.log(req.body)
    if (req.body.userId) {
        users.findOneAndUpdate({ _id: req.body.userId }, { $set: { username: req.body.newUsername} }).then((result)=> {
            res.json({'status': result})
        })
       } else {
        respondError422(res,next, 'Provide a User Id.')
       }
});


module.exports = router