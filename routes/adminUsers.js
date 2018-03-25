const express = require('express');
const router = express.Router();

const Category = require('../models/categories');
const Products = require('../models/products');
const Users = require('../models/users');
const Orders = require('../models/orders');

router.get('/', (req, res) => {

    let queries = [
        Category.count({}),
        Products.count({}),
        Users.count({}),
        Orders.count({}),
        Category.find({}),
        Products.find({}),
        Users.find({})
    ];

    Promise.all(queries)
        .then(results => {

            let categories = results[4];
            let products = results[5];
            let users = results[6];

            res.render('users', {
                catCount: results[0],
                prodCount: results[1],
                userCount: results[2],
                orderCount: results[3],
                categories: categories,
                products: products,
                users: users
            });

        })
        .catch(errors => {
            console.error('Error Rendering View and Values:\t' + errors);
        });

});

module.exports = router;