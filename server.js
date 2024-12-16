const app = require('./app.js')
const mongoose = require('mongoose')
//.env dosyasında değişkenlere erişim sağlayan kütüphanedir
require('dotenv').config()

//console.log(process.env)

//mongodb veri tabanına bağlan
//mongoose.connect() veri tabanına bağlanmamızı sağlıyor
mongoose
    //.connect('mongodb://localhost:27017') yerine artık
    .connect(process.env.MONGO_URL) //yazdık
    .then(() => {
        console.log('✅ veri tabanına bağlanıldı')
    })
    .catch((err) => {
        console.log('🟥 veri tabanına bağlanamadı !!!')
    })


// express uygulamasını ayağa kaldır(dinlemeyi başlat)
//const port = 3000; yerine artık
const port = process.env.PORT;
app.listen(port, () => {
    console.log(`🔥 ${port}. port dinlenmeye başlandı`)
})

