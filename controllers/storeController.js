const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true);
        } else {
            next({message: 'That file isn\'t allowed'}, false);
        }
    }
};

exports.homePage = (req, res) => {
    res.render('index')
};

exports.addStore = (req, res) => {
    res.render('editStore', {
        title: 'Add Store'
    })
};

exports.createStore =  async (req, res) => {
    req.body.author = req.user._id;
    const store =  await (new Store(req.body)).save();
    req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.updateStore = async (req, res) => {
    // set location data to be a point
    req.body.location.type = 'Point';
    const {id} = req.params;
    const store = await Store.findOneAndUpdate({_id: id}, req.body, {
        new: true, // return new store instead of old one
        runValidators: true,

    }).exec();
    req.flash('success', `Store ${store.name} successfully updated. <a href="/stores/${store.slug}">View store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
};

exports.getStores = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * limit) - limit;
    
    const storesPromise = Store.find().skip(skip).limit(limit).sort({ created: 'desc' });
    const countPromise = Store.count();
    
    const [stores, count] = await Promise.all([storesPromise, countPromise]);
    
    const pages = Math.ceil(count / limit);
    if (!stores.length && skip) {
        req.flash('info', `Hey! You asked for a page - ${page} but it doesn't exist. So I put you on the page ${pages}`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }
    res.render('stores', {
        title: 'Stores list',
        stores, page, pages, count
    })
};

const confirmOwner = (store, user) => {
    if(!store.author.equals(user._id)) {
        throw Error('You have to own a store in order to edit it.');
    }
};

exports.editStore = async (req, res) => {
    const {id} = req.params;
    const store = await Store.findOne({_id: id});
    confirmOwner(store, req.user);
    res.render('editStore', {
        title: `Edit ${store.name}`,
        store
    })
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    // check if there is ni new file to resize
    if (!req.file) {
        next(); // skip to next middleware
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    // now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // once wi have written photo to our folder, keep going!
    next();
};

exports.getStoreBySlug = async (req, res, next) => {
    const {slug} = req.params;
    const store = await Store.findOne({slug}).populate('author reviews');
    if (!store) return next();
    res.render('store', {store, title: store.name});
};

exports.getStoresByTag = async (req, res) => {
    const {tag} = req.params;
    const tagQuery = tag || { $exists: true };
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({tags: tagQuery});
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    res.render('tag', {tags, title: 'Tags', tag, stores});
};

exports.searchStores = async (req, res) => {
    const stores = await Store
    // find stores
    .find({
        $text: {
            $search: req.query.q
        }
    }, {
        score: {
            $meta: 'textScore'
        }
    })
    // sort it
    .sort({
        score: {
            $meta: 'textScore'
        }
    })
    // limit to only 5 stores
    .limit(5);
    res.json(stores)
};

exports.mapStores = async (req, res) => {
    const {lat, lng} = req.query;
    const coordinates = [lng, lat].map(parseFloat);
    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 10000 // 10km
            }
        }
    };

    const stores = await Store.find(q).select('slug name description location photo').limit(10);

    res.json(stores);
};

exports.mapPage =  async (req, res) => {
    res.render('map', {title: 'Map'})
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(heart => heart.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User.findByIdAndUpdate(req.user._id, {
        [operator]: { hearts: req.params.id }
    }, {
        new: true
    });
    res.json(user);
};

exports.heartsPage = async (req, res) => {
    const stores = await Store.find({
        _id: { $in: req.user.hearts }
    });
    res.render('stores', { title: 'Hearted stores', stores })
};

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();
    
    res.render('topStores', {stores})
};