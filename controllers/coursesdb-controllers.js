// coursesdb-controllers: action functions
const xlsx = require('xlsx');
const { validationResult } = require('express-validator');

// const { createAndThrowError, createError } = require('../helpers/error');
// const { getEnvVar } = require('../helpers/getEnvVar');
const HttpError = require('../models/http-error');
const Course = require('../models/course');

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
    outputDate = new Date(inputDate);
  } else {  // undefined, use a dummy value
    outputDate = new Date(1970, 0, 1);
  }
  return outputDate;
};

// load data from an Excel spreadsheet
const loadExcelData = filePath => {
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheetNames = workbook.SheetNames;
  const data = xlsx.utils.sheet_to_json(
    workbook.Sheets[sheetNames[0]]
  );

  return data;
};

// add a course to the database
const addCourseToDb = async course => {
  const startedDate = dateObject(null); // assumed to be unknown
  let wasStarted = false;
  let wasCompleted = false;

  const completedDate = dateObject(course.Finished);
  if (completedDate > startedDate) {
    wasCompleted = true;
    wasStarted = true;
  }
  const title = course.Title.replace(/[\n\r]+/g, ' ');

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

  // save new Course object to the database
  try {
    // console.log(`Adding ${title}`);
    await newCourse.save();
  } catch (err) {
    console.log('Error saving new Course object');
    console.log(err);
    return next(new HttpError('coursesdb-controllers: Adding new course failed, please try again.', 500));
  }

  return newCourse;
};

// delete a course from the database
const deleteCourseFromDb = async courseId => {
  let course;
  try {
    course = await Course.findById(courseId);
  }
  catch (err) {
    return next(new HttpError('coursesdb-controllers: Something went wrong in findById, could not delete course!', 500));
  }

  if (!course) {
    return next(new HttpError('coursesdb-controllers: Could not find course for provided id.', 404));
  }

  const title = course.title;
  try {
    // delete course
    await course.remove();
  } catch (err) {
    return next(new HttpError('coursesdb-controllers: Something went wrong, could not delete course!', 500));
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
    return next(new HttpError('coursesdb-controllers: Something went wrong in findById, could not delete course!', 500));
  }

  if (!course) {
    return next(new HttpError('coursesdb-controllers: Could not find course for provided id.', 404));
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
    return next(new HttpError('coursesdb-controllers: Fetching courses failed, please try again later.', 500));
  }

  console.log(`${courses.length} courses listed`);
  res.status(201).json({ courses: courses.map(course => course.toObject({ getters: true })) });
};

// add single course
const addCourse = async (req, res, next) => {
  const { course } = req.body;

  let newCourse;
  try {
    newCourse = await addCourseToDb(course);
  } catch (err) {
    // console.log(err);
    return next(new HttpError('coursesdb-controllers: Add course failed, please try again later.', 500));
  }

  console.log(`Added course "${newCourse.title}"`);
  res.status(200).json(newCourse);
};

// add multiple courses (from Excel file)
const addCourses = async (req, res, next) => {
  const { filePath } = req.body;

  try {
    data = loadExcelData(filePath);
  } catch (err) {
    return next(new HttpError('coursesdb-controllers: Get course data failed, please try again later.', 500));
  }

  data.map(async course => {
    try {
      await addCourseToDb(course);
    } catch (err) {
      // console.log(err);
      return next(new HttpError('coursesdb-controllers: Add course failed, please try again later.', 500));
    }
  });

  // get the new courses so they can be returned
  try {
    const newCourses = await Course.find({});
    console.log(`${newCourses.length} courses added`);
    res.status(200).json(newCourses);
  } catch (err) {
    // console.log(err);
    return next(new HttpError('coursesdb-controllers: List-after-add-courses failed, please try again later.', 500));
  }
};

// delete single course
const deleteCourse = async (req, res, next) => {
  const courseId = req.params.cid;

  let title = "";
  try {
    title = await deleteCourseFromDb(courseId);
  } catch (err) {
    // console.log(err);
    return next(new HttpError('coursesdb-controllers: Delete course failed, please try again later.', 500));
  }

  console.log(`Deleted "${title}"`);
  res.status(201).json({
    message: `Deleted ${courseId}`
  });
};

// delete all courses
const deleteCourses = async (req, res, next) => {
  let courses;

  try {
    courses = await Course.find({});
  } catch (err) {
    return next(new HttpError('coursesdb-controllers: Fetching courses failed, please try again later.', 500));
  }

  courses.map(async course => {
    try {
      await deleteCourseFromDb(course._id);
    } catch (err) {
      return next(new HttpError('coursesdb-controllers: Delete course failed, please try again later.', 500));
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

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError('coursesdb-controllers: Invalid inputs passed, please check your data.', 422));
  }

  const { title, description, notes } = req.body;

  let course;
  try {
    course = await Course.findById(courseId);
  }
  catch (err) {
    return next(new HttpError('coursesdb-controllers: Something went wrong, could not update course!', 500));
  }

  course.title = title;
  course.description = description;
  course.notes = notes;

  try {
    await course.save();
  } catch (err) {
    return next(new HttpError('coursesdb-controllers: Something went wrong, could not update place!', 500));
  }

  console.log(`Course "${course.title}" updated`)
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
