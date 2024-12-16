const express = require('express')
const {
    getAllTours,
    createTour,
    getTour,
    deleteTour,
    updateTour,
    aliasTopTours,
    getTourStats,
    getMonthlyPlan
} = require('../controllers/tourController')
const formatQuery = require('../middleware/formatQuery')
const { protect, restricTo } = require('../controllers/authController')

//burada expresi tanımladık expresi i,çindeki route tanımladık
const router = express.Router();


//----routes----
router.route('/top-tours').get(aliasTopTours, getAllTours)//önce alias çalışsın sonra getalltorus dedik.(top tours un adminlere özel bi sayfa olduğunu söylüyoruz ve protect ile koruıyoruz ama admin sayfasında değilde ana sayfada gösterilecek bişeyse ozaman protecti kaldırıyoruz kkaldırdık)

router.route('/tour-stats').get(protect, restricTo('admin'), getTourStats) //tur istatisleri admin sayfasında olmalı koruduk ve oturumu aöık olmayanlar bu isteği atamaz o yüzden protect ile önce kimlik doğruluyoruz sonra admin rolündeyse izin veriyoruz.

router.route('/monthly-plan/:year').get(protect, restricTo('admin'), getMonthlyPlan)//yıllık plan admin sayfasnda olmalı ve protect olmalı

router.route('/')
    //!buraya controllerı ekledik
    // .get((req, res) => {
    //     res.json({ text: 'selam' })
    // }) //bütün turları alacak
    // .post((req, res) => { }) //yeni bir tur ekleyecek
    .get(formatQuery, getAllTours)
    .post(protect, restricTo('admin', 'lead-guide'), createTour) //!şeklinde yaptık

router.route('/:id')
    // .get(() => { }) //bir turu alıcak
    // .delete(() => { }) // bir turu silecek
    // .patch(() => { }) // bir tutu güncelleyecek
    .get(getTour).delete(protect, restricTo('admin', 'lead-guide'), deleteTour)
    .patch(protect, restricTo('admin', 'guied', 'lead-guide'), updateTour)

module.exports = router;