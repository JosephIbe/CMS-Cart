const express = require('express');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');

const passport = require('passport');
const passportConfig = require('./config/passport')(passport);

const app = express();

const cors = require('cors');

const adminIndex = require('./routes/admin_index');
const adminProducts = require('./routes/adminProducts');
const adminUsers = require('./routes/adminUsers');
const adminOrders = require('./routes/adminOrders');
const adminCategories = require('./routes/adminCategories');

const mongoose = require('mongoose');
const config_db = require('./config/db');
const expressSession = require('express-session');
const expressValidator = require('express-validator');
const MongoStore = require('connect-mongo')(expressSession);

const port = process.env.PORT || 8009;

mongoose.connect(config_db.database);

let db = mongoose.connection;
mongoose.Promise = global.Promise;

db.on('error', (err) => {
    console.error('Error Opening DB:\t' + err);
});

db.once('open', ()=> {
    console.log('DB Connected');
});

app.use(cors());

app.use(passport.initialize());
app.use(passport.session());
app.get('*', (req, res, next) => {
   res.locals.user = req.user || null;
   res.locals.session = req.session;
   next();
});

app.use(expressSession({
    secret:'aapni-Dukan',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore(
        {
            mongooseConnection: mongoose.connection
        }
    ),
    cookie: {secure: true}
}));

app.use( express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(expressValidator({
    errorFormatter: (params, msg, value)=>{
        let namespace = params.split('.'),
            root = namespace.shift(),
            formParams = root;

        while (namespace.length){
            formParams += '[' + namespace.shift() + ']';
        }
        return {
            params: formParams,
            msg: msg,
            value: value
        }
    },
    customValidators: {
        isImage : ( (value, filename)=> {
            let extension = (path.extname(filename)).toLowerCase();
            switch (extension) {
                case '.jpg':
                    return '.jpg';
                    break;
                case '.jpeg':
                    return '.jpeg';
                    break;
                case '.png':
                    return '.png';
                    break;
                case '':
                    return '.jpg';
                    break;
                default:
                    return false;
            }
        })
    }
}));

app.locals.errors = null; // set global error variable

app.use(require('connect-flash')());
app.use((req, res, next)=>{
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// routes
app.use('/admin/home', adminIndex);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/admin/users', adminUsers);
app.use('/admin/orders', adminOrders);

app.listen(port, (err) => {
   if (err){
       console.error('Error Starting Server:\t' + err);
   }
   console.log(`Magic at ${port}`);
});
