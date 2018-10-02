const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name!'
    },
    description: {
        type: String,
        trim: true
    },
    slug: String,
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You have to supply coordinates!'
        }],
        address: {
            type: String,
            required: 'You have to supply address!'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Define our indexes
storeSchema.index({
    name: 'text',
    description: 'text'
});


storeSchema.index({
    location: '2dsphere'
});


storeSchema.pre('save', async function (next) {
    if (!this.isModified('name')) {
        next();  // skip it
        return; // stop this function from running
    }
    this.slug = slug(this.name);
    // find other stores with equal slugs
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storesWithSlugs = await this.constructor.find({ slug: slugRegEx });
    if (storesWithSlugs.length) {
        this.slug = `${slug(this.slug)}-${storesWithSlugs.length + 1}`
    }
    next();
});

function autopopulate(next) {
    this.populate('reviews');
    next();
}
storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

storeSchema.statics.getTagsList = function () {
    return this.aggregate([
		{$unwind: '$tags'},
		{$group: {_id: '$tags', count: {$sum: 1}}}
	]).cursor({batchSize: 1000}).exec().toArray();
};

// get top stores
storeSchema.statics.getTopStores = function () {
    return this.aggregate([
        // lookup stores and populate their review id's
        {
            $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'store',
                as: 'reviews'
            }
        },
        // filter for 2 or more reviews
        {
			$match: {"reviews.1": {$exists: true}}
        },
        // add the average reviews field (if mongodb 3.4 change to $addField without duplicate old fields)
        {
            $project: {
                averageRating: {
                    $avg: '$reviews.rating'
                },
                photo: '$$ROOT.photo',
                name: '$$ROOT.name',
                reviews: '$$ROOT.reviews',
                slug: '$$ROOT.slug'
            }
        },
        // sort it by new averageRating field
        {
            $sort: { averageRating: -1}
        },
        { $limit: 10 }
    ]).cursor({batchSize: 1000}).exec().toArray();
};

// find reviews where stores _id === reviews store property
storeSchema.virtual('reviews', {
    ref: 'Review', // what model to link?
    localField: '_id', // which field on the store?
    foreignField: 'store' // which field on the review?
});

storeSchema.virtual('messages', {
    ref: 'Message',
    localField: '_id',
    foreignField: 'store'
});

module.exports = mongoose.model('Store', storeSchema);