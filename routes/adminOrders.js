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
        Users.find({}),
        Orders.find({})
    ];

    Promise.all(queries)
        .then(results => {

            let categories = results[4];
            let products = results[5];
            console.log('All Products:\t' + products);

            let users = results[6];

            let orders = results[7];
            console.log('All Orders:\t' + orders);

            res.render('orders', {
                catCount: results[0],
                prodCount: results[1],
                userCount: results[2],
                orderCount: results[3],
                categories: categories,
                products: products,
                users: users,
                orders: orders
            });

        })
        .catch(errors => {
            console.error('Error Rendering View and Values:\t' + errors);
        });
});

router.post('/approve-order/:orderId', (req, res) => {
    let orderId= req.params.orderId;
    console.log('Order id:\t' + orderId);

    Orders.find({_id: orderId})
        .select('_id productTitle userId')
        .exec()
        .then(order => {
            if (order){
                // get user id and check if he has order id in his orders array,
                let userId = order.userId;
                console.log('User id attached with order:\t' + userId);

                Users.find({_id: userId})
                    .select() // get other projections
                    .exec()
                    .then(user => {
                       if (user) {
                           //let phone = ;
                           // then get user phone num and send sms that order has been approved
                       }
                    })
                    .catch(err => {

                    });
            } else {
                console.log('No Such Order Found');
            }
        })
        .catch(errors => {
           console.error('Error Fetching Order:\t' + errors);
        });

});

router.post('/delete-order/:orderId', (req, res) => {

    let orderId= req.params.orderId;
    console.log('Order id:\t' + orderId);

    Orders.find({_id: orderId})
        .select('_id productTitle userId')
        .exec()
        .then(order => {
            if (order){

                // get user id and check if he has order id in his orders array, the get user phone num and send sms that order couldn't be processed

                Orders.findByIdAndRemove({_id: orderId})
                    .exec()
                    .then(result => {

                    })
                    .catch(errs => {

                    });
            } else {
                console.log('No Such Order Found');
            }
        })
        .catch(errors => {
            console.error('Error Fetching Order:\t' + errors);
        });

});

module.exports = router;