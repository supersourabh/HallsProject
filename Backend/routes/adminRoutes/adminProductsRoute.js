const adminProducts = require('express').Router()
const crypto = require('node:crypto')
const genUrl = require('../../utils/imageKitURLGen')

adminProducts.get("/", (req, res) => {
    let db = req.db
    let ctg = req.query.ctg

    let query = ''
    if (ctg && ctg != 'all') {
        query = `select p.id, p.name ,c.name as category , p.price , p.stock_units , p.discount , p.date as createdOn, r.rating , u.first_name , u.last_name from bdhalls.product p
        inner join bdhalls.category c on p.categoryId = c.id inner join bdhalls.rating r on p.id = r.productId
        inner join bdhalls.users u on u.id = p.creator_id where c.name = ? order by p.date desc; 
        select name from bdhalls.category;`;
    }
    else {
        query = `select  p.id, p.name ,c.name as category , p.price , p.stock_units , p.discount , p.date as createdOn, r.rating , u.first_name , u.last_name from bdhalls.product p
        inner join bdhalls.category c on p.categoryId = c.id inner join bdhalls.rating r on p.id = r.productId
        inner join bdhalls.users u on u.id = p.creator_id order by p.date desc; 
        select name from bdhalls.category;`;
    }
    db.query('select admin from bdhalls.users where id= ?', [req.query.id], (err, user) => {
        if (err) res.render("html/error", { error: err.message, status: err.errno })
        else {
            if (user.length > 0 && user[0].admin) {
                db.query(query, [ctg], (err, result) => {
                    if (err) res.render("html/error", { error: err.message, status: err.errno })
                    else {
                        res.render("html/admin/products", { products: result[0], categories: result[1] })
                    }
                })
            } else {
                res.render("html/error", { error: "You are not an ADMIN", status: 404 })
            }
        }
    })
})


adminProducts.get("/fetchOutlets", (req, res) => {
    let db = req.db
    db.query('select admin from bdhalls.users where id= ?', [req.query.id], (err, user) => {
        if (err) res.send(err)
        else {
            if (user.length > 0 && user[0].admin) {

                db.query('select id,name from bdhalls.outlets', (err, outlets) => {
                    if (err) res.send(err)
                    else {
                        res.send({ status: 200, outlets: outlets })
                    }
                })

            } else {
                res.render("html/error", { error: "You are not an ADMIN", status: 404 })
            }
        }
    })
})

adminProducts.get("/fetchcategory", (req, res) => {
    let db = req.db
    db.query('select admin from bdhalls.users where id= ?', [req.query.id], (err, user) => {
        if (err) res.send(err)
        else {
            if (user.length > 0 && user[0].admin) {

                db.query('select id , name from bdhalls.category', (err, categories) => {
                    if (err) res.send(err)
                    else {
                        res.send({ status: 200, categories: categories })
                    }
                })

            } else {
                res.render("html/error", { error: "You are not an ADMIN", status: 404 })
            }
        }
    })
})

adminProducts.post("/add", async (req, res) => {
    let db = req.db
    let imageKit = req.imageKit

    try {

        db.query('select admin from bdhalls.users where id= ? ; ', [req.query.id], async (err, user) => {
            if (err) res.send(err)
            else {
                let files = req.files
                if (user.length > 0 && user[0].admin && files) {
                    let ratingBody = {}

                    let pid = crypto.randomUUID()
                    let rid = crypto.randomUUID()

                    ratingBody['id'] = rid
                    ratingBody['productId'] = pid
                    let body = req.body
                    body['id'] = pid
                    body['creator_id'] = req.query.id
                    body['status'] = true
                    body['ratingId'] = rid

                    let uploadAction = false

                    // if (Array.isArray(files.images)) {
                    //     for (let i = 0; i < files.images.length; i++) {

                    //         await imageKit.upload({
                    //             file: files.images[i].data, //required
                    //             fileName: pid + '_halls_' + files.images[i].name,   //required
                    //             folder: '/product-images',
                    //             extensions: [
                    //                 {
                    //                     name: "google-auto-tagging",
                    //                     maxTags: 5,
                    //                     minConfidence: 95
                    //                 }
                    //             ]

                    //         }).then(response => {
                    //             uploadAction = true
                    //             console.log(response);
                    //         }).catch(error => {
                    //             console.log(error);
                    //         });
                    //     }
                    // } else {
                    await imageKit.upload({
                        file: files.images.data, //required
                        fileName: pid + '_halls_' + files.images.name,
                        folder: '/product-images', //required
                        extensions: [
                            {
                                name: "google-auto-tagging",
                                maxTags: 5,
                                minConfidence: 95
                            }
                        ]
                    }).then(response => {
                        uploadAction = true
                        body['image'] = genUrl.genUrlFromLink(response.url, imageKit)
                        body['thumbnailUrl'] = genUrl.genUrlFromLink(response.thumbnailUrl, imageKit)

                    }).catch(error => {
                        uploadAction = false
                    });




                    if (uploadAction) {

                        db.query(`insert into bdhalls.product set ? ; insert into bdhalls.rating set ?`, [body, ratingBody], (err, response) => {
                            if (err) {
                                console.log(err);
                                res.send({ status: 500, message: 'product addition failed' })
                            }
                            else {
                                res.send({ status: 200, message: 'product added successfully' })
                            }
                        })
                    } else {
                        res.send({ status: 500, message: 'product addition failed(image upload error)' })

                    }
                } else {
                    res.send({ status: 500, message: 'You are not an admin' })
                }
            }
        })
    } catch (err) {
        res.send({ status: 500, message: 'Internal server error' })
    }

})

adminProducts.get("/:id/delete/:user", (req, res) => {
    try {
        if (req.params.id != 'null' && req.params.user != 'null') {
            let db = req.db
            db.query('select admin from bdhalls.users where id= ?', [req.params.user], (err, response) => {
                if (err) res.send({ status: err.message, code: err.errno })
                else {
                    if (response.length > 0 && response[0].admin) {
                        db.query(`delete from bdhalls.product where id=?`, [req.params.id], (err, orders) => {
                            if (err) res.send({ status: err.message, code: err.errno })
                            else {
                                res.send({ status: 'success', code: 200 })
                            }
                        })
                    } else {
                        res.send({ status: 'Unauthorized', code: 404 })
                    }
                }
            })
        } else throw new Error('Something went wrong')
    } catch (err) {
        res.send({ status: err.message, code: 500 })
    }
})

module.exports = adminProducts
