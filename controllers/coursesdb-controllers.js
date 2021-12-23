// coursesdb-controllers: action functions
const xlsx = require('xlsx');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const { createAndThrowError, createError } = require('../helpers/error');
// const { getEnvVar } = require('../helpers/getEnvVar');
const HttpError = require('../models/http-error');
const Course = require('../models/course');
const User = require('../models/user');
const user = require('../models/user');

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

  // clean up new date object
  outputDate.setHours(0, 0, 0, 0);
  outputDate.setTime(outputDate.getTime() - outputDate.getTimezoneOffset() * 60000);

  return outputDate;
};

// load data from an Excel spreadsheet
const loadExcelData = filePath => {
  let workbook, sheetNames, data;

  // read file
  try {
    workbook = xlsx.readFile(filePath, { cellDates: true });
  } catch (err) {
    console.log('loadExcelData: readfile failure');
    console.log(err);
    createAndThrowError('coursesdb-api: Could not load Excel file!', 500);
  }

  // get sheet names
  try {
    sheetNames = workbook.SheetNames;
  } catch (err) {
    console.log('loadExcelData: sheetnames failure');
    console.log(err);
    createAndThrowError('coursesdb-api: Could not load Excel file!', 500);
  }

  // convert Excel format to JSON
  try {
    data = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetNames[0]]
    );
    return data;
  } catch {
    console.log('loadExcelData: sheet_to_json failure');
    console.log(err);
    createAndThrowError('coursesdb-api: Could not convert spreadsheet!', 500);
  }
};

// add a course to the database
const addCourseToDb = async (course, creator) => {
  return new Promise(async (resolve, reject) => {

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
      reject(createAndThrowError('coursesdb-api: Adding course failed, please try again later.', 500));
    }
    if (existingCourse) {
      console.log('coursesdb-api: Existing course found');
      reject(createAndThrowError('coursesdb-api: Course exists already, please use edit instead.', 422));
    }

    // compute dates and boolean status vars
    const completedDate = dateObject(course.Finished);
    if (completedDate > startedDate) {
      wasCompleted = true;
      wasStarted = true;
    }
    const currDate = new Date();

    // create a new Course object
    // Note: that the purchaseSequence field being referred to as "n" is an artifact
    // of support for loading courses from an Excel spreadsheet, where this is the
    // column title
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
      description: course.desc,
      notes: course.notes,
      creator: creator,
      provider: course.provider,
      dateAdded: currDate,
      dateUpdated: currDate
    });

    // look for User in the database
    let user;
    try {
      user = await User.findById(creator);
    } catch (err) {
      reject(createAndThrowError('coursesdb-api: Creating course failed, please try again.', 500));
    }

    if (!user) {
      reject(createAndThrowError('coursesdb-api: Could not find user for provided id.', 404));
    }

    // link the COURSE to the USER (mongoose automatically adds just the place id)
    user.courses.push(newCourse);

    // ************************************************************************
    // NOTE: using the "naive" approach to saving data since I was unable to get
    //       the more "sophisticated" session/transaction-based approach to
    //       work successfully.
    // 12/17/21
    // ************************************************************************

    // save the new COURSE and updated USER
    // await newCourse.save();

    // save the updated USER
    // await user.save();

    Promise.all(
      [newCourse, user].map(obj => obj.save())
    ).then(() => {
      resolve(newCourse);
    }
    );

    // resolve(newCourse);

    // ************************************************************************
    // NOTE: would prefer to use the more robust session/transaction-based code
    //       below but I just can't get it to work!  The second call always
    //       fails with a write conflict.
    // 12/17/21
    // ************************************************************************
    // const transactionOptions = {
    //   readPreference: 'primary',
    //   readConcern: { level: 'local' },
    //   writeConcern: { w: 'majority' }
    // };

    // let session;
    // // Start the SESSION
    // session = await mongoose.startSession();

    // try {
    //   await session.withTransaction(async () => {
    //     // save the new COURSE
    //     await newCourse.save({ session: session });

    //     // save the updated USER
    //     await user.save({ session: session });

    //   }, transactionOptions);
    // } finally {
    //   // End the SESSION
    //   await session.endSession();
    // }

    // try {
    //   // Start the TRANSACTION
    //   session.startTransaction();

    //   // save the new COURSE
    //   await newCourse.save({ session: session });

    //   // save the updated USER
    //   await user.save({ session: session });

    //   // Commit the TRANSACTION
    //   await session.commitTransaction();
    // } catch (err) {
    //   console.log(err);
    //   await session.abortTransaction();
    //   createAndThrowError('coursesdb-api: Saving new course failed, please try again.', 500);
    // } finally {
    //   // End the SESSION
    //   await session.endSession();
    // }
    // ************************************************************************
  });
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

  if (creator && creator !== originalCreator) {
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

  // look for User in the database
  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    reject(createAndThrowError('coursesdb-api: Delete course failed, user not found.', 500));
  }

  if (!user) {
    reject(createAndThrowError('coursesdb-api: Could not find user for provided id.', 404));
  }
  try {
    // remove the COURSE from the USER
    user.courses.pull(course);
    await user.save();
  } catch (err) {
    createAndThrowError('coursesdb-api: Something went wrong in remove, could not delete user!', 500);
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

  // console.log(`getCourse: "${course.title}"`);
  res.status(201).json({ course });
};

// return all courses
const getCourses = async (req, res, next) => {
  let courses;
  try {
    courses = await Course.find({});
  } catch (err) {
    return next(new HttpError('courses-api: Fetching courses failed, please try again later.', 500));
  }

  // console.log(`getCourses: ${courses.length} courses listed`);
  res.status(201).json({ courses: courses.map(course => course.toObject({ getters: true })) });
};

// add single course
const addCourse = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(Object.keys(errors));
    // console.log(errors.errors[0].msg);
    const msgs = errors.errors.map(e => {
      console.log(e.msg);
      return e.msg + ' ';
    });
    const message = `Input error: ${JSON.stringify(msgs)}`;
    console.log(message);
    const code = 422;
    return next(new HttpError(message, code));
  }

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
  const filePath = req.file.path;
  // console.log(`Input file is ${filePath}`);
  const creator = req.userData.userId;

  let data;
  try {
    data = loadExcelData(filePath);
  } catch (err) {
    const message = err.message || 'courses-api: Load Excel file failed.';
    const code = err.code || 500;
    return next(new HttpError(message, code));
  }
  console.log(`${data.length} courses retrieved from input file`);

  // let newCourse;

  let editedData = data.map(course => (
    { ...course, notes: '', desc: '', provider: 'Udemy' }
  ));

  let newCourses = editedData.map(course => {
    return addCourseToDb(course, creator);
  });

  // console.log(`Promises array: ${newCourses}`);
  const results = await Promise.all(newCourses)
    // .then((values) => {
    //   console.log('Promises completed');
    // })
    .then(() => {
      // console.log('Returning');
      res.status(201).json({ message: 'Courses added' });
    }
    )
    .catch(err => {
      const message = err.message || 'courses-api: Add course failed, please try again later.';
      const code = err.code || 500;
      return next(new HttpError(message, code));
    });

  // data.map(async course => {
  //   courseEdit = { ...course, notes: '', desc: '', provider: 'Udemy' };
  //   try {
  //     newCourse = await addCourseToDb(course, creator);
  //     // ************************************************************************
  //     // NOTE: unable to get this code to work, the find appears to fail with no
  //     //       useful error info.
  //     // 12/17/21
  //     // ************************************************************************
  //     // get the new courses so they can be returned
  //     // try {
  //     //   const newCourses = await Course.find({});
  //     //   console.log(`${newCourses.length} courses added`);
  //     //   // res.status(200).json(newCourses);
  //     // }
  //     // catch (err) {
  //     //   const message = err.message || 'courses-api: List-after-add-courses failed, please try again later.';
  //     //   const code = err.code || 500;
  //     //   console.log("Error inner try");
  //     //   console.log(err);
  //     //   // return next(new HttpError(message, code));
  //     //   // res.status(code).json({
  //     //   //   message: message
  //     //   // });
  //     // }
  //     // ************************************************************************
  //   } catch (err) {
  //     const message = err.message || 'courses-api: Add course failed, please try again later.';
  //     const code = err.code || 500;
  //     return next(new HttpError(message, code));
  //     // res.status(code).json({
  //     //   message: message
  //     // });
  //   }
  // });
  // res.status(201).json({ message: 'Courses added' });
};

// delete single course
const deleteCourse = async (req, res, next) => {
  const courseId = req.params.cid;
  const creator = req.userData.userId;

  let title = "";
  try {
    title = await deleteCourseFromDb(courseId, creator);
  } catch (err) {
    const message = err.message || 'courses-api: Delete course failed, please try again later.';
    const code = err.code || 500;
    return next(new HttpError(message, code));
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
      await deleteCourseFromDb(course._id, creator);
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

  // const { title, description, notes } = req.body;
  const { update } = req.body;

  let course;
  try {
    course = await Course.findById(courseId).populate('creator');
  }
  catch (err) {
    return next(new HttpError('courses-api: Something went wrong, could not update course!', 500));
  }

  if (!course) {
    createAndThrowError('coursesdb-api: Could not find course for provided id.', 404);
  }

  let originalCreator = null;
  if (course.creator && course.creator.id) {
    originalCreator = course.creator.id;
  } else {
    console.log('updateCourse: creator.id not populated correctly');
    createAndThrowError('coursesdb-api: Invalid creator id.', 404);
  }

  if (creator && creator !== originalCreator) {
    console.log('updateCourse: creator mismatch');
    createAndThrowError('coursesdb-api: Not the owner of this course, cannot be updated.', 403);
  }

  const validFields = Object.keys(Course.schema.obj);
  const updateKeys = Object.keys(update);
  updateKeys.forEach((key, index) => {
    if (validFields.includes(key)) {
      console.log(`Updating key "${key}": ${update[key]}`);
      course[key] = update[key];
    } else {
      console.log(`Key ${key} not found in database!`);
    }
  });
  course.dateUpdated = new Date();

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
