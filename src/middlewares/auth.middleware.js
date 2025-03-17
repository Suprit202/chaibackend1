import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { user } from "../models/user.model.js";
import jwt from "jsonwebtoken";


export const varifayJWT = asyncHandler(async (req, _, next) => { //if their is no response the we can type "_" in place of "res"
try {
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")
  
    if (!token) {
      throw new ApiError(401, "Unauthorized request")
    }
  
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const User = await user.findById(decodedToken?._id).select("-password -refreshToken")
  
    if (!User) {
      throw new ApiError(401, "User not found")
    }
  
    req.user = User
    next()
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token") 
}
})