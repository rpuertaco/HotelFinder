var mongoose = require("mongoose");
 
var commentSchema = new mongoose.Schema({
    text: String,
    author: {
	id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	},
	username: String
	},
	hotelId:{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Hotel"
	},
	hotelName: String
});
 
module.exports = mongoose.model("Comment", commentSchema);
