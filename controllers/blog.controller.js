import { Blog } from "../models/blog.model.js";
import Comment from "../models/comment.model.js";
import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/dataUri.js";

// Create a new blog post
 export const createBlog = async (req, res) => {
  try {
    const { title, category } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        message: "Blog title and category are required.",
      });
    }

    const authorId = req.id || req.user?.id; // fallback

    if (!authorId) {
      return res.status(401).json({
        message: "Unauthorized: Author not found",
      });
    }

    const blog = await Blog.create({
      title,
      category,
      author: authorId,
    });

    return res.status(201).json({
      success: true,
      blog,
      message: "Blog Created Successfully.",
    });
  } catch (error) {
    console.log("Create Blog Error:", error);
    return res.status(500).json({
      message: "Failed to create blog",
      error: error.message,
    });
  }
};



export const updateBlog = async (req, res) => {
    try {
        const blogId = req.params.blogId
        const { title, subtitle, description, category } = req.body;
        const file = req.file;

        let blog = await Blog.findById(blogId).populate("author");
        if(!blog){
            return res.status(404).json({
                message:"Blog not found!"
            })
        }
        let thumbnail;
        if (file) {
            const fileUri = getDataUri(file)
            thumbnail = await cloudinary.uploader.upload(fileUri)
        }

        const updateData = {title, subtitle, description, category,author: req.id, thumbnail: thumbnail?.secure_url};
        blog = await Blog.findByIdAndUpdate(blogId, updateData, {new:true});

        res.status(200).json({ success: true, message: "Blog updated successfully", blog });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating blog", error: error.message });
    }
};

export const getAllBlogs = async (_, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 }).populate({
            path: 'author',
            select: 'firstName lastName photoUrl'
        }).populate({
            path: 'comments',
            sort: { createdAt: -1 },
            populate: {
                path: 'userId',
                select: 'firstName lastName photoUrl'
            }
        });
        res.status(200).json({ success: true, blogs });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching blogs", error: error.message });
    }
};

export const getPublishedBlog = async (_,res) => {
    try {
        const blogs = await Blog.find({isPublished:true}).sort({ createdAt: -1 }).populate({path:"author", select:"firstName lastName photoUrl"}).populate({
            path: 'comments',
            sort: { createdAt: -1 },
            populate: {
                path: 'userId',
                select: 'firstName lastName photoUrl'
            }
        });
        if(!blogs){
            return res.status(404).json({
                message:"Blog not found"
            })
        }
        return res.status(200).json({
            success:true,
            blogs,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Failed to get published blogs"
        })
    }
}

export const togglePublishBlog = async (req,res) => {
    try {
        const {blogId} = req.params;
        const {publish} = req.query; // true, false
        console.log(req.query);
        
        const blog = await Blog.findById(blogId);
        if(!blog){
            return res.status(404).json({
                message:"Blog not found!"
            });
        }
        // publish status based on the query paramter
        blog.isPublished = !blog.isPublished
        await blog.save();

        const statusMessage = blog.isPublished ? "Published" : "Unpublished";
        return res.status(200).json({
            success:true,
            message:`Blog is ${statusMessage}`
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Failed to update status"
        })
    }
}

export const getOwnBlogs = async (req, res) => {
    try {
        const userId = req.id; // Assuming `req.id` contains the authenticated user’s ID

        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const blogs = await Blog.find({ author: userId }).populate({
            path: 'author',
            select: 'firstName lastName photoUrl'
        }).populate({
            path: 'comments',
            sort: { createdAt: -1 },
            populate: {
                path: 'userId',
                select: 'firstName lastName photoUrl'
            }
        });;

        if (!blogs) {
            return res.status(404).json({ message: "No blogs found.", blogs: [], success: false });
        }

        return res.status(200).json({ blogs, success: true });
    } catch (error) {
        res.status(500).json({ message: "Error fetching blogs", error: error.message });
    }
};

// Delete a blog post
export const deleteBlog = async (req, res) => {
    try {
        const blogId = req.params.id;
        const authorId = req.id
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ success: false, message: "Blog not found" });
        }
        if (blog.author.toString() !== authorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized to delete this blog' });
        }

        // Delete blog
        await Blog.findByIdAndDelete(blogId);

        // Delete related comments
        await Comment.deleteMany({ postId: blogId });


        res.status(200).json({ success: true, message: "Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting blog", error: error.message });
    }
};

export const likeBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.id;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const alreadyLiked = blog.likes.includes(userId);

    if (alreadyLiked) {
      return res.status(400).json({ success: false, message: 'You already liked this blog' });
    }

    blog.likes.push(userId);
    await blog.save();
const io = req.app.get("io");
io.emit("reactionUpdate", {
  blogId: blog._id,
  likes: blog.likes,
  dislikes: blog.dislikes,
});

    return res.status(200).json({ success: true, message: 'Blog liked', blog });
  } catch (error) {
    console.error("Error liking blog:", error);
    return res.status(500).json({ success: false, message: 'Failed to like blog' });
  }
};

export const dislikeBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.id;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const wasLiked = blog.likes.includes(userId);
    if (!wasLiked) {
      return res.status(400).json({ success: false, message: 'You have not liked this blog' });
    }

    blog.likes = blog.likes.filter(id => id.toString() !== userId);
    await blog.save();

    return res.status(200).json({ success: true, message: 'Blog disliked', blog });
  } catch (error) {
    console.error("Error disliking blog:", error);
    return res.status(500).json({ success: false, message: 'Failed to dislike blog' });
  }
};

export const toggleBlogLike = async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.id;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const liked = blog.likes.includes(userId);

    if (liked) {
      blog.likes = blog.likes.filter(id => id.toString() !== userId);
      await blog.save();
      return res.status(200).json({ success: true, message: 'Blog disliked', liked: false, blog });
    } else {
      blog.likes.push(userId);
      await blog.save();
      return res.status(200).json({ success: true, message: 'Blog liked', liked: true, blog });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
};


export const getMyTotalBlogLikes = async (req, res) => {
    try {
      const userId = req.id; // assuming you use authentication middleware
  
      // Step 1: Find all blogs authored by the logged-in user
      const myBlogs = await Blog.find({ author: userId }).select("likes");
  
      // Step 2: Sum up the total likes
      const totalLikes = myBlogs.reduce((acc, blog) => acc + (blog.likes?.length || 0), 0);
  
      res.status(200).json({
        success: true,
        totalBlogs: myBlogs.length,
        totalLikes,
      });
    } catch (error) {
      console.error("Error getting total blog likes:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch total blog likes",
      });
    }
  };
export const getMyTotalBlogDislikes = async (req, res) => {
  try {
    const userId = req.id;

    // Step 1: Find blogs authored by the current user
    const myBlogs = await Blog.find({ author: userId }).select("dislikes");

    // Step 2: Sum total dislikes from all blogs
    const totalDislikes = myBlogs.reduce((acc, blog) => acc + (blog.dislikes?.length || 0), 0);

    res.status(200).json({
      success: true,
      totalBlogs: myBlogs.length,
      totalDislikes,
    });
  } catch (error) {
    console.error("Error getting total blog dislikes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch total blog dislikes",
    });
  }
};
