var mongoose = require("mongoose");
 
var hotelSchema = new mongoose.Schema({
   	name: String,
	price: String,
   	image: String,
	imageId:String,
  	description: String,
	place:String,
	location:String,
	author:{
		id:{
			type:mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});
 
module.exports = mongoose.model("Hotel", hotelSchema);