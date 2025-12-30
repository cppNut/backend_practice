import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,

}))

//or normally app.use(cors())

app.use(express.json({limit: "16kb"}))  // json jo aa rha hai uska kya limit hai 
app.use(express.urlencoded({extended: true, limit: "16kb"}))    //url me kahi pr / hai kahi ? , kahi %20 , to uske liye
app.use(express.static("public"))   // files, assets public me 
app.use(cookieParser())

// routes import
import userRouter from './routes/user.routes.js'


// routes declaration
app.use("/api/v1/users", userRouter)


export {app}