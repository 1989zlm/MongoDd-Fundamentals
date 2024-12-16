const express = require('express')

//burada expresi tanımladık expresi i,çindeki route tanımladık

const router = express.Router();

router.route('/')
    .get((req, res) => { }) //bütün turları alacak
    .post((req, res) => { }) //yeni bir tur ekleyecek

router.route('/:id')
    .get(() => { }) //bir turu alıcak
    .delete(() => { }) // bir turu silecek
    .patch(() => { }) // bir tutu güncelleyecek

module.exports = router;