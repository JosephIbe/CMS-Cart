const express = require('express');
const router = express.Router();

const Category = require('../models/categories');
const Products = require('../models/products');
const Users = require('../models/users');
const Orders = require('../models/orders');

const multipart = require('connect-multiparty');
const cloudinary = require('cloudinary');
const imageConfig = require('../config/cloud_img_db');

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

            res.render('index', {
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

router.post('/add-category', multipart(), (req, res) => {

    console.log(req.headers);

    let title = req.body.title;
    console.log('Category Title:\t' + title);
    let slug = title.replace(/\s+/g, '-').toLowerCase();

    let imgUrl = "";

    cloudinary.v2.uploader.upload(req.files.cat_image.path, {use_filename: true, folder: 'categoryImages' }, (err_img, resultImage) => {

        if (err_img){
            console.error('Error Uploading Image:\t' + err_img);
        }

        console.log('Product Cloud Image :\t' + resultImage.url);
        imgUrl = resultImage.url;

        Category.findOne({slug: slug})
            .exec()
            .then(cats => {
                if (cats){
                    console.log('Category Already Exists');
                    req.flash('danger', 'Category Already Exists');
                    res.render('categories', {
                        title: title,
                        slug: slug,
                        image: imgUrl
                    });
                } else {

                    let category = new Category({
                        title: title,
                        slug: slug,
                        image: imgUrl
                    });

                    category.save()
                        .then(result => {
                            if (result) {
                                console.log('Saved Category:\t' + result);
                                res.redirect('/admin/categories');
                            }
                        })
                        .catch(errors => {
                            console.error('Error Saving Category:\t' + errors);
                        });
                }
            })
            .catch(errs => {
                throw errs;
                console.error('Error Creating Category');
            });

    });

});

router.post('/add-products',multipart(), (req, res) => {

    let title = req.body.title;
    console.log('Product Title:\t' + title);

    let slug = title.replace(/\s+/g, '-').toLowerCase();
    let desc = req.body.prod_desc;
    let price = req.body.prod_price;
    let qty = req.body.prod_qty;
    let category = req.body.prod_category;
    let status = req.body.status;

    let imgUrl = "";

    cloudinary.v2.uploader.upload(req.files.prod_image.path, { use_filename: true, folder: 'productThumbs-' + slug }, (err_img, resultImage) => {
        if (err_img){
            console.error('Error Uploading Image:\t' + err_img);
        }

        console.log('Product Cloud Image :\t' + resultImage.url);
        imgUrl = resultImage.url;

        let mProduct = new Products({
            title: title,
            slug: slug,
            image: imgUrl,
            desc: desc,
            price: price,
            quantity: qty,
            category: category,
            status: status,
            rating: 0
        });

        if (mProduct == ""){
            console.log('Empty Product');
            res.status(403)
                .json({
                    success: false,
                    message: 'Enter all Fields'
                });
        } else {
            mProduct.save()
                .then(product => {
                    if (product){
                        console.log('Created Product:\t' + product);
                        res.redirect('/admin/products');
                    } else {
                        console.log('Sth Went Wrong');
                    }
                })
                .catch(errs => {
                    console.log('Error Creating Product:\t' + errs);
                    throw errs;
                });
        }

    });

});

module.exports = router;