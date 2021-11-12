// courses-api: action functions
// const dotenv = require('dotenv');
const xlsx = require('xlsx');

// const { createAndThrowError, createError } = require('../helpers/error');
const HttpError = require('../models/http-error');
const Course = require('../models/course');
// const { getEnvVar } = require('../helpers/getEnvVar');

// dotenv.config();

// utility functions start here!

// convert an Excel string date to a JS Date with error checking
const dateObject = inputDate => {
  let outputDate;

  if (inputDate) {
    outputDate = new Date(inputDate);
  } else {  // undefined, use a dummy value
    outputDate = new Date(1970, 0, 1);
  }
  return outputDate;
};

// exported functions start here!

// return a single course (method pending!)
const getCourse = async (req, res, next) => {
  const courseId = req.params.cid;

  res.status(201).json({
    message: "Done!"
  });
}

// return all courses
const getCourses = async (req, res, next) => {
  let courses;
  try {
    courses = await Course.find({});
  } catch (err) {
    return next(new HttpError('Fetching courses failed, please try again later.', 500));
  }

  res.status(201).json({ courses: courses.map(course => course.toObject({ getters: true })) });
};

// add single course (method pending!)
const addCourse = async (req, res, next) => {
  const courseId = req.params.cid;

  res.status(201).json({
    message: "Done!"
  });
};

// add multiple courses (from Excel file)
const addCourses = async (req, res, next) => {
  const filePath = "/Users/dbr/Dropbox/Udemy/My Course Catalog.xlsx";

  const workbook = xlsx.readFile(
    filePath,
    { cellDates: true }
  );
  const sheetNames = workbook.SheetNames;

  const data = xlsx.utils.sheet_to_json(
    workbook.Sheets[sheetNames[0]]
  );

  const startedDate = dateObject(null);   // we just don't know this!
  let wasStarted;
  let completedDate;
  let wasCompleted;
  let title;
  let newCourse;

  data.map(async course => {
    title = course.Title.replace(/[\n\r]+/g, ' ');
    console.log(title);

    completedDate = dateObject(course.Finished);
    if (completedDate > startedDate) {
      wasCompleted = true;
      wasStarted = true;
    } else {
      wasCompleted = false;
      wasStarted = false;
    }

    // create a new Course object
    newCourse = new Course({
      purchaseSequence: course.n,
      title: title,
      category: course.Category,
      tools: course.Tools.replace(/[\n\r]+/g, ' '),
      hours: course.Hours,
      sections: course.Sections,
      lectures: course.Lectures,
      instructor: course.Instructor.replace(/[\n\r]+/g, ' '),
      dateBought: dateObject(course.Bought),
      dateStarted: startedDate,
      started: wasStarted,
      dateCompleted: completedDate,
      completed: wasCompleted,
      description: '',
      notes: ''
    });

    // console.log(newCourse);

    // save new Course object to the database
    try {
      // console.log('Trying to save new User object');
      await newCourse.save();
    } catch (err) {
      console.log('Error saving new Course object');
      console.log(err);
      return next(new HttpError('Adding new course failed, please try again.', 500));
    }

  });

  res.status(201).json({
    message: "Done!"
  });
};

// delete single course (method pending!)
const deleteCourse = async (req, res, next) => {
  const courseId = req.params.cid;

  res.status(201).json({
    message: "Done!"
  });
};

// delete all courses (method pending!)
const deleteCourses = async (req, res, next) => {

  res.status(201).json({
    message: "Done!"
  });
};

// update single course (method pending!)
const updateCourse = async (req, res, next) => {
  const courseId = req.params.cid;

  res.status(201).json({
    message: "Done!"
  });
};


exports.getCourse = getCourse;
exports.getCourses = getCourses;
exports.addCourse = addCourse;
exports.addCourses = addCourses;
exports.deleteCourse = deleteCourse;
exports.deleteCourses = deleteCourses;
exports.updateCourse = updateCourse;
