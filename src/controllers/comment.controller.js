import mongoose,{isValidObjectId} from "mongoose"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const addComment = asyncHandler(async(req,res)=>{

    // Take comment from user -> req.body
    // take videoId from request -> req.params
    // get userId from user -> req.user?._id

    const {content} = req.body
    const videoId = req.params.videoId
    const userId = req.user?._id;

    if(!content || content.trim()===""){
        throw new ApiError(400,"Comment content required")
    }

    // we need to check if videoId is in a valid mongoose format or some random string    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video ID")
    }

    // check if the video exists
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"Video not found")
    }

    const comment = await Comment.create({
        content,
        video:videoId,
        owner:userId
    });

    if(!comment){
        throw new ApiError(500,"Something went wrong while adding the comment")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,comment,"Comment added successfully")
    )
})

const updateComment = asyncHandler(async(req,res)=>{

    const {commentId}=req.params
    const {content} = req.body

    if(!content || content.trim()===""){
        throw new ApiError(400,"Comment is Empty")
    }

    const updatedComment = await Comment.findOneAndUpdate(
        {
            _id:commentId,
            owner:req.user?._id
        },
        {
            $set:{
                content:content
            }
        },
        {
            new:true
        }
    )

    if(!updatedComment){
        throw new ApiError(500,"Comment content updation failed")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,updatedComment,"Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async(req,res)=>{

    const {commentId} = req.params

    const deletedComment = await Comment.findOneAndDelete(
        {
            _id:commentId,
            owner:req.user?._id
        }
    )

    if(!deletedComment){
        throw new ApiError(500,"Comment Deletion Failed")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,{},"Comment Deleted Succesfully")
    )
})

const getVideoComments = asyncHandler(async(req,res)=>{

    // step 1 -> get video ID from params
    const {videoId} = req.params
    const {page=1,limit=10} = req.query

    // we need to check if videoId is in a valid mongoose format or some random string    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video ID")
    }

    const allVideoComments = await Comment.aggregate([

        // Level 1 -> Of all the comments , we need only those comment 
        // which has videoId of the current video 
        // using $match
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        // Level 2 -> Sort all the comments as per newest to oldest 
        // using $ sort , -1 for newest , 1 for oldest
        {
            $sort:{
                createdAt: -1
            }
        },
        // level 3 -> Now we have all the comments and their owners 
        // we need owner information from UserSchema (avatar and username)
        // using $lookup
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails"
            }
        },
        // level 4 -> the lookup result comes as an array ,
        // we need to unwind it to an object $ because , ownerDetails is a field now
        {
            $unwind:"$ownerDetails"
        },
        // level 5 -> Selecting only what we need , username and avatar not directly accessible
        // hence nested in ownerDetails
        {
            $project:{
                username:"$ownerDetails.username",
                avatar:"$ownerDetails.avatar",
                content:1,
                createdAt:1
            }
        }
    ])

    return res.status(200)
    .json(
        new ApiResponse(200,allVideoComments,"Comments fetched Successfully")
    )
})

export {
    addComment
    ,updateComment
    ,deleteComment
    ,getVideoComments
}
