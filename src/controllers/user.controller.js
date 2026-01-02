import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadeOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import fs from "fs"
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId) => {
    
    try{

        const user = await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}

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
 
})

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

const refreshAccessToken = asyncHandler(async(req,res)=>{

    // hum cookies se refresh token access kr sakte hai 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request")
    }

    try {
        const decodedRefreshToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedRefreshToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options={
            httpOnly: true,
            secure: true
        }
    
        const {newAccessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",newAccessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {newAccessToken,newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Access Token")
    }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{

    // get old and new password from user
    const {oldPassword,newPassword}=req.body

    // if change krna hai that means user is logged in
    // hence hum req.user se(middleware) id leke user find kr sakte hai 
    const user = await User.findById(req.user?._id)
    
    // checking if the old password is correct for the user
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{

    return res.status(200)
    .json(200,req.user,"Current User returned Successfully")

})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    
    const {fullname,email} = req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar=await uploadeOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image is missing")
    }

    const coverImage = await uploadeOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200,user,"CoverImage Updated Successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{

    const {username}=req.params

    if(!username){
        throw new ApiError(400,"Username is Missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },// stage 1 (finding the specific user in the Users collection)
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },//stage 2 (join getting the subscribers of X)
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },//stage 3 (join krke getting who X follow )
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },//stage 4 (This stage turns those lists into simple numbers and a "Yes/No" answer.)
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }//stage 5 (Everything else: Automatically discarded. This keeps your API response fast and secure)
    ])

    console.log("All the data of the channel user: \n",channel)

    if(!channel?.length){
        throw new ApiError(404,"Channel does not exists")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )

})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },//step 1
        {
            $lookup:{
                from: "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }//step 2
    ])

    return res.status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"Watch history fetched")
    )

})

export {registerUser
    ,loginUser
    ,logoutUser
    ,refreshAccessToken
    ,changeCurrentPassword
    ,getCurrentUser
    ,updateAccountDetails
    ,updateUserAvatar
    ,updateUserCoverImage
    ,getUserChannelProfile
    ,getWatchHistory
}