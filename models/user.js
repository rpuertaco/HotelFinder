var mongoose=require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema =  new mongoose.Schema({
	username: {type:String, unique:true, required:true},
	password: String,
	avatar:String,
	firstName:String,
	lastName:String,
	email: {type:String, required:true, unique:true},
	resetPasswordToken:String,
	resetPasswordExpires:Date,
	isAdmin: {type: Boolean, default: false },
	isPaid: {type:Boolean, default: false}
});

UserSchema.plugin(passportLocalMongoose);

module.exports= mongoose.model("user", UserSchema);