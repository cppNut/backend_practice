import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadeOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async(req ,res) =>{
    // get user details from frontend
    // kon kon sa detail hai wo depends on data model of user
    // validation for fields (email , name etc) - not empty
    // check if user already exists -username + email dono se
    // check files (avatar and cover image)
    // upload them to cloudinary, avatar

    // create user object (for user as mongoDB is noSQL and we need to send data via objects)
    // create entry in DB
    // remove password and refreshtoken from response
    // check for user creation (then return res else send error)


    // step 1 (getting the data from the user , postman -> body ->rawdata ->json)
    // step 3 done in user.routes.js , by calling multer middleware
    const {fullname,email,username,password} = req.body
    console.log(req.body)
    console.log("fullname : ",fullname)
    console.log("password : ",password)

    // step 4 , checking for empty fileds (validation etc)

    // if(fullname===""){
    //     throw new ApiError(400,"Full Name is required")
    // }

    // now we can use if else for every method or 

        if(
            [fullname,email,username,password].some((field)=>
                field?.trim()==="")
        ){
            throw new ApiError(400,"All fields are required")
        }

    // step 5 -> checking if user already exists or not 

    const existedUser = User.findOne({
        $or:[{username} , {email}]      // checking for username / email if we find anything related to that user 
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // step 6 -> checking for images 
    // middleware ne body me aur fileds add kr di hai 

    const avatarLocalPath = req.files?.avatar[0]?.path      // [0] means the first property
    const coverImageLocalPath=req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    // step 7 + 8 -> upload to cloudinary (already made a util file for this , import it ) 

    const avatar = await uploadeOnCloudinary(avatarLocalPath)       // await cause time lagega 
    const coverImage = await uploadeOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    // step 9 -> Creating the user object 

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // step 11 -> checking if user is created or not  + 10 -> selecting everything except password and refreshtoken
    // by default sab selected hai , - krke kya kya nahi chaiye 

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    // returning the response 

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered Successfully")
    )
 
} )

export {registerUser}