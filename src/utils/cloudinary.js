import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"     // nodejs file system


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY , 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadeOnCloudinary = async (localFilePath) =>{
        try{
            if(!localFilePath) return null
            // uploading the file 
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type: "auto"
            })
            //file has been uploaded successfully
            console.log("File has been uploaded on cloudinary ", response)
            return response;

        }catch(error){
            fs.unlinkSync(localFilePath)  // remove the locally saved temp file as upload got failed
            return null
        }
    }

export {uploadeOnCloudinary}

// Our logic is 
// User file upload krega , we save it to local server via multer
// then local se we will upload it on cloudinary via cloudinary
// to cloudinary will get a path of local file
// then we will remove the local file if it is successfully uploaded online

// use fs.unlink to delete the file