// require('dotenv').config({path:'./env'})
import dotnev from "dotenv"

// import mangoose from "mongoose"
// import { DB_name } from "./constants.js";
import connectDB from "./db/index.js";

dotnev.config({
  path: "./env"
})

connectDB()



// ************************First Approch*********************************************
// import express from "express"
// const app = express()
// ;(async() => {
//   try {
//     await mangoose.connect(`${process.env.MONGODB_UR}/${DB_name}`)
//     app.on("error",(error) => {
//       console.log("ERR: ", error);
//       throw error
//     })

//     app.listen(process.env.PORT, () => {
//       console.log(`app is listening on port ${process.env.PORT}`)
//     })

//   } catch (error) {
//     console.log("ERROR: ",error)
//     throw err
//   }
// })