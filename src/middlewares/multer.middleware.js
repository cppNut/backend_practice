import multer from "multer"

const storage=multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./public/temp")
    },
    filename:function(req,file,cb){
        cb(null,file.originalname)
    }
})

export const upload = multer({storage}) 

/*
yaha upar we are taking originalfile name 
but same name ki 5 file bhi aa sakti hai , so we can add some suffix/prefix as per that 
but here we can use since ye file hamare pass bhot kam time k liye rahegi 
as it would be uploaded on cloudinary and deleted from here
*/

