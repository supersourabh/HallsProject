const { json } = require("body-parser");
const express = require("express");
const sessionCheck = require("../utils/sessionCheck");

const cart = express.Router()



cart.get("/", sessionCheck, (req, res) => {
    try {
        const ids = (req.query.ids).split('|')
        const categories = []
        for (let i in ids) {
            let catg = ids[i].split('_')
            categories.push({ name: catg[0], id: catg[1] })
        }

        let filterIds = []
        categories.filter(e => filterIds.push(e.id ?? null));
        let db = req.db;
        let query = `select p.id , p.name ,c.name as category , p.price , p.thumbnailUrl as image  from bdhalls.product p 
        inner join bdhalls.category c on p.categoryId = c.id where p.id in (?) order by c.name ;`;
        db.query(query, [filterIds], (err, result) => {
            if (err) res.render("html/error", { error: err.message, status: err.errno })
            else {
                let service_cost = parseFloat(process.env.SERVICE_COST);
                let tax = parseFloat((service_cost * parseFloat(process.env.TAX)) / 100);
                let price = 0;
                result.forEach(e => {
                    price += e.price
                });
                let sumTotal = price
                let itemTax = sumTotal * (15 / 100);
                tax += itemTax;
                let total = parseFloat(sumTotal + service_cost + tax);

                res.render('html/cart', {
                    sumTotal: sumTotal.toFixed(2),
                    service_cost: service_cost.toFixed(2),
                    tax: tax.toFixed(2), total: total.toFixed(2),
                    items: result, categories: categories, pids: req.query.ids
                });
            }
        })
    } catch (err) {
        res.render("html/error", { error: err.message, status: err.errno })
    }
})

module.exports = cart;