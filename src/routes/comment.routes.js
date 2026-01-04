import { Router } from "express";
import { addComment , updateComment , deleteComment , getVideoComments } from "../controllers/comment.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router=Router()

// every route is after the login (secured)
router.use(verifyJWT)

router.route("/:videoId").post(addComment)
router.route("/comment/:commentId").patch(updateComment)
router.route("/comment/:commentId").delete(deleteComment)
router.route("/:videoId").get(getVideoComments)

export default router