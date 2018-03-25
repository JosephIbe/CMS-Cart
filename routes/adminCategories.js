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
        Category.find({})
    ];

    Promise.all(queries)
        .then(resultData => {

            let categories = resultData[4];

            res.render('categories', {
                catCount: resultData[0],
                prodCount: resultData[1],
                userCount: resultData[2],
                orderCount: resultData[3],
                categories: categories
            });
        })
        .catch(errs => {
            console.error('Error:\t' + errs);
        });

});

//TODO : Pagination, Not Working Yet
router.get('/:page', (req, res) => {

    let pageItems = 10;
    let pages = req.params.page || 1;

    Category.find({})
        .skip((pageItems * pages) - pageItems)
        .limit(pageItems)
        .exec()
        .then(categories => {
            if (categories){
                Category.count()
                    .exec()
                    .then(count => {
                        console.log('Categories per Page:\t' + count);
                        res.render('categories', {
                            categories: categories,
                            currentPage: pages,
                            pages: Math.ceil(count/ pageItems)
                        });
                    })
                    .catch(errs => {
                        throw errs;
                    });
            } else {
                console.log('Nothing Found');
            }
        })
        .catch(e => {
            throw e;
        });


});

router.post('/add-categories', multipart(), (req, res) => {

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

router.get('/delete-category/:id', (req, res) => {
    let cat_id = req.params.id;

    console.log('Cat id:\t' + cat_id);

    Category.findByIdAndRemove({_id: cat_id})
        .exec()
        .then(result => {
            if (result) {
                console.log('Category Deleted');
                res.redirect('/admin/categories');
            } else {
                console.log('Could Not Delete Category');
            }
        })
        .catch(errs => {
            console.log('Error Deleting Category' + errs);
        });

});

//TODO: Edit Category
router.get('/edit-category/:id', (req, res) => {
    let category_id = req.params.id;
    console.log('Category Id:\t' + category_id);

    let queries = [
        Category.count({}),
        Products.count({}),
        Users.count({}),
        Orders.count({}),
        Category.find({}),
        Category.findOne({_id: category_id})
    ];

    Promise.all(queries)
        .then(resultData => {

            let categories = resultData[4];
            let singleCategory = resultData[5];
            console.log('Category Result for Single Item:\t' + singleCategory);

            res.render('edit_category', {
                catCount: resultData[0],
                prodCount: resultData[1],
                userCount: resultData[2],
                orderCount: resultData[3],
                categories: categories,
                singleItem: singleCategory
            });
        })
        .catch(errs => {
            console.error('Error:\t' + errs);
        });

    // Category.findOne({_id: category_id})
    //     .exec()
    //     .then(category => {
    //         if (category){
    //             res.render('');
    //         }
    //     })
    //     .catch(errs => {
    //        console.error('Error Rendering Edit Category View:\t' + errs);
    //     });


});

router.post('/edit-category/:id', (req, res) => {

});

router.post('/search-categories', (req, res) => {
   let query = req.body.search_categories;

   console.log('Body String:\t' + query);

   Category.findOne({title: query})
       .exec()
       .then(data => {
           if (data) {
               console.log('Found');
               res.render('search_cats_result', {
                   searchString: query,
                   data: data
               });
           } else {
               console.log('Nothing Found');
               res.render('search_error', {
                   searchString: query,
                   data: null
               });
           }
       })
       .catch(errs => {
          throw errs;
       });


});


module.exports = router;