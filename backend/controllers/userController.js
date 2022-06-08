const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// @desc    Register a User
// @route   POST api/users
// @access   Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  //if any of the fields are missing
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please enter all fields");
  }

  //if User already exists
  const userExists = await User.findOne({ username });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  //create new user
  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  //If user has been created then send response
  if (newUser) {
    res.status(201);
    res.json({
      _id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      token: generateToken(newUser),
    });
  } else {
    res.status(400);
    throw new Error("Invalid User data");
  }
});

// @desc    Login a User
// @route   POST api/users/login
// @access   Public
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  const token = generateToken(user);

  if (user && password && (await bcrypt.compare(password, user.password))) {
    const { password, ...other } = user._doc;
    res.json({ ...other, token });
  } else {
    res.status(400);
    throw new Error("Incorrect username or password");
  }
});

// @desc    Update a User
// @route   PUT api/users/id
// @access   Private
const updateUser = asyncHandler(async (req, res) => {
  //Check if user has updated their password
  if (req.body.password) {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(password, salt);
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200);
    res.json(updatedUser);
  } catch (err) {
    res.status(500);
    throw new Error("Canot be updated");
  }
});

//Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "5d" }
  );
};

module.exports = { registerUser, loginUser, updateUser };
