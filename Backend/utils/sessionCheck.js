
var sessionCheck = (req, res, next) => {
    let path = req.originalUrl
    if (req.session.user && req.cookies.halls_user_auth) {
    var id = req.session.user
        // req.db.query(`select * from bdhalls.users where id ='${id}';`, (err, response) => {
        //     if (err) res.render("html/error", { error: err.message, status: err.errno })
        //     else if (response.length == 0) {
        //         res.redirect("/user/signup")
        //     } else {
        //         next();
        //     }
        // })
     next()
    } else {
        console.log({path :path});
        res.redirect("/user/login?path=" + path)
    }

}
module.exports = sessionCheck