//? 2.işlem

//? 4.işlem


const express = require('express')
const { signUp, login, logout, forgotPassword, resetPassword, updatePassword, protect } = require('../controllers/authController')



//burada expresi tanımladık expresi i,çindeki route tanımladık
const router = express.Router();

//router.route('/api/users') böyleydi app.js te bütün app.use ların içine yazdık burdan sildik
//! 2.bu fonksiyonları burada tanımlamak kod kalabalığı yaptığı için userController.js yazıyoruz. 
router.post('/signup', signUp)

// router.post('/login', () => { }) //4.işlem böyleydi aşağıdaki gibi yaptık
router.post('/login', login)

router.post('/logout', logout)

router.post('/forgot-password', forgotPassword)

router.patch('/reset-password/:token', resetPassword)

router.patch('/update-password', protect, updatePassword)

module.exports = router;