import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"  // for encryption of data
import bcrypt from "bcrypt"     // for hasing of the data

const userSchema=new Schema({

    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },

    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },

    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },

    avatar:{
        type:String,    // URL of the avatar uploaded on a CDC (Cloudnary)
        required:true
    },

    coverImage:{
        type:String,
    },

    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],

    password:{
        type:String,
        required:[true,'Password is required']
    },

    refreshToken:{
        type:String
    }

},
{
    timestamps: true
}
)

// pre hook , save krne se pehle , using async cause it takes time , and no call back function cause we need reference of this , callback wont have this 
// bcrypt.hash takes 2 parameter (password and no of rounds)

userSchema.pre("save", async function (next){

    // this hook here now has a probelm , it will update the password everytime there is a change (in any other field as well)
    // we will use a if condition to check if the field is modified , and do as per that

    if(!this.isModified("password")) return next();

    this.password=bcrypt.hash(this.password,10)
    next()
})

// checking if the password that user sent is matching with the hashed password

userSchema.methods.isPasswordCorrect = async function
(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
    
    jwt.sign(
        {
            _id: this._id,
            email:this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken=function(){
    
    jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )

}

export const User=mongoose.model("User",userSchema);


// JWT is a bearer token , ie , ye token jiske bhi pass h usko mai data bhej dunga (like a secret key/code)
// Access token DB me sort nahi hoga , Refresh token hoga 
// Access token ki expiry is faster than refresh token
// Refresh token and access token are made in the same way , but since refresh token refresh hote rehta hai , we less info in it (ie only the ID)