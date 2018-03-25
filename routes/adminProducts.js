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

            res.render('products', {
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

router.get('/categories', (req, res) => {
    res.render('categories');
});

router.post('/search-products', (req, res) => {

   let searchQuery = req.body.search_products;
   console.log('SEARCH PRODUCTS-----Query String:\t' + searchQuery);

   let regEx = new RegExp(searchQuery, 'i');

   Products.find({'$or': [{'title': regEx}]})
       .exec()
       .then(result => {
           if (result){
               console.log(result);

               res.status(200).render('search_prods_result', {
                   searchString: searchQuery,
                   result: result
               });
           } else {
               console.log('Try a less broader search');
           }
       })
       .catch(errs => {
           console.error('Error Searching Products:\t' + errs);
       });


});

router.post('/add-category', multipart(), (req, res) => {

    console.log(req.headers);

    let title = req.body.title;
    console.log('Category Title:\t' + title);
    let slug = title.replace(/\s+/g, '-').toLowerCase();

    let imgUrl = "";

    cloudinary.v2.uploader.upload(req.files.cat_image.path, {
        use_filename: true,
        folder: 'categoryImages'
    }, (err_img, resultImage) => {

        if (err_img) {
            console.error('Error Uploading Image:\t' + err_img);
        }

        console.log('Product Cloud Image :\t' + resultImage.url);
        imgUrl = resultImage.url;

        Category.findOne({slug: slug})
            .exec()
            .then(cats => {
                if (cats) {
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

router.post('/add-products', multipart(), (req, res) => {

    let title = req.body.title;
    console.log('Product Title:\t' + title);

    let slug = title.replace(/\s+/g, '-').toLowerCase();
    let desc = req.body.prod_desc;
    let price = req.body.prod_price;
    let qty = req.body.prod_qty;
    let category = req.body.prod_category;
    let status = req.body.status;

    let imgUrl = "";

    cloudinary.v2.uploader.upload(req.files.prod_image.path, {
        use_filename: true,
        folder: 'productThumbs-' + slug
    }, (err_img, resultImage) => {
        if (err_img) {
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

        if (mProduct == "") {
            console.log('Empty Product');
            res.status(403)
                .json({
                    success: false,
                    message: 'Enter all Fields'
                });
        } else {
            mProduct.save()
                .then(product => {
                    if (product) {
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

router.get('/edit-product/:id', (req, res) => {
    let product_id = req.params.id;
    console.log(`Product Id:\t` + product_id);

    Category.find({})
        .exec()
        .then(categories => {
            if (categories) {
                Products.findOne({_id: product_id})
                    .exec()
                    .then(result => {
                        if (result) {

                            let galleryImages = null;

                            console.log('Edit Product Details:\t' + result);
                            res.render('edit_product', {
                                id: result._id,
                                title: result.title,
                                slug: result.slug,
                                image: result.image,
                                desc: result.desc,
                                price: result.price,
                                quantity: result.quantity,
                                category: result.category,
                                categories: categories,
                                galleryImages: galleryImages
                            });
                        } else {
                            console.log('No Product');
                        }
                    })
                    .catch(errs => {
                        console.error('Error Finding Product:\t' + errs);
                        throw errs;
                    });
            } else {
                console.log('Nothing Found');
            }
        })
        .catch(errors => {
            console.error('Error Getting Categories:\t' + errors);
        })

});

router.post('/edit-product/:id', multipart(), (req, res) => {

    let product_id = req.params.id;
    console.log('Prod Id:\t' + product_id);

    let title = req.body.prod_title;
    console.log('Prod Title:\t' + title);

    let slug = title.replace(/\s+/g, '-').toLowerCase();
    let desc = req.body.prod_desc;
    let price = req.body.prod_price;
    let quantity = req.body.prod_qty;
    let status = req.body.prod_status;
    let category = req.body.prod_category;

    Products.findOne({slug: slug, _id: {'$ne': product_id}})
        .exec()
        .then(product => {
            if (product) {
                console.log('Product Exists');
            } else {
                Products.findById({_id: product_id})
                    .exec()
                    .then(prod => {
                        if (prod) {

                            let slug = prod.slug;
                            console.log('Product Slug:\t' + slug);

                            let editImgUrl = "";

                            if (prod.image != "http://res.cloudinary.com/aapni-dukan/image/upload/v1521246069/noimage.png") {
                                try {
                                    cloudinary.v2.uploader.destroy(prod.image, (errs, del_result) => {
                                        if (!errs) {
                                            console.log('Delete Result:\t' + del_result);
                                        }
                                    });
                                } catch (err) {
                                    console.error('Error Deleting Image:\t' + err);
                                }
                            }

                            console.log('Image Path:\t' + req.files.product_img.path);

                            cloudinary.v2.uploader.upload(req.files.product_img.path, {use_filename: true, folder: 'productImages' + slug}, (err_img, resultImg) => {
                                if (err_img){
                                    console.error('Error Uploading Image:\t' + err_img);
                                }

                                console.log('Product Cloud Image :\t' + resultImg.url);
                                editImgUrl = resultImg.url;

                                prod.title = title;
                                prod.slug = slug;
                                prod.image = editImgUrl;
                                prod.desc = desc;
                                prod.price = price;
                                prod.quantity = quantity;
                                prod.status = status;
                                prod.category = category;

                                prod.save()
                                    .then(result => {
                                        if (result){
                                            console.log('Product Edited and Saved:\t' + JSON.stringify(result));
                                            res.redirect('/admin/products');
                                        }
                                    })
                                    .catch(e => {
                                        console.error('Error Saving Edits:\t' + e);
                                    });

                            });

                        } else {
                            console.log('No Such Product Found');
                        }
                    })
                    .catch(errs => {
                        console.error('Error Editing Product:\t' + errs);
                        throw errs;
                    });
            }
        })

});

router.get('/product-details/:productId', (req, res) => {
    let prod_id = req.params.productId;
    console.log('Product Id:\t' + prod_id);

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

            Products.findById({_id: prod_id})
                .exec()
                .then(product => {
                    if (product) {
                        res.render('product_details', {

                            // for side menu
                            catCount: results[0],
                            prodCount: results[1],
                            userCount: results[2],
                            orderCount: results[3],
                            categories: categories,

                            // for product view

                            id: product._id,
                            title: product.title,
                            slug: product.slug,
                            image: product.image,
                            desc: product.desc,
                            category: product.category,
                            price: product.price,
                            quantity: product.quantity,
                            status: product.status,
                            galleryImages: product.galleryImages
                        });
                    } else {
                        console.log('Product May Have Been Deleted');
                    }
                })
                .catch(errs => {
                    console.error('Product Not Found:\t' + errs);
                });

        })
        .catch(errors => {
            console.error('Error Rendering View and Values:\t' + errors);
        });

});

router.post('/product-gallery/:productId', (req, res) => {

    let prod_id = req.params.productId;
    Products.findOne({_id: prod_id})
        .exec()
        .then(prod => {
            if (prod) {
                let prod_slug = prod.slug;
                console.log('Found Product with Title:\t' + prod_slug);

                let imgUrl = "";

                cloudinary.v2.uploader.upload(req.files.gallery_images.path, {
                    use_filename: true,
                    folder: 'galleryImages' + prod_slug
                }, (errImg, resultImage) => {
                    if (errImg) {
                        console.log('Error Uploading Gallery:\t' + errImg);
                    }

                    imgUrl = resultImage.uri;
                    console.log('Gallery URL:\t' + imgUrl);

                    res.status(201)
                        .json({
                            success: true,
                            message: 'Gallery Uploaded'
                        });

                });


            } else {
                console.error('No Such Product Found');
            }
        })
        .catch(errs => {
            console.error('No Such Product Exists:\t' + errs);
        });

});

router.get('/delete-product/:productId', (req, res) => {
    let product_id = req.params.productId;
    console.log('DEL:- Product Id:\t' + product_id);

    Products.findByIdAndRemove({_id: product_id})
        .exec()
        .then(result => {
            if (result) {
                console.log('Product Deleted');
                res.redirect('back');
                res.redirect('/admin/products');
            }
        })
        .catch(errs => {
            console.error('Error Deleting Product:\t' + errs);
            throw errs;
        })

});

module.exports = router;