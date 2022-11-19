function genToken(data) {
    return jwt.sign(data, process.env.JWT_SECRET, { algorithm: "HS384", expiresIn: '24h' });
}
function isAuth(req, res, next) {
    try {
        let token = req.header.Authorization
    } catch (error) {
        res.redirect("/user/login")
    }
}
function setAuth(token)
{
    res.setHeader("Authorization",token)
}

module.exports = { genToken, isAuth } 