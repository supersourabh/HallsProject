const { response } = require("express");

var sessionCheck = (req, res, next) => {

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
        res.redirect("/user/login")
    }

}
module.exports = sessionCheck