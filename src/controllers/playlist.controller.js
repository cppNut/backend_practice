import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const createPlaylist = asyncHandler(async(req,res)=>{

    const {name, description} = req.body

    if(!name || name.trim()===""){
        throw new ApiError(400,"Name Field is Empty")
    }

    const playlist = await Playlist.create({
        name : name,
        description : description?description:"",
        owner:req.user?._id
    })

    if(!playlist){
        throw new ApiError(500,"Playlist creation Failed")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist created Successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async(req,res)=>{

    const {playlistId,videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Playlist Id is Invalid")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400,"Playlist Does not exists")
    }

    const addVideo = await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
            owner:req.user?._id
        },
        {
            $addToSet:{
                    videos:videoId
            }
        },
        {
            new:true
        }
    )

    if(!addVideo){
        throw new ApiError(500,"Video insertion in playlist failed.")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,addVideo,"Video inserted in Playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async(req,res)=>{

    const {playlistId,videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist ID")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video ID")
    }

    const deleteVideo = await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
            owner:req.user?._id
        },
        {
            $pull:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )

    if(!deleteVideo){
        throw new ApiError(500,"Video deletion from playlist failed")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,deleteVideo,"Video Successfully deleted from Playlist")
    )
})

const updatePlaylist = asyncHandler(async(req,res)=>{

    const {playlistId} = req.params
    const {name, description} = req.body

    if(!name || name.trim()===""){
        throw new ApiError(400,"The playlist name is empty")
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
            owner:req.user?._id
        },{
            $set:{
                name:name,
                description:description?description:""
            }
        },{
            new:true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500,"Playlist updation failed")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,updatedPlaylist,"Playlist Updated successfully")
    )
})

const deletePlaylist = asyncHandler(async(req,res)=>{

    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Playlist ID invalid")
    }

    const deletedPlaylist = await Playlist.findOneAndDelete(
        {
            _id:playlistId,
            owner:req.user?._id
        }
    )

    if(!deletedPlaylist){
        throw new ApiError(400,"Playlist deletion unsuccessful")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,{},"Playlist deleted successfully")
    )
})

const getUserPlaylist = asyncHandler(async(req,res)=>{
    

})

export {
    createPlaylist
    ,addVideoToPlaylist
    ,removeVideoFromPlaylist
    ,updatePlaylist
    ,deletePlaylist
}