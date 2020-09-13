require("dotenv").config();
var express = require("express");
var app= express();
var bodyParser=require("body-parser");
var mongoose =require("mongoose");
var flash =require("connect-flash");
var passport= require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
var Hotel= require("./models/hotel");
var Comment=require("./models/comment");
var User = require("./models/user");
var commentRoutes = require("./routes/comments");
var hotelRoutes=require("./routes/hotels");
var authRoutes = require("./routes/index");
const expressSanitizer = require('express-sanitizer');

//port entry
var port=process.env.PORT || 3000;
//database
var mongoDB= process.env.DATABASEURL;
mongoose.connect(mongoDB,{ useNewUrlParser: true, useUnifiedTopology: true }  );
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(expressSanitizer());

//passport configuration
app.use(require("express-session")({
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser = req.user;
	next();
});
app.use(function(req,res,next){
	res.locals.error= req.flash("error");
	res.locals.success= req.flash("success");
	next();
})

app.use(authRoutes);
app.use("/hotels",hotelRoutes);
app.use("/hotels/:id/comments",commentRoutes);


app.listen(port,function(){
	console.log("Hotel Finder has started");
});
	
	
	
	
	
	
	