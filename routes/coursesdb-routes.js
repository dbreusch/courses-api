// coursesdb-routes: define app routes
const express = require('express');
const { check } = require('express-validator');

const coursesdbControllers = require('../controllers/coursesdb-controllers');

const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

// initialize router
const router = express.Router();

// define available routes

// return a single course
router.get('/:cid', coursesdbControllers.getCourse);

// return a list of courses
router.get('/', coursesdbControllers.getCourses);

// add middleware to make sure subsequent requests have a valid token
router.use(checkAuth);

// add a single course
router.post(
  '/addCourse',
  [
    check('course.n')
      .isInt({ min: 1 })
      .withMessage('Purchase sequence must be integer and > 0'),
    check('course.Title')
      .isLength({ min: 5 })
      .withMessage('Title must be at least 5 characters'),
    check('course.Category')
      .not()
      .isEmpty(),
    check('course.Tools')
      .not()
      .isEmpty(),
    check('course.Hours')
    .isFloat({ gt: 0 })
      .withMessage('# of hours must be numeric and > 0'),
    check('course.Sections')
      .isInt({ min: 1 })
      .withMessage('# of sections must be integer and > 0'),
    check('course.Lectures')
      .isInt({ min: 1 })
      .withMessage('# of lectures must be integer and > 0'),
    check('course.Instructor')
      .isLength({ min: 3 })
      .withMessage('Instructor must be at least 3 characters'),
    check('course.Bought')
      .not()
      .isEmpty(),
  ],
  coursesdbControllers.addCourse
);

// add multiple courses
router.post(
  '/addCourses',
  fileUpload.single('xlsfile'),
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
