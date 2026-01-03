import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, updateTweet } from "../controllers/tweet.controller";

const router=Router()

// All secured Routes
router.use(verifyJWT)      // will be using verifyJWT for every route

router.route("/").post(createTweet)
router.route("/:tweetId").patch(updateTweet)
router.route("/:tweetId").delete(deleteTweet)

export default router