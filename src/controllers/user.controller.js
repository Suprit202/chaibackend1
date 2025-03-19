import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js"
import {user} from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) => {
  try {
    const User = await user.findByIdAndUpdate(userId)
    const accessToken = User.generateAccessToken()
    const refreshToken = User.generateRefreshToken()

    User.refreshToken = refreshToken
    await User.save({validateBeforeSave: false})

    return {accessToken,refreshToken}

  } catch (error) {
    throw new ApiError(500,"Somthing went wrong while generating refresh and acccess token")
  }
}

const registerUSer = asyncHandler(async (req, res) => {
  //get user details
  //validation - not empty
  //check if user already exist
  //check for images, check for avatar
  //upload them to cloudinary,avatar
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return res

  const {fullname,email,username,password} = req.body;
  // console.log("email",email);

  if(
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ){
    throw new ApiError(400,"All fields are required")
  }

  const existedUser = await user.findOne({
    $or: [{username},{email}]
  })

  if (existedUser) {
    throw new ApiError(409,"user with email or user name already exist!!"); 
  }
  // console.log(req.files);
  

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400,"avarat File is required !");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar)
  {
    throw new ApiError(400,"avarat File is required !")
  }

  const User = await user.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await user.findById(User._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){

    throw new ApiError(500,"Somthing went wrong while registering a user")
  }

  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully !!!")
  )
})

const loginUser = asyncHandler(async (req, res) => {
  //req body -> data
  //username or email
  //find the user
  //check for password
  //access and refresh token
  //send cookies

  const {username, email} = req.body;
  // console.log(email);
  

  if (!username && !email) {
    throw new ApiError(400,"Username and password are required")
  }


  const User = await user.findOne({
    $or: [{username},{email}]
  })

  if (!User) {
    throw new ApiError(404,"User not found")
  }


  const isPasswordValid = await User.verifyPassword(req.body.password)

  if (!isPasswordValid) {
    throw new ApiError(401,"Invalid credentials")
  }


  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(User._id)

  const loggedInUser = await user.findById(User._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        User: loggedInUser, accessToken, refreshToken
      },
        "User logged in successfully"
    )
  )
})

const logoutUser = asyncHandler(async (req, res) => {
  await user.findByIdAndUpdate(
    req.user._id, 
    {
      $set:{
        refreshToken: undefined
      }
    },
    {
      new: true
    }
)

const options = {
  httpOnly: true,
  secure: true,
}

return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  //get refresh token
  //check if refresh token is valid
  //generate new access token
  //send new access token

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(400,"Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const User = await user.findById(decodedToken?._id)
  
    if (!User) {
      throw new ApiError(401,"Invalid refresh token")
    }
  
    if (incomingRefreshToken !== User?.refreshToken) {
      throw new ApiError(401,"Refresh token is expired or used") 
    }
  
    const options = {
      httpOnly: true,
      secure: true,
    }
  
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(User._id)
    
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken: newRefreshToken},
        "Access token refreshed successfully")
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Inavlid refresh token")
  }
})
export {
  registerUSer,
  loginUser,
  logoutUser,
  refreshAccessToken
}
