//! BURADA CREATE TOURDA TANIMLANACAK CREAT TOURUN SCHEMA Sİ OLUŞTURULUR ŞEMASI YANİ


/*
 * Mongoose'da neden modele ihitiyaç duyarız ?
 * Bir kolleksiyona yeni bir veri eklerken bunun bir kısıtlmaya tabi tutulmasını isteriz önreğin users kolleksiyonundaki her bir nesnenin name,surname ve age değerlnin olmaını iseriz. Kyadeidlecek olan her bir veri bu şemadaki kısıtlamlara uygunsa kaydedilir aksi takdirde hata fırlatır.
 * Bu sayede kolleksiyonda tutulan dökümanalrın daha tutarlı olmasını sağlarız
 */

const mongoose = require('mongoose')
const validator = require('validator')// kontrol değil veri doğrulama içindir.

// veritabanına kaydedilecek olan verilerin kısıtlamalarını yazarız
//bunlar opsiyonel tipleri zorunlu, zorunlu olanlarıda göreceğiz.
const tourSchema = new mongoose.Schema({
    //!BURADA NAME STRİNG OLSUN DEDİK MESELA
    // name: String,
    // duration: Number,
    // maxGroupSize: Number,
    // difficulty: String,

    //!BURADAİSE NAME TYPE STRİNG OLSUN AYNI ZAMAN BUYUK HARFLE BALASIN GİBİ FARKLI KISITLAMALAR EKLEDİK ZORUNLU OLMASI İÇİNDE REQUİREd:TRUE DEDİK

    name: {
        type: String,
        unique: [true, 'bu tur ismi zaten mevcut'],
        required: [true, "Tur isim değerine sahip olmalı"],
        validate: [validator.isAlphanumeric, //third party validator
            'Tur ismi karakter içermemeli']
    }, //unique aynı isimden bitane daha olamaz// validate'i custom validate ilede yapabilirdik ama bu daha hızlı



    price: {
        type: Number,
        required: [true, 'tur fiyat değerine sahip olmalı'],
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'tur maksimum kişi sayısı değerine sahip olmalı'],
    },

    //indirim
    priceDiscount: {
        type: Number,
        //custom validator(kendi yazdığımız kontrol methodları)
        //doğrulama fonksiyonları false return ederse doğrulamadan geçmedi anlamına gelir ve belge veritabanına kaydedilmez true return ederse doğrulamadan geçti anlamına gelir.
        //burada value propu pricediscounttur. namede yazaydık value prop u name olacaktı
        validate: {
            validator: function (value) {
                return value < this.price;
            },
            message: 'İndirim fiyatı asıl fiyattan büyük olamaz'
        },

    },


    duration: {
        type: Number,
        required: [true, "Tur süre değerine sahip olmalı"],
    },

    difficulty: {
        type: String,
        required: [true, "Tur zorluk değerine sahip olmalı"],
        enum: ["easy", "medium", "hard", "difficult"],
    },

    maxGroupSize: {
        type: Number,
        required: [true, 'tur maksimum kişi sayısı değerine sahip olmalı'],
    },
    ratingsAverage: {
        type: Number,
        min: [1, "Rating değeri 1'den küçük olamaz"],
        max: [5, "Rating değeri 5'den büyük olamaz"],
        default: 4.0,
    },

    ratingsQuantity: {
        type: Number,
        default: 0,
    },

    summary: {
        type: String,
        maxLength: [200, "Özet alanı 200 karakteri geçemez"],
        required: [true, "Tur özet değerine sahip olmalı"],
    },

    description: {
        type: String,
        maxLength: [1000, "Açıklama alanı 1000 karakteri geçemez"],
        required: [true, "Tur açıklama değerine sahip olmalı"],
    },

    imageCover: {
        type: String,
        required: [true, "Tur kağak fotğrafına sahip olmalı"],
    },
    images: {
        type: [String],
    },

    startDates: {
        type: [Date],
    },
    durationHour: { type: Number }

},
    // şema ayarları bunu yaptığımız zaman mongoose otomatik olarak kaydettiğimiz bütün verileri created, güncellediğiniz her değeri de updated değeri ekleyip onları güncelliyor
    {
        timestamps: true, //compasse eklenen createdat ve updatedat değerleri için 
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)



//! Virtual Property (sanal değerler)
// Örn1: Şuan veritbanında turların fiyatlarını ve indirim fiyatını tutuyoruz ama frontend bizden ayrıca indirimli fiyarıda istedi. Bu noktada indirimli fiyatı veritabanında tutmak gereksiz maaliyet olur. Bunun yerine cevap gönderme sırasında bu değeri hesaplyıp eklersek hem frontend'in ihtiyacını karşılamış oluruz hemde veritbanıdna gereksiz yer kaplamaz
tourSchema.virtual('discountedPrice').get(function () {
    return this.price - this.priceDiscount
})


//örn2: şuan veritabanında tur ismini tutyoruz ama ekstra olarak slug(url) istedi.yani postmande bu virtual işlemini yaptıktan sonra getalltourda istek atınca böyle "slug": "the-northern-lights", bişey göreceğiz
//the City Wanderer'ı nasıl the-city-wanderer şekline çevirebiliriz
tourSchema.virtual('slug').get(function () {
    return this.name.replaceAll(' ', '-').toLowerCase()// split ilede olurdu
})



//! Document Middleware
// Bir belgenin kaydedilme, güncelleme, silinme, okunma gibi  olaylarından önce veya sonra işlem gerçekleştirmek istiyorsak kullanırız.
// Örn1: Client'tan gelen tur verisinin veritbanına kaydilmeden önce kaç saat sürdüğünü hesplayalım.(tur kaç saat sürüyor yani)önce schema içerisine hour tanımladık sadece postta yani yeni veri kayıt işlemlerinde çalışır
//kaydedilmeden önce docüman yok alamıyoruz this ile body'e erişiyoruz
tourSchema.pre('save', function (next) {
    console.log('mw çalıştı')
    //gerekli işlemleri yap
    this.durationHour = this.duration * 24;

    //sonraki adıma devam et
    next();
});

//Örn2:
//post mw da ise kaydedildiği için documana erişebiliyoruz
tourSchema.post('updateOne', function (doc, next) {
    // kullanıcının şifresini güncelle işleminden sonra haber veya doğrulama maili gönderilir
    console.log(doc._id, 'şifreniz güncellendi maili gönderildi')

    next()
})


//! Query Middleware
//sorgulardan önce veya sonra çalıştırdığımız middlewarelaerdir
tourSchema.pre('find', function (next) {
    //premium olanlar her kullanıcıya göndermek istemediğimizden yapılan sorgularda otomatik olarak premium olmayanları filtreleyelim(eğer premium olanları getir deseydik peremium:true yazardık)
    this.find({ premium: { $ne: true } })

    next()
});

//! Aggregeta Middleware
// rapor oluşturma işlemlerinden önce veya sonra çalıştırdığımız mw.
// aggregate işleminden hemen önce bi fonksişyon çalışsın dedik
tourSchema.pre('aggregate', function (next) {
    //premium olan turları rapora dahil etmesin
    this.pipeline().unshift({ $match: { premium: { $ne: true } } })//bu fonk. aşamaları(pipeline) premium olmayalnları filtrele dizinin sona ekle

    next()

})




// şemayı kullanarak model oluştur
const Tour = mongoose.model('Tour', tourSchema)

//controllerda kullanmak için export et
module.exports = Tour;