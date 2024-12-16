const { Schema, default: mongoose } = require("mongoose");
const validator = require('validator')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

// KUllanıcı şeması
const userSchema = new Schema({

    name: {
        type: String,
        required: [true, 'Kullanıcı isim değerine sahip olmalıdır'],
        minLength: [3, 'Kullanıcı ismi en az 3 karakter olmalı'],
        maxLength: [30, 'kullanıcı ismi en fazla 30 karakter olabilir.']
    },

    email: {
        type: String,
        required: [true, 'Kullanıcı email değerine sahip olmalıdır'],
        unique: [true, 'Bu eposta adresine kayıt kullanıcı zaten var'],
        validate: [validator.isEmail, 'Lütfen geçerli bir mail giriniz'],
    },

    photo: {
        type: String,
        default: 'defaultpic.webp',
    },

    password: {
        type: String,
        required: [true, 'Kullanıcı şifreye sahip olmalıdır'],
        minLength: [6, 'Şifre en az 6 karakter olmalı'],
        validate: [validator.isStrongPassword,
            'Şifreniz yeterince güçlü değil'
        ]
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Lütfen şifrenizi onaylayın'],
        validate: {
            validator: function (value) {
                return value === this.password
            },
            message: 'Onay şifreniz eşleşmiyor',
        }
    },

    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    active: {
        type: Boolean,
        default: true,
    },
    passChangedAt: Date,

    passResetToken: String,

    passResetExpires: Date,
})


//! veri tabanına kullanıcıyı kaydetmeden önce:
//* passwordconfirm alanını kaldır
//* password alanını şifreleme algoritmaları ile şifrele
//! save, kullanıcı belgesi her güncellendiğinde çalıştırıyor ne zaman kayddedilmeden önce (yenş kullanıcı oluşturunca çalışır, kullanıcı şifresini değiştirince çalışır) mesela maili değiştirincede save çalışır bu durumda hashlenmiş şifre yeniden hashlenir o zaman kontrol noktasında sıkıntı yaşanır bu yüzden if bloğu ekledik (yani save kullanıcı belgesi her güncellendiğinde çalıştır ama parola değişmediyse aşağıdaki kodlar çalışmamalı)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    //şifreyi saltla ve hashle
    this.password = await bcrypt.hash(this.password, 12);
    // console.log(saltedhash)

    //onay şifresini kaldır
    this.passwordConfirm = undefined;

    next();
})

//! veri tabanına kullanıcıyı güncellemeden önce:
//* eğer şifre değiştiyse şifre değişim tarihini güncelle
userSchema.pre('save', function (next) {
    // eğer şifre değişmediyse veya döküman yeni oluşturulduysa fonksiyonu durdur mw durdur devam et sonrakşne
    if (!this.isModified('password') || this.isNew) return next();

    // şifre değiştiyse şifre değişim tarihini güncelle
    // şifre değişiminden hemen sonra jwt tokeni oluşturduğumuz için oluşturulma tarihi çakışmasın diye 1 saniye çıkaralım
    this.passChangedAt = Date.now() - 1000;
    next();
})

//? Sadece model üzerinden erişilebilen fonksiyon (sık sık kulacağımız için yaptık)
//!burada userschema içerisinden gelen methodlara biz yenisini eklemiş oluypruz.
//normal şifre ile hashlenmiş şifreyi karşılaştırsın
userSchema.methods.correctPass = async function (pass, hashedPass) {
    //pass > Deneme#1233
    //hashedPass > $2b$12$P3YRcZv3zki7K0iUc2sibOXBLQ437EndJ0nnXmFY3TXBFR49MOKHi
    return await bcrypt.compare(pass, hashedPass);
}


// Şifre sıfırlama tokeni oluşturan fonksiyon normalde bcrypt ile token oluşturmuştuk bu sefer node.js içinden crypto dan faydalanıyoruz buradan sonra yukarıda şemaya yazıyoruz.
userSchema.methods.createResetToken = function () {
    //1) 32 byte lik rastgele bi veri oluşstur ve bunu hexadecimal(sayı ve harflerden oluşan random veri) bir diziye dönüştür
    const resetToken = crypto.randomBytes(32).toString('hex')
    //console.log(resetToken)
    //2) tokenin hashle ve veritabanına kaydet
    // bcrypt.hash(resetToken) bcrtyp ile böyle yapılıyor
    const passResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    //3) tokenin son geçerlilik tarihini veritabanına kaydet(bugünden 10dk sonrası)
    this.passResetExpires = Date.now() + 10 * 60 * 1000;
    //!  this.passResetToken = passResetToken
    //4) tokenin normal halini return et
    return resetToken;
}




const User = mongoose.model('User', userSchema);

module.exports = User;

