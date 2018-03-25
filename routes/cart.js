const express = require('express');
const router = express.Router();

const Products = require('../models/products');
const Cart = require('../models/cart');

router.get('/add-cart/:productId', (req, res) => {
    let product_id = req.params.productId;

    console.log('CART----Product Id:\t' + product_id);

    let cart = new Cart(req.session.cart ? req.session.cart : {items: {}});

    Products.findById(product_id)
        .select()
        .exec()
        .then(product => {
            if (product) {
                cart.add(product, product._id);
                req.session.cart = cart;
                console.log(req.session.cart);
                res.sendStatus(200);
            } else {
                console.log('Lol');
            }
        })
        .catch(errs => {
            throw errs;
        });

});

router.get('/', (req, res) => {

    //let cart = new Cart(req.session.cart ? req.session.cart : {items: {}});

    if (!req.session.cart) {
        res.status(201)
            .json({
                success: true,
                message: 'Empty Cart'
            });
    }

    res.status(201)
        .json({
            success: true,
            message: 'Cart Items',
            cartItems: cart.generateCartArray(),
            totalPrice: cart.totalPrice
        });

});

module.exports = router;