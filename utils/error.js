// aldığı statuscode ve message parametrelerine bağlı hata üretsin
const error = (statusCode, message) => {
    //bir error nesnesi oluştur
    const err = new Error(message);

    //hata nesnesini güncelle
    err.statusCode = statusCode;

    // hata nesnesini döndür
    return err;
}
module.exports = error;

//! bu sayfaya app.js ten geldik