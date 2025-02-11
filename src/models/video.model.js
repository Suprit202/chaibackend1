import mongoose, { Schema }  from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new mongoose.Schema(
  {
    videoFile: {
      type: String, //cloudinary url
      required: true,
      trim: true,
      index: true
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    isPublish: {
      type: Boolean
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'user',
    }
  },
  {
    timestamps: true
  }
)

videoSchema.plugin(mongooseAggregatePaginate);

export const video = mongoose.model('video',videoSchema)