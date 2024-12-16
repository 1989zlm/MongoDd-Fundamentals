//console.log('selam')
const express = require('express')
const userRouter = require('./routes/userRoutes.js')
const tourRouter = require('./routes/tourRoutes.js')
const reviewRouter = require('./routes/rewiewRoutes.js')
const cookieParser = require('cookie-parser')
const error = require('./utils/error.js')

//express uygulaması oluştur
const app = express();

//isteğin body ve header verilerini işleyen middleware(createtourda ve postta kullanılır)
app.use(express.json())
app.use(cookieParser()) //ekspres clientten gelen çerezleri işlemeye başlıyor

// yeni endpoint oluştur//! route sayfaları oluşturunca bunu sildik
// app.get('/api/tours', (req, res) => {
//     // veri tabanıyla iletişime geç//serverdayaptık
//     res.status(200).json({ message: 'veriler..' })
// })

app.use('/api/tours', tourRouter);
app.use('/api/users', userRouter) //?1). işlem
app.use('/api/reviews', reviewRouter)

//! burayı önce çok fazla hata kodu var deyip hata kodları için mw yazdık ama şimdide çok fazla satus code yazdık deyip utilste error.js adında yardımcı bir fonksiyon oluşturduk.
//Tanımlanmayan bir route'a istek atıldığında hata ver(yukarıdaki route ların dışında kalan bütün routelar yani all deriz.)(//yanlış bi route istek atınca postmande html cevabı döndürüyor ama json döndürmeli)
app.all('*', (req, res, next) => {
    //eski yöntem
    // res.status(404).json({ message: 'istek attığınız yol mevcut değil' })
    // const err = new Error('istek attığınız yol mevcut değil');
    // err.statusCode = 404;

    const err = error(404, 'istek attığınız yol mevcut değil')

    //yeni yöntem(next' parametre veririz ozaman aşağıdaki mware yönlendiiryor)
    next(err)
})

// çok fazla kod tekrarını önlemek için
//hata olduğunda devreye giren mw 
app.use((err, req, res, next) => {
    console.log(err.stack)

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'fail'
    err.message = err.message || 'Üzgünüz bir hata olustu'

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    })
})

//server.js te kullanmak için export ettik
module.exports = app;