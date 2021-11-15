// coursesdb-routes: define app routes
const express = require('express');
// const { check } = require('express-validator');

const coursesdbControllers = require('../controllers/coursesdb-controllers');

// initialize router
const router = express.Router();

// define available routes

// return a single course
router.get('/:cid', coursesdbControllers.getCourse);

// return a list of courses
router.get('/', coursesdbControllers.getCourses);

// add a single course
router.post(
  '/addCourse',
  coursesdbControllers.addCourse
);

// add multiple courses
router.post(
  '/addCourses',
  coursesdbControllers.addCourses
);

// delete a single course
router.delete(
  '/:cid',
  coursesdbControllers.deleteCourse
);

// delete all courses
router.delete(
  '/',
  coursesdbControllers.deleteCourses
);

// update a single course
router.patch(
  '/:cid',
  coursesdbControllers.updateCourse
);

module.exports = router;
