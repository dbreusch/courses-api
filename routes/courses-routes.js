// courses-api: define app routes
const express = require('express');
// const { check } = require('express-validator');

const coursesControllers = require('../controllers/courses-controllers');

// initialize router
const router = express.Router();

// define available routes

// return a single course
router.get('/:cid', coursesControllers.getCourse);

// return a list of courses
router.get('/', coursesControllers.getCourses);

// add a single course
router.post(
  '/addCourse',
  coursesControllers.addCourse
);

// add multiple courses
router.post(
  '/addCourses',
  coursesControllers.addCourses
);

// delete a single course
router.delete(
  '/:cid',
  coursesControllers.deleteCourse
);

// delete all courses
router.delete(
  '/',
  coursesControllers.deleteCourses
);

// update a single course
router.patch(
  '/:cid',
  coursesControllers.updateCourse
);

module.exports = router;
