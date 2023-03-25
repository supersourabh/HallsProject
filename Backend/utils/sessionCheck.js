
var sessionCheck = (req, res, next) => {
    let path = req.originalUrl
    if (req.session.user && req.cookies.halls_user_auth) {
        next();
    } else {
        console.log({path :path});
        res.redirect("/user/login?path=" + path)
    }

}
module.exports = sessionCheck