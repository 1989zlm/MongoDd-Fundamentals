// geliştirme aşamasında mongdbdeki verilerin sıkça değişeceğinden veya bozulacaından veritabanındaki verileri temizlemeye ve json dosyasındaki verileri veritabanına aktarmaya yarayan ve terminalden komutlarla çalışacak 2 fonksiyon yazalım


const Tour = require('../models/tourModel.js')
const mongoose = require('mongoose')
const fs = require('fs')

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

//json dosyasından verileri al(dirname mevcut klasörü veriyor)
const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/data/tours-simple.json`))

//devdata klasöründeki json dosyalarını veritabanına aktarır
const importData = async () => {
    try {
        await Tour.create(tours)
        console.log('veriler import edildi')
    } catch (err) {
        console.log(err)
    }
    process.exit()
}

//mongodbdeki verileri
const clearData = async () => {
    try {
        await Tour.deleteMany()
        console.log('veriler silindi')
    } catch (err) {
        console.log(err)
    }
    //terminalde komut satırına düşmesi için işlemin sonlanması lazım
    process.exit()
}

//çalıştırılan komutun sonuna eklenen bayrağa göre doğru fonksiyonu tetikle
//console.log(process.argv);
if (process.argv.includes('--import')) {
    importData();
} else if (process.argv.includes('--clear')) {
    clearData();
}
