// Sıralama, filtreleme, alan temizleme, sayfalama gibi özellikleri projede birden fazla noktada kullanmak isteyebiliriz bu durumda kod tekrarına düşmemek için bütün bu methodları bir class içerisinde tanımlayalım

//!bütün api içerisinde kullanılacak ortak özellikler
class APIFeatures {
    constructor(query, params, formattedParams) {
        this.query = query; //oluşturulan veritabanı sorgusu
        this.params = params; // api isteğinden gelen saf parametreler 
        this.formattedParams = formattedParams; //mw'den gelen başına $ işareti koyduğumuz formatlanmış parametreler(formattedQueryburada ismini değiştirdik)
    }
    //return this => classın(API Features) kendisini return et demektir
    filter() {
        //this.query clas içindeki querye erişimi sağlıyor
        this.query = this.query.find(this.formattedParams)
        return this
    }

    sort() {
        //eğer sort parametresi varsa sırala
        if (this.params.sort) {
            this.query.sort(this.params.sort.split('.').join(' '))
        } else {
            this.query.sort('-createdAt')
        }

        return this
    }

    limit() {
        //eğer limit parametresi varsa alan limitle
        if (this.params.fields) {
            // tourQuery.select('name')
            //  tourQuery.select(req.query.fields.split(',').join('')) buda olur alltakide
            this.query.select(this.params.fields.replaceAll(',', ' '))
        }

        return this
    }

    pagination() {
        // sayfalama yap
        const page = Number(this.params.page) || 1;//mevcut sayfa sayısı
        const limitCount = Number(this.params.limit) || 10; // sayfa başına eleman sayısı
        const skipCount = (page - 1) * limitCount; // mevcut sayfa için kaç eleman atlanmalı
        this.query.skip(skipCount).limit(limitCount);

        return this
    }
}

// APIFeatures.filter().sort().limit().pagination()return satırı yadığımız için böyle kullanacağız

module.exports = APIFeatures





//böyle yazarsak aşağıdaki gibi tektek kullanırız ama biz hepsini bir arada kullanabilmek adına herbir özelliğe return satırı ekledik pratik olsun diye
// class APIFeatures {
//     constructor(){}

//     filter(){}

//     sort(){}

//     limit(){}

//     pagination(){}
// }

// APIFeatures.filter()
// APIFeatures.sort()
// APIFeatures.limit()
// APIFeatures.pagination()