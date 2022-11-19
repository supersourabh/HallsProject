const express = require("express")
const sessionCheck = require("../utils/sessionCheck.js");


const products = express.Router()


products.get("/", sessionCheck, async (req, res) => {
    try {

        const db = req.db;

        db.query(" select * from bdhalls.product where catagory= 'cakes'; select * from bdhalls.product where catagory = 'hats'; select * from bdhalls.product where catagory = 'propz'; ", (err, result, fields) => {
            if (err) res.render("html/error", { error: err.message, status: err.errno })
            else {
                const [cakes, hats, propz] = result;
                res.render('html/products', { cakes: cakes, hats: hats, propz: propz })
            }
        });
    } catch (err) {
        res.render("html/error", { error: err.message, status: err.statusCode })
    }



})

module.exports = products;