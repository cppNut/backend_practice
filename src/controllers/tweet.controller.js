import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Tweet } from "../models/tweet.model";
import { ApiResponse } from "../utils/ApiResponse";


const createTweet = asyncHandler(async(req,res)=>{

    const {content} = req.body;

    if(!content || content.trim()===""){
        throw new ApiError(400,"Tweet Content is Missing");
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner:req.user?._id
    })

    if(!tweet){
        throw new ApiError(500,"Tweet Creation Failed")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet created successfully")
    )
})

const updateTweet = asyncHandler(async(req,res)=>{
    
    const {tweetId}=req.params;
    const {content}=req.body;

    if(!content || content.trim()===""){
        throw new ApiError(400,"Invalid content / Tweet content is Empty");
    }

    const tweet = await Tweet.findOneAndUpdate(
        {
            _id:tweetId,
            owner:req.user?._id     // checking for owner being a logged in user
        }
        ,{
            $set:{
                content:content
            }
        },
        {
            new:true
        }
    );

    if(!tweet){
        throw new ApiError(500,"Tweet Updation Failed")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet Updated Successfully")
    )
})

const deleteTweet = asyncHandler(async(req,res)=>{

    const {tweetId}=req.params

    const deletedTweet = await Tweet.findOneAndDelete(
        {
            _id:tweetId,
            owner:req.user?._id
        }
    );

    if(!deletedTweet){
        throw new ApiError(400,"Tweet not found or Unauthorized")
    }

    res.status(200)
    .json(
        new ApiResponse(200,{},"Tweet Deleted SUccessfully")
    )
})

const getUserTweets = asyncHandler(async(req,res)=>{

})

export {
    createTweet
    ,updateTweet
    ,deleteTweet,
    getUserTweets
}