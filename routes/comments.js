var express=require("express");
var router= express.Router({mergeParams:true});
var Hotels= require("../models/hotel");
var Comments=require("../models/comment");
var middlewareObj= require("../middleware/index.js");


router.get("/new", middlewareObj.isLoggedIn ,function(req,res){
	Hotels.findById(req.params.id, function(err,hotel){
		if(err){
			req.flash("error", "Something went wrong")
			res.redirect("back");
		}else{
			res.render("comments/new",{hotel:hotel});
		}
	});
	
});

router.post("/",middlewareObj.isLoggedIn ,function(req,res){
	Hotels.findById(req.params.id, function(err,hotel){
		if(err){
			console.log(err);
			req.flash("error","Hotel not found")
			res.redirect("/hotels");
		}else{
			Comments.create(req.body.comment, function(err, comment){
				if(err){
					req.flash("error", "Something went wrong");
					console.log(err);
				}else{
					comment.author.id=req.user._id;
					comment.author.username=req.user.username;
					comment.hotelId=req.params.id;
					comment.hotelName=hotel.name;
					comment.save();
					hotel.comments.push(comment);
					hotel.save();
					req.flash("success", "You made a new comment");
					res.redirect("/hotels/"+hotel._id);
				}
			});

		}
});
	
});
 
router.get("/:comment_id/edit",middlewareObj.checkCommentOwnership,function(req,res){
	var hotel_id= req.params.id;
	Comments.findById(req.params.comment_id, function(err, foundComment){
		if(err){
			req.flash("error","Something went wrong")
			res.redirect("back");
		}else{
			res.render("comments/edit",{hotel_id: req.params.id, comment: foundComment });
		}
	})
	
})

router.put("/:comment_id", middlewareObj.checkCommentOwnership,function(req,res){
	Comments.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if(err){
			req.flash("error", "Something went wrong")
			res.redirect("back")
		}else{
			req.flash("success", "Comment succesfully updated")
			res.redirect("/hotels/" + req.params.id);
		}
		
	})
})

router.delete("/:comment_id",middlewareObj.checkCommentOwnership,function(req,res){
	Comments.findById(req.params.comment_id,function(err,foundComment){
		if(err){
			req.flash("error", "Something went wrong")
			res.redirect("back");
		}else{
			Hotels.findById(foundComment.hotelId, function(err, foundHotel){
				if(err){
				req.flash("error", "Something went wrong")
				res.redirect("back");
				}else{
					
					foundHotel.comments.splice(foundHotel.comments.indexOf(req.params.comment_id),1);
					foundHotel.save();
						Comments.findByIdAndRemove(req.params.comment_id, function(err){
								if(err){
									req.flash("error", "Something went wrong")
									res.redirect("back");
								}else{
									req.flash("success", "Comment succesfully deleted");
									res.redirect("/hotels/" + req.params.id);
								}

							})
				}
			});
		}
		
	})

})

module.exports=router;

