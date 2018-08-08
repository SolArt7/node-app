const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
	failureRedirect: '/login',
	failureFlash: 'Login failed!',
	successRedirect: '/',
	successFlash: 'You logged in!'
});


exports.logout = (req, res) => {
	req.logout();
	req.flash('success', 'You are now logged out!');
	res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
	if (!req.isAuthenticated()) {
		req.flash('error', 'Ooops, you must be logged in to do that!');
		res.redirect('/login');
		return;
	}
	next(); // pass user next, user logged in
};

exports.forgot = async (req, res) => {
	const {email} = req.body;
	// 1. See if that user exists
	const user = await User.findOne({email});
	if (!user) {
		// TODO security issues with that message
		req.flash('error', 'No account with that email exists');
		return res.redirect('/login');
	}
	// 2. Set reset token and expire date
	user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
	user.resetPasswordExpires = Date.now() + (1000 * 60 * 60); // 1 hour from now
	await user.save();
	// 3. Send email with the token
	const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
	await mail.send({
		user,
		subject: 'Password reset',
		resetUrl,
		filename: 'password-reset'
	});
	req.flash('success', `You have been emailed a password email link.`);
	// 4. Redirect to login page after token is set
	res.redirect('/login');
};

exports.reset = async (req, res) => {
	const {token} = req.params;
	const user = await User.findOne({
		resetPasswordToken: token,
		resetPasswordExpires: {$gt: Date.now()}
	});
	if (!user) {
		req.flash('error', 'Reset password token is invalid or has expired');
		return res.redirect('/login');
	}
	// if there is a user, show the reset password form
	res.render('reset', {title: 'Reset password'});
};

exports.confirmedPasswords = (req, res, next) => {
	if (req.body.password === req.body['confirm-password']) {
		return next(); // keep it going
	}
	req.flash('error', 'Passwords do not match!!');
	res.redirect('back');
};

exports.update = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: {$gt: Date.now()}
	});
	if (!user) {
		req.flash('error', 'Reset password token is invalid or has expired');
		return res.redirect('/login');
	}
	const setPassword = promisify(user.setPassword, user);
	await setPassword(req.body.password);
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	const updatedUser = await user.save();
	await req.login(updatedUser);
	req.flash('success', 'Password successfully changed! You are now logged in');
	res.redirect('/');
};