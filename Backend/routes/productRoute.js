const express = require("express")
const sessionCheck = require("../utils/sessionCheck.js");


const products = express.Router()


products.get("/", sessionCheck, async (req, res) => {
    try {

        const db = req.db;

        db.query(`
        select p.id , p.status, p.image, p.name , p.price, c.name as category, r.rating as rating from bdhalls.product p  inner join bdhalls.rating r on p.ratingId = r.id inner join bdhalls.category c on c.id = p.categoryId; 
        select name from bdhalls.category`
            , (err, result, fields) => {
                    if (err) res.render("html/error", { error: err.message, status: err.errno })
                else {
                    const [cakes, hats, propz] = result;
                    res.render('html/products', { categoriesList: result[0], categories: result[1] })
                }
            });
    } catch (err) {
        res.render("html/error", { error: err.message, status: err.statusCode })
    }



})

module.exports = products;