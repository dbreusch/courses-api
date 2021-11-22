// coursesdb-controllers: action functions
const xlsx = require('xlsx');
const { validationResult } = require('express-validator');

const { createAndThrowError, createError } = require('../helpers/error');
// const { getEnvVar } = require('../helpers/getEnvVar');
const HttpError = require('../models/http-error');
const Course = require('../models/course');
const User = require('../models/user');

// // fake course data (to test addCourse)
// const defaultCourse = {
//   "n": "99",
//   "Title": "A Course That Doesn't Exist",
//   "Category": "DevOps",
//   "Tools": "Kubernetes",
//   "Hours": "12.3",
//   "Sections": "11",
//   "Lectures": "345",
//   "Instructor": "Albert Einstein",
//   "Bought": "2020-04-01T08:00:00.000Z",
//   "Finished": "2021-10-31T07:00:00.000Z"
// };

// utility functions start here!

// convert an Excel string date to a JS Date with error checking
const dateObject = inputDate => {
  let outputDate;

  if (inputDate) {
    try {
      outputDate = new Date(inputDate);
    } catch {
      outputDate = new Date();    // bad input date, default to Now
    }
  } else {  // undefined, use a dummy value
    outputDate = new Date(1970, 0, 1);
  }
  return outputDate;
};

// load data from an Excel spreadsheet
const loadExcelData = filePath => {
  try {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
  } catch {
    createAndThrowError('coursesdb-api: Could not load Excel file!', 500);
  }
  const sheetNames = workbook.SheetNames;
  try {
    const data = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetNames[0]]
    );
    return data;
  } catch {
    createAndThrowError('coursesdb-api: Could not convert spreadsheet!', 500);
  }
};

// add a course to the database
const addCourseToDb = async (course, creator) => {
  const startedDate = dateObject(null); // assumed to be unknown
  let wasStarted = false;
  let wasCompleted = false;

  const title = course.Title.replace(/[\n\r]+/g, ' ');
  const instructor = course.Instructor.replace(/[\n\r]+/g, ' ');

  // check for an existing course
  let existingCourse;
  try {
    existingCourse = await Course.findOne(
      {
        $and: [
          { title: title },
          { instructor: instructor }
        ]
      }
    );
  } catch (err) {
    console.log('coursesdb-api: Error checking for existing course');
    createAndThrowError('coursesdb-api: Adding course failed, please try again later.', 500);
  }
  if (existingCourse) {
    console.log('coursesdb-api: Existing course found');
    createAndThrowError('coursesdb-api: Course exists already, please use edit instead.', 422);
  }

  // compute dates and boolean status vars
  const completedDate = dateObject(course.Finished);
  if (completedDate > startedDate) {
    wasCompleted = true;
    wasStarted = true;
  }
  const currDate = new Date();

  // create a new Course object
  const newCourse = new Course({
    purchaseSequence: course.n,
    title: title,
    category: course.Category,
    tools: course.Tools.replace(/[\n\r]+/g, ' '),
    hours: course.Hours,
    sections: course.Sections,
    lectures: course.Lectures,
    instructor: instructor,
    dateBought: dateObject(course.Bought),
    dateStarted: startedDate,
    started: wasStarted,
    dateCompleted: completedDate,
    completed: wasCompleted,
    description: '',
    notes: '',
    creator: creator,
    provider: '',
    dateAdded: currDate,
    dateUpdated: currDate
  });

  // save new Course object to the database
  try {
    // console.log(`Adding ${title}`);
    await newCourse.save();
  } catch (err) {
    console.log('Error saving new Course object');
    createAndThrowError('coursesdb-api: Saving new course failed, please try again.', 500);
  }

  return newCourse;
};

// delete a course from the database
const deleteCourseFromDb = async (courseId, creator) => {
  let course;
  try {
    course = await Course.findById(courseId).populate('creator');
  }
  catch (err) {
    createAndThrowError('coursesdb-api: Something went wrong in findById, could not delete course!', 500);
  }

  if (!course) {
    createAndThrowError('coursesdb-api: Could not find course for provided id.', 404);
  }

  let originalCreator = null;
  if (course.creator && course.creator.id) {
    originalCreator = course.creator.id;
  } else {
    console.log('deleteCourseFromDb: creator.id not populated correctly');
    createAndThrowError('coursesdb-api: Invalid creator id.', 404);
  }

  if (creator !== originalCreator) {
    console.log('deleteCourseFromDb creator mismatch');
    createAndThrowError('coursesdb-api: Not the owner of this course, cannot be deleted.', 403);
  }

  const title = course.title;
  try {
    // delete course
    await course.remove();
  } catch (err) {
    createAndThrowError('coursesdb-api: Something went wrong in remove, could not delete course!', 500);
  }

  return title;
};

// exported functions start here!

// return a single course
const getCourse = async (req, res, next) => {
  const courseId = req.params.cid;

  let course;
  try {
    course = await Course.findById(courseId);
  }
  catch (err) {
    return next(new HttpError('courses-api: Something went wrong in findById, could not delete course!', 500));
  }

  if (!course) {
    return next(new HttpError('courses-api: Could not find course for provided id.', 404));
  }

  console.log(`"${course.title}"`);
  res.status(201).json(course);
};

// return all courses
const getCourses = async (req, res, next) => {
  let courses;
  try {
    courses = await Course.find({});
  } catch (err) {
    return next(new HttpError('courses-api: Fetching courses failed, please try again later.', 500));
  }

  console.log(`${courses.length} courses listed`);
  res.status(201).json({ courses: courses.map(course => course.toObject({ getters: true })) });
};

// add single course
const addCourse = async (req, res, next) => {
  const { course } = req.body;
  const creator = req.userData.userId;

  let newCourse;
  try {
    newCourse = await addCourseToDb(course, creator, next);
  } catch (err) {
    const message = err.message || 'courses-api: Add course failed, please try again later.';
    const code = err.code || 500;
    return next(new HttpError(message, code));
  }

  console.log(`Added course "${newCourse.title}"`);
  res.status(200).json(newCourse);
};

// add multiple courses (from Excel file)
const addCourses = async (req, res, next) => {
  const { filePath } = req.body;
  const creator = req.userData.userId;

  try {
    data = loadExcelData(filePath);
  } catch (err) {
    const message = err.message || 'courses-api: Load Excel file failed.';
    const code = err.code || 500;
    return next(new HttpError(message, code));
    // return next(new HttpError('courses-api: Get course data failed, please try again later.', 500));
  }

  data.map(async course => {
    try {
      await addCourseToDb(course);
    } catch (err) {
      const message = err.message || 'courses-api: Add course failed, please try again later.';
      const code = err.code || 500;
      return next(new HttpError(message, code));
    }
  });

  // get the new courses so they can be returned
  try {
    const newCourses = await Course.find({});
    console.log(`${newCourses.length} courses added`);
    res.status(200).json(newCourses);
  } catch (err) {
    return next(new HttpError('courses-api: List-after-add-courses failed, please try again later.', 500));
  }
};

// delete single course
const deleteCourse = async (req, res, next) => {
  const courseId = req.params.cid;
  const creator = req.userData.userId;
  // console.log(`deleteCourse creator = ${creator}`);

  let title = "";
  try {
    title = await deleteCourseFromDb(courseId, creator);
  } catch (err) {
    const message = err.message || 'courses-api: Delete course failed, please try again later.';
    const code = err.code || 500;
    return next(new HttpError(message, code));
    // return next(new HttpError('courses-api: Delete course failed, please try again later.', 500));
  }

  console.log(`Deleted "${title}"`);
  res.status(201).json({
    message: `Deleted ${courseId}`
  });
};

// delete all courses
const deleteCourses = async (req, res, next) => {
  const creator = req.userData.userId;
  let courses;

  try {
    courses = await Course.find({});
  } catch (err) {
    return next(new HttpError('courses-api: Fetching courses failed, please try again later.', 500));
  }

  courses.map(async course => {
    try {
      await deleteCourseFromDb(course._id);
    } catch (err) {
      const message = err.message || 'courses-api: Delete course failed, please try again later.';
      const code = err.code || 500;
      return next(new HttpError(message, code));
      // return next(new HttpError('courses-api: Delete course failed, please try again later.', 500));
    }
  }
  );

  console.log(`${courses.length} courses deleted`);
  res.status(201).json({
    message: `${courses.length} courses deleted`
  });
};

// update single course (PATCH)
// starting with most common fields
// to do ALL of them will require some more complex coding
const updateCourse = async (req, res, next) => {
  const courseId = req.params.cid;
  const creator = req.userData.userId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError('courses-api: Invalid inputs passed, please check your data.', 422));
  }

  const { title, description, notes } = req.body;

  let course;
  try {
    course = await Course.findById(courseId);
  }
  catch (err) {
    return next(new HttpError('courses-api: Something went wrong, could not update course!', 500));
  }

  course.title = title;
  course.description = description;
  course.notes = notes;
  const currDate = new Date();
  course.dateUpdated = currDate;

  try {
    await course.save();
  } catch (err) {
    return next(new HttpError('courses-api: Something went wrong, could not update place!', 500));
  }

  console.log(`Course "${course.title}" updated`);
  res.status(200).json({ course: course.toObject({ getters: true }) });
};

// exports
exports.getCourse = getCourse;
exports.getCourses = getCourses;
exports.addCourse = addCourse;
exports.addCourses = addCourses;
exports.deleteCourse = deleteCourse;
exports.deleteCourses = deleteCourses;
exports.updateCourse = updateCourse;
