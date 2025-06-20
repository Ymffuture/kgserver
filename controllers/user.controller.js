import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/cloudinary.js";
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, userName } = req.body;

    if (!firstName || !lastName || !email || !password || !userName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    const existingUserByUsername = await User.findOne({ userName });
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      firstName,
      lastName,
      email,
      userName,
      password: hashedPassword
    });

    return res.status(201).json({
      success: true,
      message: "Account Created Successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to register"
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials"
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY || "dev-secret", {
      expiresIn: '1d'
    });

    return res.status(200)
      .cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "None",
        secure: true
      })
      .json({
        success: true,
        message: `Welcome back ${user.firstName}`,
        user
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to Login"
    });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        firstName: given_name,
        lastName: family_name,
        userName: email.split('@')[0],
        password: await bcrypt.hash(Math.random().toString(36), 10),
        photoUrl: picture
      });
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY || "dev-secret", {
      expiresIn: '1d'
    });

    return res.status(200)
      .cookie("token", jwtToken, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "None",
        secure: true
      })
      .json({
        success: true,
        message: `Welcome ${user.firstName}`,
        user
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Google login failed"
    });
  }
};

export const logout = async (_, res) => {
  try {
    return res.status(200)
      .cookie("token", "", { maxAge: 0 })
      .json({
        message: "Logged out successfully.",
        success: true
      });
  } catch (error) {
    console.error(error);
  }
};

export const updateProfile = async (req, rest, Next) => {
  try {
    const userId = req.id;
    const {
      firstName, lastName, occupation, bio,
      instagram, facebook, linkedin, github
    } = req.body;
    const file = req.file;

    let cloudResponse;
    if (file) {
      const fileUri = getDataUri(file);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (occupation) user.occupation = occupation;
    if (bio) user.bio = bio;
    if (instagram) user.instagram = instagram;
    if (facebook) user.facebook = facebook;
    if (linkedin) user.linkedin = linkedin;
    if (github) user.github = github;
    if (file && cloudResponse) user.photoUrl = cloudResponse.secure_url;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
  Next() 
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      message: "User list fetched successfully",
      total: users.length,
      users
    });
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

export const fileUris = async (req, res) => {
  try {
    const fileUri = getDataUri(req.file);
    if (!fileUri) {
      return res.status(400).json({
        success: false,
        message: "No file provided or file error"
      });
    }

    return res.status(200).json({
      success: true,
      fileUri
    });
  } catch (error) {
    console.error("Error while generating file URI:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process uploaded file"
    });
  }
};

