const cloudinary = require('cloudinary');
const cloud_db = cloudinary.config({
    cloud_name: 'aapni-dukan',
    api_key: '372136583875152',
    api_secret: 'ZyvzWfOdTcHzl1v8Wy7_6OWG6HU'
});

module.exports = cloud_db;