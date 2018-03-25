const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    joining: {
        type: Date,
        default: new Date()
    }

});

module.exports = Users = mongoose.model('Users', UserSchema);