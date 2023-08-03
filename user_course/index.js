const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// const secretKey = crypto.randomBytes(32).toString('hex');
// console.log(secretKey);
const dotenv = require('dotenv')
const app = express();
app.use(express.json());
require('dotenv').config();
// // Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fullstack_developer_anshul', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to the database successfully');
})
.catch((error) => {
  console.error('Error connecting to the database:', error.message);
});
// User model
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

// Course model
const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start_date: { type: Date, required: true },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], required: true },
});

const Course = mongoose.model('Course', CourseSchema);

// Subscription model
const SubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

// Middleware: Authentication Check  
const authMiddleware = (req, res, next) => {
    try {
      const token = req.header('Authorization').replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Token not provided' });
      }
  
      //const secretKey = 'de15ac8b7fe05d45cf7fa4a2293d6997dc09ad1a31c320c64a959b67b6ed0a82';
      const secretKey = '4138633fc403bdd98d64bbd2db71c5d149bfb392ff04f5d2818b9f724a31e5c1'
      const decoded = jwt.verify(token, secretKey);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };

// User APIs
app.post('/signup', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword });
      await user.save();
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      res.status(400).json({ error: 'Failed to create user' });
    }
  });
  
  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        throw new Error('Invalid credentials');
      }
      const token = jwt.sign({ userId: user._id }, 'secretKey');
      res.json({ token });
    } catch (error) {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
  
  // Course APIs
app.post('/courses', authMiddleware, async (req, res) => {
    try {
      const { title, start_date, status } = req.body;
      const course = new Course({ title, start_date, status });
      await course.save();
      console.log('New Course Created:', course);
      res.status(201).json(course);
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(400).json({ error: 'Failed to create course' });
    }
  });
  
  app.get('/courses', async (req, res) => {
    try {
      const courses = await Course.find();
      console.log('All Courses:', courses);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  });
  
  app.delete('/courses/:id', authMiddleware, async (req, res) => {
    try {
      const courseId = req.params.id;
      const deletedCourse = await Course.findByIdAndDelete(courseId);
      console.log('Deleted Course:', deletedCourse);
      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete course' });
    }
  });
  
  app.get('/courses/:id', async (req, res) => {
    try {
      const courseId = req.params.id;
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      console.log('Course Details:', course);
      res.json(course);
    } catch (error) {
      res.status(404).json({ error: 'Course not found' });
    }
  });
  
  // Subscription APIs
  app.post('/subscribe/:courseId', authMiddleware, async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const userId = req.user.userId;
      const subscription = new Subscription({ user: userId, course: courseId });
      await subscription.save();
      console.log('New Subscription Created:', subscription);
      res.json({ message: 'Subscribed to the course successfully' });
    } catch (error) {
      console.error('Error creating Subscribed:', error);
      res.status(400).json({ error: 'Failed to subscribe to the course' });
    }
  });
  
  app.get('/subscriptions/:courseId', authMiddleware, async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const subscriptions = await Subscription.find({ course: courseId }).populate('user');
      console.log('Subscriptions:', subscriptions);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  });
// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
