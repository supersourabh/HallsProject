
const addressApis = require('express').Router()

addressApis.get('/pincode?', (req, res) => {
    let db = req.db
    db.query("select id , pincode, state , city , place from bdhalls.addressData where pincode = ?", [req.query.pincode], (err, resp) => {
        if (err) { res.send({ error: err.message, status: err.errno }) }
        else {
            res.send(resp)
        }
    })
})



module.exports = addressApis