const mongoose = require('mongoose')
const Tour = require('../models/tourModel.js')
const APIFeatures = require('../utils/apiFeatures.js')
const e = require('../utils/error.js')
const c = require('../utils/catchAsync.js')

//! req.query ve results:tourlength FİLTRELEME ( const tours = await Tour.find(req.query)) özelliği için yazıldı sonra sort parametresi için formatQuery oldu..

exports.getAllTours = c(async (req, res, next) => {
    //try{
    //apifeatures classından örnek al (geriye sorguyu oluşturup döndürüyor) kullanıcılar ve yorumlardada bu kısa kodları kullanabileceğiz
    const features = new APIFeatures(
        Tour.find(),
        req.query,
        req.formattedQuery
    )
        .filter()
        .limit()
        .sort()
        .pagination();

    //! bunlar düzenlenip apifeaturese aktarıldıve yukarıya yazıldı

    // //        console.log(req.query)
    // //      console.log(req.formattedQuery)

    // //!vw e taşıdık
    // // //*urlden gelen parametre >{duration:{lt:'14'}, price:{gte:'497'}}
    // // //*mongodbnin istediği format > {duration:{$lt:'14'}, price:{$gte:'497'}}

    // // //1) istekle gelen parametrelere eriş
    // // let queryObj = { ...req.query }

    // // //2) replace methodunu kullanabilmek için nesneyi stringe çevir
    // // let queryStr = JSON.stringify(queryObj)

    // // //3) bütün operatörlerin başına $ koy
    // // // bu uzun olur
    // // // queryStr.replace('gte', '$gte')
    // // // queryStr.replace('lte', '$lte')
    // // // queryStr.replace('le', '$le')
    // // // queryStr.replace('ne', '$ne')

    // // //kısa yolu
    // // queryStr = queryStr.replace(
    // //     /\b(gt|gte|lte|lt|ne)\b/g,
    // //     (found) => `$${found}`);
    // //? SOR //veri tabındaki users koleksiyonundaki verileri al //! //?



    // // console.log(req.query)
    // // console.log(queryStr)

    // //veri tabanındaki tour kolleksiyonunaki verileri al

    // //veri tabanındaki tour kolleksiyonunaki verileri al

    // const tourQuery = Tour.find(req.formattedQuery)   //veri tabanındaki tour kolleksiyonunaki verileri almak için sorgu oluştur(burada çalıştırmıyoruz)

    // //eğer sort parametresi varsa sırala
    // //?bu sorgulama esnasında (sort:ratingsAvarage,-ratingsQuantity) frontend araya virgül koyuyor ama mongodb kabuletmiyor oyuzden boşluk koy diyor siplit.join yaptık(if varsa else yoksa)
    // if (req.query.sort) {
    //     //
    //     tourQuery.sort(req.query.sort.split(',').join(''))
    // } else {
    //     tourQuery.sort('-createdAt')
    // }

    // //eğer limit parametresi varsa alan(name, price,photo) limitle
    // if (req.query.fields) {
    //     // tourQuery.select('name')
    //     //  tourQuery.select(req.query.fields.split(',').join('')) buda olur alltakide
    //     tourQuery.select(req.query.fields.replaceAll(',', ' '))
    // }

    // // sayfalama yap
    // // 0-3
    // // 3-6
    // // 6-9
    // // 9
    // // eğer sayfa sayısınıa göre veri istenir(1. sayfayı atla 2.sayfayı ver)
    // const page = Number(req.query.page) || 1;//mevcut sayfa sayısı
    // const limitCount = Number(req.query.limit) || 10; // sayfa başına eleman sayısı
    // const skipCount = (page - 1) * limitCount; // mevcut sayfa için kaç eleman atlanmalı
    // tourQuery.skip(skipCount).limit(limitCount);

    // //sorguyu çalıştır(veritabanında verileri alır)
    // const tours = await tourQuery

    const tours = await features.query; // sorguyu çalıştır

    // clienta veritabanından gelen verileri gönder
    res.json({
        message: 'getAllTours başarılı',
        results: tours.length,
        tours,
    })
    // } catch (error) {
    //     next(e(500, error.message))
    //     // res.status(500).json({ message: 'getalltours balarısız', error: error.message })
    // }
});

exports.createTour = c(async (req, res, next) => {
    //isteğin body kısmında gelen dataya eriş
    //console.log(req.body)
    //  try {
    //veri tabanına yeni turu kaydet(birden fazla yöntem var(insertone,))
    const newTour = await Tour.create(req.body)

    //clienta cevap gönder
    res.json({ text: 'createTour başarılı', tour: newTour })
    // } catch (error) {
    //     // console.log(error);
    //     next(e(400, error.message))
    //     // res.status(400).json({ text: 'createTour başarısız', error: error.message })

    // }
})

exports.getTour = c(async (req, res, next) => {
    //! idye göre aratacağız 2 yolu var findOne ve findById
    //Tour.findOne({ _id: req.params.id })//bunda filtreleme yapabiliyoruz

    // try {
    const tour = await Tour.findById(req.params.id)
    // if (!tour) {
    //     res.json({ text: 'tour bulunamadı' })
    // }mw yapacağız

    res.json({ text: 'getTour başarılı', tour })

    // } catch (error) {
    //     next(e(400, error.message))
    //     // res.status(400).json({ text: 'getTour başarısız', error: error.message })
    // }
})

exports.deleteTour = c(async (req, res, next) => {
    //  try {
    await Tour.deleteOne({ _id: req.params.id }) //herhangi bir cevap döndürmeyeceğiz sadece siliyoruz

    res.status(204).json({})

    // } catch (error) {
    //     next(e(400, error.message))
    //     //  res.status(400).json({ text: 'getDelete başarısız' })
    // }
})

exports.updateTour = c(async (req, res, next) => {
    //console.log(req.params.id)

    //? bir elemanı güncelllemek istersek birde çok yolu var ve sadece güncellenecek olan bilgiyi almak istiyorsak iki seçenek 
    //?id ye göre güncelleyeceğimiz için findbyandıd yi seçtik
    // Tour.updateOne({ _id: req.params.id }, req.body) // sadece günceller geriye veri dönüdrmez isme idye vs. göre arama yapılabilir

    // //isme idye vs. göre arama yapılabilir
    // Tour.findOneAndUpdate({ _id: req.params.id }, req.body)
    // Tour.findOneAndUpdate({ name: "Macera Adası" }, req.body)



    // try {
    //sadece idye göre günceller
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true, }); //new:true güncellenmiş yeni bilgiyi clienta göstermek için

    res.json({ text: 'updateTour başarılı', tour })

    // } catch (error) {
    //     next(e(400, error.message))
    //     //res.status(400).json({ text: 'updateTour başarısız' })
    // }


})

//istek parametrelerini frontendin oluşturması yerine bu md ile biz tanımlayoruz.
exports.aliasTopTours = async (req, res, next) => {
    req.query.sort = '-ratingsAverage,-ratingsQuantity';
    req.query['price[lte]'] = '1200';
    req.query.limit = 5;
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'

    next();
}

//rapor oluşturup göndericek (zorluğa göre gruplandıracak istatistik hesapla) (normalde compasten kopy paste yapabiliriz ama bu sefer biaz burada kendimiz yazdık)
exports.getTourStats = c(async (req, res) => {
    //  try {
    //aggeretion pipeline - raporlama adımları - veri toplama boru hattı
    const stats = await Tour.aggregate([
        //1.adım.ratingi 4 ve üzeri olan turları al
        { $match: { ratingsAverage: { $gte: 4 } } },
        // 2.adım zorluğa göre gruplandır ve ortalama değerlerimi hesapla
        {
            $group: {
                _id: "$difficulty",
                count: { $sum: 1 },
                avgRating: { $avg: "$ratingsAverage" },
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" }
            }
        },
        //3.adım gruplanan veriyi fiyata göre sırala
        {
            $sort: { avgPrice: 1 }
        },
        //4.adım sadece fiyatı 500 den büyük olanları al
        {
            $match: { avgPrice: { $gte: 500 } }
        },

    ]);
    return res.status(200).json({ message: 'rapor oluşturuldu', stats })
    // } catch (error) {
    //     //console.log(err)
    //     next(e(500, error.message))
    //     //  return res.status(500).json({ message: 'rapor oluşturulamadı' })
    // }
})

//aylık plan raporu yazıp göndericek (belirli bir yıl için o yılın herayında kaçtane tur başlayacak)
exports.getMonthlyPlan = c(async (req, res, next) => {
    // try {
    const year = Number(req.params.year)
    //   console.log(year)
    // raporu oluştur
    const stats = await Tour.aggregate([
        {
            $unwind: {
                path: "$startDates"
            }
        },
        {
            $match: {
                // compass te ISODATE var, js te yok o yüzden sildik yerine new Date yazdık
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {
                    $month: "$startDates"
                },
                count: {
                    $sum: 1
                },
                tours: {
                    $push: "$name"
                }
            }
        },
        {
            $addFields:
            /**
             * _id görünüyotdu burada frontendçi bunu anlayamaz idnin ay olduğunu o yüzden yeni alan ekledik month diye vebunu idye eşitledik.
             */
            {
                month: "$_id"
            }
        },
        {
            $project:
            /**
             * burada ay ve id aynı olduğu için artık _idye ihtiyaç yoktu ve kaldıkrı
             */
            {
                _id: 0
            }
        }, {
            $sort:
            /**
             * artan sıralaması yap
             */
            {
                month: 1
            },
        },
    ]);

    if (stats.length === 0) {
        return next(e(404, `${year} yılında herhangi bir tur başlamıyor`))
        // return res.status(404).json({  message:  })
    }

    res.status(200).json({
        message: `${year} yılı için aylık plan oluşturuldu`,
        stats,
    })
    // } catch (error) {
    //     next(e(500, `Rapor oluşturulamadı`))
    //     //  res.status(500).json({message: ` aylık plan oluşturulamadı`, error: error.message,})
    // }
})

