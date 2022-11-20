
var sessionCheck = (req, res, next) => {

    if (req.session.user && req.cookies.halls_user_auth) {
        next();
    } else {
        res.redirect("/user/login")
    }

}
module.exports = sessionCheck