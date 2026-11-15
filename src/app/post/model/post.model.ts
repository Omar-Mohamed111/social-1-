import mongoose, { ObjectId, Schema } from "mongoose";

export interface IPost {
  content: string;
  userId: ObjectId;
  commentsCount: number;
  reactionsCounts: number;
  allowComments: boolean;
}

const postSchema = new Schema<IPost>({
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200,
  },

  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  commentsCount: {
    type: Number,
    default: 0,
  },

  reactionsCounts: {
    type: Number,
    default: 0,
  },
});

export const Post = mongoose.model("Post", postSchema);
