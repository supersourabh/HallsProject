const jwt = require("jsonwebtoken")

function genToken(data) {
    return jwt.sign(data, process.env.JWT_SECRET, { algorithm: "HS384", expiresIn: '24h' });
}
function decodeToken(token) {
    return jwt.decode(token);
}

function isAuth(req, res, next) {
    try {
        let token = req.header.Authorization
    } catch (error) {
        res.redirect("/user/login")
    }
}
function setAuth(token) {
    res.setHeader("Authorization", token)
}

module.exports = { genToken, decodeToken, isAuth } 