import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadeOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs"

const generateAccessAndRefreshTokens = async(userId) => {
    
    try{

        const user = await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave: false})

        return (accessToken,refreshToken)

    }catch(error){
        throw new ApiError(500,"Something went wrong while generating access and refresh token")
    }
}

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

    // step 6 -> checking for images 
    // middleware ne body me aur fileds add kr di hai 

    const avatarLocalPath = req.files?.avatar[0]?.path      // [0] means the first property
    //const coverImageLocalPath=req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    // step 5 -> checking if user already exists or not 

    const existedUser = await User.findOne({
        $or:[{username} , {email}]      // checking for username / email if we find anything related to that user 
    })

    if(existedUser){
        if (avatarLocalPath) fs.unlinkSync(avatarLocalPath);
        if (coverImageLocalPath) fs.unlinkSync(coverImageLocalPath);

        throw new ApiError(409, "User with email or username already exists")
    }

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

const loginUser = asyncHandler(async(req,res)=>{
    // Todos
    
    // get username and password from the user (from req.body)
    // check for empty fields
    // check username/email in db, if not found then send to register user
    // if found password check , then give access token and refresh token
    // send cookies and res

    // step 1 -> getting the data from the user 
    const {email, username, password} = req.body

    if(!(username || email)){
        throw new ApiError(400,"Username or Email is required")
    }

    const user = await User.findOne({
        $or:[{username} , {email}]      // checking for username / email if we find anything related to that user 
    })

    if(!user){
        throw new ApiError(404,"User Does not exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invlid user credentials")
    }

    // making a seperate method for generating the access and refresh token so that it can be done directly

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // designing cookies

    const options = {
        httpOnly: true,
        secure: true        // why these , cause anyone can modify your cookies in the frontend
        // after these options , they can only be modified from the server 
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{user: loggedInUser,accessToken,refreshToken}, "User logged in successfully")
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
    
    //Todo

    // when user logs out , cookies clear krni padegi
    // refresh token bhi hatana padega 

    // but we dont have access to user , so we made auth middleware and found User there via the data stored in cookies

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },{
            new:true
        }
    )

    const options = {
        httpOnly: true,
        secure: true        // why these , cause anyone can modify your cookies in the frontend
        // after these options , they can only be modified from the server 
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out"))

})

export {registerUser,loginUser,logoutUser}