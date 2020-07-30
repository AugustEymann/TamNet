const express = require('express');
const Joi = require('joi');
const monk = require('monk')

const db = require('../db/connection');
const users = db.get('users');

function respondError422(res, next,text) {
    res.status(422);
    const error = new Error(text);
    next(error)
}

const router =  express.Router()

router.get('/delete/:username?', (req,res,next) => {
    console.log(req.params.user_id)
   if (req.params.username) {
    users.remove({ _id: req.params.user_id }, {castIds: false}).then((result)=> {
        res.json({'status': result})
    })
   } else {
    respondError422(res,next, 'Provide a User Id.')
   }
});

router.get('/demote/:username?', (req,res,next) => {
   if (req.params.username) {
    users.findOneAndUpdate({ username: req.params.username }, { $set: { role: 'user'}}).then((result)=> {
        res.json({'status': result})
    })
   } else {
    respondError422(res,next, 'Provide a User Id.')
   }
});

router.get('/promote/:user_id?', (req,res,next) => {
    console.log(req.params.user_id)
   if (req.params.user_id) {
    users.findOneAndUpdate({ _id: req.params.user_id }, { $set: { role: 'admin'}}, {castIds: false}).then((result)=> {
        res.json({'status': result})
    })
   } else {
    respondError422(res,next, 'Provide a User Id.')
   }
});

router.post('/edit', (req,res,next) => {
    console.log(req.body)
    if (req.body.userId) {
        users.findOneAndUpdate({ _id: monk.id(req.params.user_id) }, { $set: { username: req.body.newUsername} }).then((result)=> {
            res.json({'status': result})
        })
       } else {
        respondError422(res,next, 'Provide a User Id.')
       }
});


module.exports = router