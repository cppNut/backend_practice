import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async(_,res)=>{
    
    // Just a health check that responds OK 
    return res.status(200)
    .json(
        new ApiResponse(200,{status:"OK",uptime:process.uptime()},"Health Check OK")
    )
})

export {healthcheck}