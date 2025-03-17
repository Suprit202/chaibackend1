import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js"
import {user} from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateAccessAndRefreshToken = async(userId) => {
  try {
    const user = await user.findByIdAndUpdate(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

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

  if (!username || !email) {
    throw new ApiError(400,"Username and password are required")
  }


  const User = await user.findOne({
    $or: [{username},{email}]
  })

  if (!User) {
    throw new ApiError(404,"User not found")
  }


  const isPasswordValid = await User.isPasswordCorrect(req.body.password)

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
        user: loggedInUser, accessToken, refreshToken
      },
        "User logged in successfully"
    )
  )


  const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
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
  .json(new ApiResponse(200,{},"User logged out successfully"))
  })
})
export {
  registerUSer,
  loginUser,
  logoutUser
}
