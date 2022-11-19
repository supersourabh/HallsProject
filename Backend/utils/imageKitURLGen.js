
function genURL(name, path, imageKit) {

    var imgUrl = imageKit.url({
        path: "/" + path + "/" + name,
        urlEndpoint: process.env.URL_END_PRODUCT_IMG,
        transformation: [{
            width: "300",
            height: "300",
        }],
        signed: true
    })
    return imgUrl;
}
function genUrlFromLink(url , imageKit) {

    var imgUrl = imageKit.url({
        src: url,
        transformation: [{
            width: "300",
            height: "300",
        }],
        signed: true
    })
    return imgUrl;
}

module.exports = { genURL, genUrlFromLink };
