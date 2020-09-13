var express=require("express");
var router= express.Router();
var passport= require("passport");
var User = require("../models/user");
var Hotels = require("../models/hotel");
var Comments = require("../models/comment");
var middlewareObj= require("../middleware/index.js");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);



//routes
router.get("/",function(req,res){
	res.render("landing")
});

///get checkout
router.get('/checkout', middlewareObj.isLoggedIn, (req, res) => {
    if (req.user.isPaid) {
        req.flash('success', 'Your account is already paid');
        return res.redirect('/hotels');
    }
    res.render('checkout', { amount: 20 });
});

// POST pay
router.post('/pay', middlewareObj.isLoggedIn, async (req, res) => {
    const { paymentMethodId, items, currency } = req.body;

    const amount = 2000;
  
    try {
      // Create new PaymentIntent with a PaymentMethod ID from the client.
      const intent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method: paymentMethodId,
        error_on_requires_action: true,
        confirm: true
      });
  
      console.log("💰 Payment received!");

      req.user.isPaid = true;
      await req.user.save();
      // The payment is complete and the money has been moved
      // You can add any post-payment code here (e.g. shipping, fulfillment, etc)
  
      // Send the client secret to the client to use in the demo
      res.send({ clientSecret: intent.client_secret });
    } catch (e) {
      // Handle "hard declines" e.g. insufficient funds, expired card, card authentication etc
      // See https://stripe.com/docs/declines/codes for more
      if (e.code === "authentication_required") {
        res.send({
          error:
            "This card requires authentication in order to proceeded. Please use a different card."
        });
      } else {
        res.send({ error: e.message });
      }
    }
});


//show register form
router.get("/register", function(req, res){
	res.render("register");
})

router.post("/register",function(req,res){
	// User.register(new User({username:req.body.username}),req.body.password)
	var newUser= new User({username:req.body.username, firstName: req.body.firstName, lastName:req.body.lastName, avatar:req.body.avatar, email: req.body.email});
	if(req.body.adminCode === process.env.ADMIN_CODE ){
		newUser.isAdmin=true;
	}
	User.register(newUser,req.body.password, function(err,user){
		if(err){
			console.log(err);
			req.flash("error", err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req,res,function(){
			req.flash("success", "Welcome to HotelFinder " + user.username)
			res.redirect("/hotels");
		})
	});
});

//show log in form
router.get("/login",function(req,res){
	res.render("login");
});


router.post("/login",passport.authenticate("local",{ successRedirect:"/hotels", failureRedirect:"/login", failureFlash:true}), function(req, res){
});

//logout route
router.get("/logout",function(req,res){
	req.logout();
	req.flash("success", "Logged you out!")
	res.redirect("/hotels");
});

//forgot password
router.get("/forgot",function(req,res){
	res.render("forgot");
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'rubenpuerta89@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'HotelFinder',
        subject: 'Reset password for HotelFinder',
        text: 'If you are receiving this email is because you or someone else has requested to reset your password.\n\n' +
          'You can click the following link or paste it in your browser in order to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'An e-mail has been sent to ' + user.email);
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});


router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'rubenpuerta89@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'HotelFinder',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/hotels');
  });
});


//user profile
router.get("/user/:id", function(req,res){
User.findById(req.params.id, function(err, foundUser){
	if(err || !foundUser){
		req.flash("error","Something went wrong");
		res.redirect("/");
	}else{
		Comments.find().where("author.id").equals(foundUser._id).exec(function(err,comment){
			if(err){
				req.flash("error","Something went wrong");
				res.redirect("/");
			}else{
				Hotels.find().where("author.id").equals(foundUser._id).exec(function(err,hotel){
					if(err){
					req.flash("error","Something went wrong");
					res.redirect("/");
					}else{
					res.render("users/show",{ foundUser:foundUser, comment:comment, hotel:hotel} );
					}
					
				})
		
			}
			
		})
		
	}
});
	
});

//get contact
router.get("/contact",middlewareObj.isLoggedIn, function(req,res){
	res.render("contact");
})

router.post("/contact",middlewareObj.isLoggedIn, async function(req,res){
	let {name, email, message}=req.body;
	name=req.sanitize(name);	
	email=req.sanitize(email);
	message=req.sanitize(message);

	const msg = {
  to: 'rubenpuerta89@gmail.com',
  from: "rubenpuerta89@gmail.com", // Use the email address or domain you verified above
  subject: "From HotelFinder by "+ name + " : " + email,
  text: message,
  html: message,
};
	
  try {
    await sgMail.send(msg);
    req.flash('success', 'Thank you for your email, we will get back to you shortly.');
    res.redirect('/contact');
  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body)
    }
    req.flash('error', 'Sorry, something went wrong, please contact rubenpuerta89@gmail.com');
    res.redirect('back');
  }
});



module.exports=router;