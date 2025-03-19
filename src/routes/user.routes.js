import { Router } from "express";
import { loginUser, registerUSer, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { varifayJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount:1
    },
    {
      name:"coverImage",
      maxCount:1
    }
  ]),
  registerUSer
)

router.route("/login").post(loginUser)

//sequre routes
router.route("/logout").post(varifayJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)


export default router;