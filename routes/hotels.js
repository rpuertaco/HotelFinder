var express=require("express");
var router= express.Router();
var Hotels= require("../models/hotel");
var Comments=require("../models/comment");
var middlewareObj= require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload =multer({ storage: storage, fileFilter: imageFilter})


var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dwrqjknus', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//index
router.get("/",function(req,res){
	
	if(req.query.paid){
		res.locals.success = "Payment succedded, Welcome to HotelFinder"
	}
if(req.query.search){
	const regex= new RegExp(escapeRegex(req.query.search), "gi") ;
	
	Hotels.find({name:regex},function(err,hotels){
		if(err){
			console.log(err);
		}
		else{
			var noMatch;
			if(hotels.length<1){
				var noMatch="We did not found any hotel that match with " + req.query.search + " but here are all our hotels: ";
					Hotels.find({},function(err,allHotels){
					if(err){
						console.log(err);
					}
					else{
						res.render("hotels/index",{hotels:allHotels, noMatch: noMatch});
					}
				});	
			}else{
				var noMatch =" All hotels that matches with :"+ req.query.search;
				
				res.render("hotels/index",{hotels:hotels, noMatch:noMatch});	
			}
		
		}
	});	
	
}else{
	var noMatch;
	Hotels.find({},function(err,hotels){
		if(err){
			console.log(err);
		}
		else{
			res.render("hotels/index",{hotels:hotels, noMatch:noMatch});
		}
	});	
}


});

router.get("/:id/edit",middlewareObj.checkHotelOwnership, function(req,res){
		Hotels.findById( req.params.id,function(err, foundHotel){
			if(err){
				req.flash("error", "Hotel not found");
				res.redirect("/hotels");
			}else{
				res.render("hotels/edit",{hotel:foundHotel});
			}
		})	

})

router.put("/:id",middlewareObj.checkHotelOwnership,upload.single('image'), function(req,res){
 Hotels.findById(req.params.id, function(err, hotel){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
        	cloudinary.uploader.destroy(hotel.imageId);
			cloudinary.v2.uploader.upload(req.file.path, function(err, result){
				  if(err) {
					console.log(err)
					req.flash('error', err.message);
					return res.redirect('back');
				  }
				  req.body.image = result.secure_url;
				  req.body.imageId = result.public_id;
				hotel.image= req.body.image;
				hotel.imageId= req.body.imageId;
				hotel.save();
			});

            }
            hotel.name = req.body.name;
            hotel.description = req.body.description;
			hotel.price= req.body.price;
			hotel.place=req.body.place;
			hotel.location= req.body.location;
            hotel.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/hotels/" + hotel._id);
        }
    });
});

//new
router.get("/new", middlewareObj.isLoggedIn, function(req,res){
	res.render("hotels/new")
});

//create
router.post("/", middlewareObj.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
		console.log(err)
        req.flash('error', err.message);
        return res.redirect('back');
      }
      req.body.image = result.secure_url;
      req.body.imageId = result.public_id;

var name= req.body.name;
	var image=req.body.image;
	var imageId= req.body.imageId;
	var price= req.body.price;
	var description=req.body.description;
	var location= req.body.location;
	var place= req.body.place;
	var author = { 
		id: req.user._id,
		username:req.user.username
	}
	var newHotel= {name:name, image: image, imageId:imageId, description:description, author:author, price:price, place:place, location:location};
	
  Hotels.create(newHotel,function(err,newlyCreated){
   		if(err){
			req.flash("error", "Something went wrong")
			res.redirect("/hotels");
			console.log(err);
		}
		else{
			res.redirect("/hotels");
		}
  });
});

});

//show route
router.get("/:id", function(req, res){
    Hotels.findById(req.params.id).populate("comments").exec(function(err, foundHotel){
        if(err){
            console.log(err);
        } else {
            res.render("hotels/show", {hotel: foundHotel});
        }
    });
});

router.delete("/:id",middlewareObj.checkHotelOwnership,function(req,res){
	Hotels.findById(req.params.id, function(err,foundHotel){
		if(err){
			console.log(err);
			
		}else{
			cloudinary.uploader.destroy(foundHotel.imageId);
			foundHotel.comments.forEach(function(deleteComment){
				Comments.findByIdAndRemove(deleteComment, function(err){
					if(err){
						console.log(err)
					}else{
						console.log("comments Deleted");
					}
				})
			})
		}
	})
	Hotels.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/hotels");
		}else{
			res.redirect("/hotels");
		}
	});
})


function escapeRegex(text){
	
	return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}


module.exports=router;