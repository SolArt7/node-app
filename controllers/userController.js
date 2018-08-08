const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', { title: 'Login form' });
};

exports.registerForm = (req, res) => {
    res.render('register', { title: 'Register form' })
};

exports.validateRegister = (req, res, next) => {
    const { password } = req.body;
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply a name').notEmpty();
    req.checkBody('email', 'That email is not valid!').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password can not be blank!').notEmpty();
    req.checkBody('confirm-password', 'Confirmed password can not be blank!').notEmpty();
    req.checkBody('confirm-password', 'Your password do not match').equals(password);

    const errors = req.validationErrors();
    if (errors) {
        req.flash('error', errors.map(error => error.msg));
        res.render('register', { title: "Register", body: req.body, flashes: req.flash() });
        return;
    }
    next(); // there were no errors
};

exports.register = async (req, res, next) => {
    const { email, name, password } = req.body;
    const user = new User({ email, name });
    const register = promisify(User.register, User);
    await register(user, password);
    next(); // pass to authController.login
};

exports.account = (req, res) => {
    res.render('account', { title: 'Edit your account' });
};

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        emaii: req.body.email
    };
    await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates },
        { new: true, runValidators: true, context: 'query' }
    );
    req.flash('success', 'Successfully edited');
    res.redirect('back');
};