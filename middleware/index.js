var middlewareObj={};
var Comments= require("../models/comment.js");
var Hotels= require("../models/hotel.js");

middlewareObj.checkHotelOwnership= function(req, res, next){
		if(req.isAuthenticated()){
		Hotels.findById( req.params.id, function(err, foundHotel){
			if(err){
				req.flash("error", "Hotel not found")
				res.redirect("back");
			}else{
								
				  if (!foundHotel) {
                    req.flash("error", "Hotel not found.");
                    return res.redirect("back");
                }

				if(foundHotel.author.id.equals(req.user._id)||req.user.isAdmin){
					next();					
				}else{
					req.flash("error","You don't have permission to do that");
					res.redirect("back");
				}
			
			}
		})
	}else{
		req.flash("error", "You need to be logged in");
		res.redirect("back");
	}
	
}

middlewareObj.checkCommentOwnership = function(req, res, next){
		if(req.isAuthenticated()){
		Comments.findById( req.params.comment_id, function(err, foundComment){
			if(err){
				req.flash("error", "Comment not found");
				res.redirect("back");
			}else{
				
				 if (!foundComment) {
                    req.flash("error", "Item not found.");
                    return res.redirect("back");
                }

				if(foundComment.author.id.equals(req.user._id)||req.user.isAdmin){
					next();					
				}else{
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			
			}
		})
	}else{
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
	
}

middlewareObj.isLoggedIn = function(req,res,next){
				if(req.isAuthenticated()){
					return next();
				}
				req.flash("error", "You need to be logged in to do that");
				res.redirect("/login");
			};



module.exports=middlewareObj;



