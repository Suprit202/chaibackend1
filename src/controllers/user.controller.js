import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js"
import {user} from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';


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

  const {fullname,email,username,passowrd} = req.body
  console.log("email",email);

  if(
    [fullname, email, username, passowrd].some((field) => field?.trim() === "")
  ){
    throw new ApiError(400,"All fields are required")
  }

  const existedUser = user.findOne({
    $or: [{username},{email}]
  })

  if (existedUser) {
    throw new ApiError(409,"user with email or user name already exist!!"); 
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400,"avarat File is required !");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar)
  {
    throw new ApiError(400,"avarat File is required !")
  }

  const user = await user.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    passowrd,
    username: username.toLowerCase()
  })

  const createdUser = await user.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500,"Somthing went wrong while registering a user")
  }

  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully !!!")
  )
})

export {registerUSer}
