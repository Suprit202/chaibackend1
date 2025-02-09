import mangoose from "mongoose"
import { DB_name } from "../constants.js"

const connectDB = async () => {
  try {
    const connectInstance = await mangoose.connect(`${process.env.MONGODB_URI}/${DB_name}`)
    console.log(`\nMongoDB connected !! DB HOST:${connectInstance.connection.host}`)
  } catch (error) {
    console.log("MONGODB conection error ",error)
    process.exit(1)
  }
}

export default connectDB