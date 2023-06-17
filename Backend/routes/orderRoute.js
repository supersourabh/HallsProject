const express = require("express")
const { decodeToken } = require("../utils/auth")
const sessionCheck = require("../utils/sessionCheck")

const order = express.Router()


order.get("/orderDetails?", sessionCheck, async (req, res, next) => {
    try {
        let db = req.db
        const oId = req.query.orderId
        const user = decodeToken(req.session.user)
        db.query(`select o.id, o.outletId, s.date as attend_date , s.slottime , o.price, o.status , o.rzpPaymentId, o.rzpOrderId, o.selectedProductsIds ,concat(u.first_name ,' ', u.last_name)as username, o.userId
        from bdhalls.order o inner join bdhalls.slots s on o.id = s.orderId 
        inner join bdhalls.users u on o.userId = u.id where o.id = ? and (o.userId = ? or ? );`, [oId, user.id, user.admin],
            (err, result) => {
                if (err) res.render("html/error", { error: err.message, status: err.errno })
                else {
                    let order = result[0]
                    if (order) {
                        let productIdsWithCategory = order ? order.selectedProductsIds.split(",") : null;
                        let productIds = []
                        productIdsWithCategory.forEach(e => {
                            let idTemp = e.split('_')[1]
                            productIds.push(idTemp)
                        });
                        let error = ""
                        db.query(`select image, name, price from bdhalls.product where id in (?);`, [productIds], (err, products) => {
                            if (err) {
                                error = err.message;
                            }
                            else {
                                let itemTotal = 0;
                                for (let i = 0; i < products.length; i++) itemTotal += products[i].price;
                                //res.send({ order, products, itemTotal })
                                res.render("html/orderDetails", { order: order, products: products, itemTotal: itemTotal })
                            }
                        })
                    } else {
                        res.render("html/error", { error: 'Order not found', status: 404 })
                    }
                }

            })


    } catch (error) {
        res.render("html/error", { error: error.message, status: 500 })
    }
})

order.get("/od", (req, res) => {
    let data = {
        "id": "d9522260-48d9-4707-a166-529b2ad9ed07",
        "userId": "c3ee7af2-6138-49a7-b462-d5e0b228ae52",
        "outletId": "1121",
        "slot": "11:00-11:45AM",
        "price": 1036,
        "rzpPaymentId": "pay_Kcoe4RztpxrGf8",
        "rzpOrderId": "order_KcocyqHwnirZ4v",
        "productsId": "c3ee7af2-6138-49a7-b462-d5e0b228ae65+c3ee7af2-6138-49a7-b462-d5e0b228ae70+null",
        "status": "Attended",
        "timestamp": "2022-11-06T16:14:56.000Z",
        "date": "2022-11-06T16:14:56.000Z"
    }
    let products = [
        {
            "image": "https://ik.imagekit.io/bdhalls/default-image.jpg?updatedAt=1665324003777&ik-s=058c557f3ad6e697b08197bb1aa9660059ea18cc",
            "name": "cake-1",
            "price": 100.5
        },
        {
            "image": "https://ik.imagekit.io/bdhalls/default-image.jpg?updatedAt=1665324003777&ik-s=058c557f3ad6e697b08197bb1aa9660059ea18cc",
            "name": "hat-1",
            "price": 300.5
        }
    ]
    res.render("html/orderDetails", { order: data, products: products, itemTotal: 401.00 })
})


module.exports = order;