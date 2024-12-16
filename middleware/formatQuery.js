module.exports = (req, res, next) => {
    //*urlden gelen parametre >{duration:{lt:'14'}, price:{gte:'497'}}
    //*mongodbnin istediği format > {duration:{$lt:'14'}, price:{$gte:'497'}}

    //1) istekle gelen parametrelere eriş
    let queryObj = { ...req.query }

    //2) filtreleme tabi tutlmayacak olan paramtreleri (sort, fields, page, limit) query nesnesinden kaldır
    //1.yol
    // delete queryObj.limit;
    // delete queryObj.sort;
    // delete queryObj.fields;
    // delete queryObj.page;

    //2.yol
    const fields = ['sort', 'limit', 'page', 'fields']
    fields.forEach((el) => delete queryObj[el])


    //3) replace methodunu kullanabilmek için nesneyi stringe çevir
    let queryStr = JSON.stringify(queryObj)

    //3) bütün operatörlerin başına $ koy
    // bu uzun olur
    // queryStr.replace('gte', '$gte')
    // queryStr.replace('lte', '$lte')
    // queryStr.replace('le', '$le')
    // queryStr.replace('ne', '$ne')

    //kısa yolu
    queryStr = queryStr.replace(
        /\b(gt|gte|lte|lt|ne)\b/g,
        (found) => `$${found}`
    );

    //5) bu mw sonra çalışan methoda nesneyi aktar
    req.formattedQuery = JSON.parse(queryStr)

    //6) mw den sonraki method çalışsın
    next()
}

