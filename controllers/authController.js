const User = require("../models/userModel")
const jwt = require('jsonwebtoken')
const bcyrpt = require('bcrypt')
const e = require('../utils/error')
const sendMail = require("../utils/sendMail")
const crypto = require('crypto')
const c = require('../utils/catchAsync')

//! AUTH İLE İLGİLİ İŞLEMLER =============>>>>>>>>>

//?------- jwt tokeni oluşturup döndür (signup ve login kullanılacak)------->
const signToken = (user_id) => {
    return jwt.sign(
        { id: user_id },
        process.env.JWT_SECRET,//
        { expiresIn: process.env.JWT_EXP }
    );
}

//?------- jwt tokeni oluşturup clienta gönder------->
const createSendToken = (user, code, res) => {
    //tokeni oluştur(zaten yukarıda oluşturduk burada da kullancağız)
    const token = signToken(user._id)

    //çerez olarak gönderilen veriyi belirle
    res.cookie('jwt', token, {
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), //90 günlük süre
        httpOnly: true,
        //  secure: true //true olunca sadece https protokolğündeki domaindelerde seyahet eder.
    })

    //şifreyi client'a gönderilen cevaptan kaldır
    user.password = undefined;

    //client'a cevap gönder
    res.status(code).json({ message: 'oturum açıldı', token, user })

}

//? ------- Kayıt ol-----> asny olduğu için try ceatch yapıyoruz.
exports.signUp = c(async (req, res, next) => {

    // try {
    // yeni bir kullanıcı oluştur
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    })
    // jwt token oluştur(sign methodu yani imzalama)(sign iki şey ister, payload ve gizli anahter kelime)(expireIn:kullanım süresi yani 30 gün sonra tekrar sisteme giriş yapmak gerekir.
    //!bu tokeni ve re.statusu giriş yapma esnasında yani login methıodunda da kullanacağız o yuzden bu tokeni oluşturup döndüren bi fonk.yazıyoruz.
    // const token = jwt.sign(
    //     { id: newUser.id },
    //     process.env.JWT_SECRET,//
    //     { expiresIn: process.env.JWT_EXP }
    // );

    //jwt tokeni oluşturup gönder
    createSendToken(newUser, 201, res)
    // } catch (error) {
    //     // res.status(500).json({
    //     //     message: 'Üzgünüz bir sorun oluştu',
    //     //     error: error.message
    //     // }) aşağıda utilsdeki errou yazıdık
    //     next(e(500, error.message))
    // }
})

//?------- Oturum aç / Giriş Yap------->
exports.login = c(async (req, res, next) => {
    // try {
    const { email, password } = req.body;

    //1)email ve şifre geldimi
    if (!email || !password) {
        //return res.status(400).json({message:'Lütfen mail ve şifre giriniz'})
        return next(e(400, 'lütfen mail veya şifre giriniz'))
    }

    //2) clientean gelen emailde kayıtlı kullanıcı varmı kontrol et
    const user = await User.findOne({ email })

    //2.1) kayıtlı kullanıcı yoksa hata fırlat
    if (!user) {
        //  return res.status(404).json({ message: 'Girdiğiniz maile kayıtlı kullanıcı yok ' })
        return next(e(404, 'Girdiğiniz maile kayıtlı kullanıcı yok '))
    }
    //   console.log(user)
    //3) clientan gelen şifre ile veritabanında saklanan hashlenmiş ile eşleşiyormu kontrol et(compare yani karşılaştır.)
    // client tan gelen şifre =>//! console.log(password)
    // veri tabanında hashlenmiş olan şifre => //!  console.log(user.password)
    //  const isValid = await bcyrpt.compare(password, user.password) böyleydi usermodelde shema açtık 
    //!burada userschema içerisinden gelen(active, emaial vs.) methodlara biz yenisini eklemiş oluypruz.oda correctPass'dir.
    const isValid = await user.correctPass(password, user.password)

    //3.1) şifre yanlışsa hata fırlat
    //console.log(isValid)
    if (!isValid) {
        //return res.status(401).json({ message: 'Girdiğiniz şifre yanlış' })
        return next(e(403, 'Girdiğiniz şifre yanlış'))
    }

    //4) jwt tokeni oluşturup gönder
    createSendToken(user, 200, res)

    // res.status(201).json({
    //     message: 'Oturum açıldı',
    //     user,
    // }) yukarıda create sentoken fonksiyonunda bu cevabı yolladık

    // } catch (error) {
    //     //   res.status(500).json({message: 'Üzgünüz bir sorun oluştu' })
    //     next(e(403, error.message))
    // }
})

//?-------Çıkış Yap----------> asenkrıon olmadığı için fonk. böyle bırakıyoruz.
exports.logout = (req, res) => {
    res.clearCookie('jwt').status(200).json({ message: 'Oturumunuz kapatıldı' })
};


//?------- Authorization MW-------> bunu belli routeları/entpoinrleri korumak için yapıyoruz.
//! 1) clientin gönderdiği tokenin geçerliliğini doğrulayıp;
// - geçerliyse route'a erişime izin vermeli
// - geçerli değilse hata fırlat

exports.protect = async (req, res, next) => {
    //1) clienttan gelen tokeni al (çerezlerle gönderilmesi durumunda bu uygulanır)
    // console.log('ÇEREZLER', req.cookies)
    let token = req.cookies.jwt || req.headers.authorization;
    //console.log(token)
    //1.2) token header olarak geldiyse bearer kelimesinden sonrasını al
    if (token && token.startsWith('Bearer')) {
        token = token.split(' ')[1];
    }

    //1.3) token gelmediyse hata fırlat
    if (!token) {
        return next(e(403, 'Bu işlem için yetkiniz yok (jwt gönderilmedi)'))
        //  return res.status(403).json({ mesage:  }) böyleydi üsttekine çevirdik
    }

    //2) tokenin geçerliliğini doğrula (zaman aşımına uğradımı/ imza doğrumu)(jwt kütüphaneinden gelen bi methodtur verify)(decoded tokenin içindeki payload(id,expire, token skul.tarihi(iat) ve geçerlilik süresi falan)tır.hangi kullanıcı oturum açmaya çalışıyor onu görüyoruz)
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
        if (error.message === 'jwt expired') {
            return next(e(403, 'oturumunuzun süresi doldu(tekrar giriş yapın)'))
        }
        return next(e(403, 'gönderilen token geçersiz'))
    }

    // 3) token ile gelen kullanıcının hesabı duruyormu
    //console.log(decoded)
    let activeUser;

    try {
        activeUser = await User.findById(decoded.id);
    } catch (error) {
        return next(e(403, 'gönderilen token geçersiz'))
    }

    //3.1)hesap silindiyse hata gönder (!activeUser.active bu hesabın dondurulması durumunda)
    if (!activeUser) {
        return next(e(403, 'Kullanıcının hesabına erişilemiyor(tekrar kaydolun)'))
    }
    //3.2) hesap dondurulduysa hata gönder
    if (!activeUser?.active) {
        return next(e(403, 'Kullanıcının hesabı doldurulmuş'))
    }

    // 4) tokeni verdikten sonra(yani backendten clienta gönderdikten sonra) şifresini değiştirmişmi kontrol et
    if (activeUser?.passChangedAt && decoded.iat) {
        const passChangedSeconds = parseInt(activeUser.passChangedAt.getTime() / 1000)//saniye cinsinden şifresnin değiştirilme tarihi

        if (passChangedSeconds > decoded.iat) {
            return next(e(403, 'Yakın zamanda şifrenizi değiştirdiniz.Lütfen tekrar giriş yapın'))
        }
    }
    //console.log('şifre değiştirme tarihi', parseInt(activeUser.passChangedAt.getTime() / 100));//saniye cinsinen şifresnin değiştirilme tarihi
    //console.log('token verilme tarihi', decoded.iat)

    // bu mw den sonra çalışacak olan bütün mw ve methodlara aktif kullanıcı verisini gönder
    req.user = activeUser;

    next();

};

//*restricTo('admin','guide', 'lead-guied' vs) çağırdığımızda bu şekilde çağırabilmek için rest operatörü kullandık ama bu şekilde restricTo(role) şeklinde yazıp rest operatörü kullanmasaydık restcricto('admin')olarak tek bir rolü çağırabilirdik rest operatörünü kullandıkki yeri geldiğinde bir route bir iki roldeki kişi ulaşabilsin
//! 2) belirli roldeki kullanıcıların route'a erişimine izin verirken diğerlerini engelleyen mw
// bir çok parametre(admin, guide. vs..) olabileceği js kısatılmışını yazdık rest operatör ...roles dedik
exports.restricTo =
    (...roles) =>
        (req, res, next) => {
            // console.log('izin verdiğim roller', roles)
            // console.log('mevcut kullnıcının rolü', req.user.role)

            //a) istek kul.rolü izin verdiğim roller içinde yoksa hata fırlat
            if (!roles.includes(req.user.role)) {
                return next(e(403, 'Bu işlem için yetkiniz yok (rolünüz yetersiz)'))

                // return res.status(403).json({ mesage:  })
            }
            //b) kullanıcının rolü yeterliyse devam et(yani update, create vs. )
            next()

            //yanlış bi route istek atınca postmande html cevabı döndürüyor ama json döndürmeli
            // çok return edilen cevap var bunları fonk.yazıp döndürücez az kod yazmak iç.in
        }


//?---- ŞİFREMİ UNUTTUM-------->
//! Şifre Sıfırlama (KULLANICI İLE İLGİLİ İŞLEMLER) =============>>>>>>>>>
//(2 SENERYO VAR UNUTTUĞU VE HATIRLAYIP DEĞİŞTİRİDĞİ SENARYO)

//a) (Önce kullnıcıyı doğrulamak) lazım Eposta adresine şifre sıfırlama bağlantısını gönder
exports.forgotPassword = c(async (req, res, next) => {
    //1) e postaya göre kullnıcı hesabına eriş(epostasını bildiğimiz kullanıcının diğer bilgilerine erişmek için findone)
    const user = await User.findOne({ email: req.body.email })
    //2) Kullanıcı yoksa hata gönder
    if (!user) return next(e(404, 'Bu mail adresine kayıtlı kullanıcı yok'))

    //3) şifre sıfırlama tokeni oluştur
    const resetToken = user.createResetToken()

    //4) veritabanında hashlenmiş olarak sakla
    await user.save({ validateBeforeSave: false })//(saklama esnasında şifre onaylama işlemleri false olmalı)

    //5) kullanıcının mail adresine tokeni link olarak gönder(bu dosyada front endolmadığı için backend endpoint yazdık)
    // console.log(req.protocol)
    // console.log(req.headers)
    const url = `${req.protocol}://${req.headers.host}/api/users/reset-password/${resetToken}`
    await sendMail({
        email: user.email,
        subject: 'Şifre sıfırlama bağlantısı (10 dakika)',
        text: resetToken,
        html: `
        <h2>Merhaba ${user.email}</h2>
        <p><b>${user.email}</b> eposta adresine bağlı tourify hesabınız için şifre sıfırlama bağlantısı aşağıdadır </p>
        <a href='${url}'>${url}</a>
        <p>yeni şifre ile sıradaki bağlantıya <i>PATCH</i> isteği atınız</p>
        <p><b><i>Tourify Ekibi</i></b></p>
        `,
    })
    //5)clienta cevap gönder
    res.status(201).json({ message: 'e-posta gönderildi' })
})

//b) yeni belirlenen şifreyi kaydet
exports.resetPassword = c(async (req, res, next) => {
    //1) tokenden yola çıkarak kullnıcıyı bul
    const token = req.params.token;
    // console.log(token)
    // console.log(req.body.newPass)

    //2) elimizdeki normal token old. ve veritabanında hashlenmiş hali saklandığı için bunları karşılaştırabilmek adına elimizdeki tokeni hashleyip veritabanında aratıcaz
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    console.log(hashedToken);

    //3) hashlenmiş tokenla ilişkili kullanıcıyı al
    //3.1) son geçerlilik tarihi henüz dolmamış olduğunu kontrol et
    const user = await User.findOne({
        passResetToken: hashedToken,
        passResetExpires: { $gt: Date.now() },//şifre resetleme süresi şuanın değerinden büyük olmalı (geraterthan$gt) eğer büyük değilse user'i bulamam
    })
    console.log(user)
    //4) token geçersiz veya süresi dolmuşsa hata gönder
    if (!user) {
        return next(e(403, '😱Tokenin süresi dolmuş veya geçersiz'))
    }

    //5) kullanıcının bilgilerini güncelle
    user.password = req.body.newPass;
    user.passwordConfirm = req.body.newPass;
    user.passResetToken = undefined;
    user.passResetExpires = undefined;

    await user.save();

    //6)client a cevap gönder
    res.status(200).json({ message: 'şifreniz başarıyla güncellendi' })
})

//?---- ŞİFRE güncelleme (UNUTMADIM SADECE GÜNCELLEMEK İÇİN)-------->

exports.updatePassword = c(async (req, res, next) => {
    //1) kullanıcının bilgilerini al
    const user = await User.findById(req.user.id);

    //2) gelen mevcut şifre doğrumu kontrol et
    if (!(await user.correctPass(req.body.currentPass, user.password))) {
        return next(e(400, 'Girdiğiniz mevcut şifre hatalı'))
    }
    //3) doğruysa yeni şifreyi kaydet
    user.password = req.body.newPass;
    user.passwordConfirm = req.body.newPass;

    await user.save();
    //4) (opsiyonel) bilgilendirme maili gönder
    await sendMail({
        email: user.email,
        subject: "Tourify Hesabı Şifreniz Güncellendi",
        text: "Bilgilendirme Maili",
        html: `
             <h1>Hesap Bilgileriniz Güncellendi</h1>
            <p>Merhaba, ${user.name}</p>
             <p>Hesap şifrenizin başarıyla güncellendiğini bildirmek isteriz. Eğer bu değişikliği siz yapmadıysanız veya bir sorun olduğunu düşünüyorsanız, lütfen hemen bizimle iletişime geçin.</p>
             <p>Hesabınızın güvenliğini sağlamak için şu adımları izleyebilirsiniz:</p>
            <ul>
            <li>Şifrenizi değiştirin.</li>
             <li>Hesabınızda tanımlı giriş noktalarını kontrol edin.</li>
             <li>İki faktörlü kimlik doğrulamayı aktif hale getirin.</li>
            </ul>
             <p>Teşekkürler,</p>
            <p><i><b>Tourify Ekibi</b></i></p>
             `,
    });

    //5) (opsiyonel) tekrar giriş yapmaması için token oluştur
    createSendToken(user, 200, res)

})