import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  content: { type: String, required: true },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",   // <-- relationship works now
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BlogPostSchema = new mongoose.Schema({
  title: String,
  content: String,
  coverImage: String,

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  category: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },

  comments: [CommentSchema],

  upvotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

BlogPostSchema.index({ title: "text" });

const BlogPost =
  mongoose.models.BlogPost || mongoose.model("BlogPost", BlogPostSchema);

export default BlogPost;
