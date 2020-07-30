const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const db = require('../db/connection');
const photoArchive = db.get('archive');
const crypto = require('crypto');
const path = require('path');
const shortId = require('shortid');

const router =  express.Router()
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
      crypto.pseudoRandomBytes(16, function (err, raw) {
        if (err) return cb(err)
  
        cb(null, raw.toString('hex') + path.extname(file.originalname))
      })
    }
  })
const fileFilter = (req,file,cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const upload = multer({
    storage: storage,
    fileFilter: fileFilter    
})


router.get('/', (req,res,next) => {
    photoArchive.find({}, {sort: {filename: 1}}).then(function (archived) {
       res.json(archived);
    })
});

router.post('/', upload.single('file'), (req,res,next) => {
    const newUpload = {
        _id: shortId.generate(),
        fileName: req.file.filename,
        date: req.body.date,
        company: req.body.company,
        location: req.body.location,
        project: req.body.project,
        tp: req.body.tpNumber,
        people: req.body.people,
    }

    photoArchive.insert(newUpload, {castIds: false}).then(result => {
        res.json({'status': 'File Uploaded.'})
    });
});
module.exports = router