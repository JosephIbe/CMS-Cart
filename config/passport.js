const LocalStrategy = require('passport-local').Strategy;
const AdminUser = require('../models/adminUserModel');
const bcrypt = require('bcryptjs');
const config = require('../config/db');

module.exports = ( (passport) => {
    passport.use(new LocalStrategy((email, password, done) => {
        AdminUser.findOne({email: email})
            .exec()
            .then(user => {
               if(!user){
                   return done(null, false, {message: 'No Such User with Email Exists'});
               } else {
                   bcrypt.compare(password, user.password, (err, match) => {
                       if(err){
                           throw err;
                       }

                       if (match){
                           return done(null, user, {message: 'User Matched'});
                       } else {
                           return done(null, false, {message: 'Passwords Don\'t Match'});
                       }
                   });

                   // passport.serializeUser((user, done) => {
                   //     done(null, user.id);
                   // });
                   //
                   // passport.deserializeUser((id, done) => {
                   //     AdminUser.findById({_id: id})
                   //         .exec()
                   //         .then(user => {
                   //             done(null, user);
                   //         })
                   //         .catch(err => {
                   //             throw err;
                   //         })
                   // });

               }
            })
            .catch(errs => {
                throw errs;
            });
    }));
});