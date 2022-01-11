// coursesdb-controllers: action functions
const xlsx = require('xlsx');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const { createAndThrowError } = require('../helpers/error');
const HttpError = require('../helpers/http-error');
// const { getEnvVar } = require('../helpers/getEnvVar');
const Course = require('../models/course');
const User = require('../models/user');
const { formMetaData } = require('../models/formMetaData');
const res = require('express/lib/response');

// **********************************************************************************************
// utility functions start here!
// **********************************************************************************************

// handle all defined app errors here
const handleError = ({ message, code, err, errType = 'HttpError', errFn }) => {
  console.log(`${message}, ${code}`);
  if (err) {
    console.log(err);
  }
  switch (errType) {
    case 'createAndThrowError':
      createAndThrowError(message, code);
      break;
    case 'reject':
      return errFn({ message: message, code: code });
    case 'HttpError':
      return errFn(new HttpError(message, code));
    default:
      console.log(`Error function ${errType} not recognized!`);
      createAndThrowError(message, code);
  }
};

// wrapper for internal function errors
// const handleStandardError = (message, code, err) => {
//   console.log(`${message}, ${code}`);
//   if (err) {
//     console.log(err);
//   }
//   createAndThrowError(message, code);
// };

// wrapper for promise reject errors
// const handlePromiseReject = (reject, message, code, err) => {
//   console.log(`${message}, ${code}`);
//   if (err) {
//     console.log(err);
//   }
//   return reject({ message: message, code: code });
// };

// wrapper for HTTP errors
// const handleHttpError = (next, message, code, err) => {
//   console.log(`${message}, ${code}`);
//   if (err) {
//     console.log(err);
//   }
//   return next(new HttpError(message, code));
// };

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
  let workbook, sheetNames, data, message;
  const code = 500;

  // read file
  try {
    workbook = xlsx.readFile(filePath, { cellDates: true });
  } catch (err) {
    message = `loadExcelData: failure, unable to read ${filePath}`;
    // handleStandardError(message, code, err);
    handleError({ message, code, err, errType: 'createAndThrowError' });
  }

  // get sheet names
  try {
    sheetNames = workbook.SheetNames;
  } catch (err) {
    message = `loadExcelData: failure, unable to retrieve sheetnames from ${filePath}`;
    // handleStandardError(message, code, err);
    handleError({ message, code, err, errType: 'createAndThrowError' });
  }

  // convert Excel format to JSON
  try {
    data = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetNames[0]]
    );
    return data;
  } catch (err) {
    message = `loadExcelData: failure, unable to convert spreadsheet ${filePath} to JSON`;
    // handleStandardError(message, code, err);
    handleError({ message, code, err, errType: 'createAndThrowError' });
  }
};

// add a course to the database
const addCourseToDb = async (course, creator) => {
  return new Promise(async (resolve, reject) => {
    let message, code;
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
            { instructor: instructor },
            { creator: creator }
          ]
        }
      ).populate('creator');
    } catch (err) {
      message = 'coursesdb-api: Error with database while checking for existing course, please try again later.';
      code = 500;
      // return handlePromiseReject(reject, message, code, err);
      return handleError({ message, code, err, errType: 'reject' });
    }
    if (existingCourse) {
      message = `coursesdb-api: Course "${title}" exists already, please use edit instead`;
      code = 400;
      // return handlePromiseReject(reject, message, code);
      return handleError({ message, code, err, errType: 'reject', errFn: reject });
    };

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
    let newCourse;
    try {
      newCourse = new Course({
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
    } catch (err) {
      message = 'coursesdb-api: Error creating new Course instance.';
      code = 500;
      // return handlePromiseReject(reject, message, code, err);
      return handleError({ message, code, err, errType: 'reject', errFn: reject });
    }

    // look for User in the database
    let user;
    try {
      user = await User.findById(creator);
    } catch (err) {
      message = 'coursesdb-api: Database error looking for creating user, please try again.';
      code = 500;
      // return handlePromiseReject(reject, message, code, err);
      return handleError({ message, code, err, errType: 'reject', errFn: reject });
    }

    if (!user) {
      message = 'coursesdb-api: Database error, could not find user for provided id.';
      code = 400;
      // return handlePromiseReject(reject, message, code);
      return handleError({ message, code, err, errType: 'reject', errFn: reject });
    }

    // link the COURSE to the USER (mongoose automatically adds just the course id)
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
const deleteCourseFromDb = async (courseId, creator, isAdmin) => {
  let message, code;
  let course;
  try {
    course = await Course.findById(courseId).populate('creator');
  }
  catch (err) {
    message = 'coursesdb-api: Something went wrong in findById, could not delete course!';
    code = 500;
    // handleStandardError(message, code, err);
    handleError({ message, code, err, errType: 'createAndThrowError' });
  }

  if (!course) {
    message = 'coursesdb-api: Could not find course for provided id.';
    code = 404;
    // handleStandardError(message, code);
    handleError({ message, code, err, errType: 'createAndThrowError' });
  }

  let originalCreator = null;
  if (course.creator && course.creator.id) {
    originalCreator = course.creator.id;
  } else {
    message = 'deleteCourseFromDb: creator.id not populated correctly.';
    code = 404;
    // handleStandardError(message, code);
    handleError({ message, code, err, errType: 'createAndThrowError' });
  }

  if (creator && creator !== originalCreator) {
    if (!isAdmin) {
      message = 'deleteCourseFromDb: Not the owner of this course, cannot be deleted.';
      code = 403;
      // handleStandardError(message, code);
      handleError({ message, code, err, errType: 'createAndThrowError' });
    }
  }

  const title = course.title;
  try {
    // delete course
    await course.remove();
  } catch (err) {
    message = 'deleteCourseFromDb: Something went wrong in remove, could not delete course!';
    code = 500;
    // handleStandardError(message, code, err);
    handleError({ message, code, err, errType: 'createAndThrowError' });
  }

  // look for User in the database
  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    message = 'deleteCourseFromDb: Delete course failed, user not found.';
    code = 500;
    // handleStandardError(message, code, err);
    handleError({ message, code, err, errType: 'createAndThrowError' });
  }

  if (!user) {
    message = 'deleteCourseFromDb: Could not find user for provided id.';
    code = 404;
    // handleStandardError(message, code);
    handleError({ message, code, err, errType: 'createAndThrowError' });
  }
  try {
    // remove the COURSE from the USER
    user.courses.pull(course);
    await user.save();
  } catch (err) {
    message = 'deleteCourseFromDb: Something went wrong in remove, could not delete user!';
    code = 500;
    // handleStandardError(message, code, err);
    handleError({ message, code, err, errType: 'createAndThrowError' });
  }

  return title;
};

// **********************************************************************************************
//
// exported functions start here!
// **********************************************************************************************

// return a single course
const getCourse = async (req, res, next) => {
  const courseId = req.params.cid;
  let message, code;

  let course;
  try {
    course = await Course.findById(courseId);
  }
  catch (err) {
    message = 'courses-api: Something went wrong in findById, could not get course!';
    code = 500;
    // return next(new HttpError('courses-api: Something went wrong in findById, could not get course!', 500));
    return handleError({ message, code, err, errFn: next });
  }

  if (!course) {
    message = 'courses-api: Could not find course for provided id.';
    code = 404;
    // return next(new HttpError('courses-api: Could not find course for provided id.', 404));
    return handleError({ message, code, errFn: next });
  }

  // console.log(`getCourse: "${course.title}"`);
  res.status(201).json({ course });
};

// return all courses
const getCourses = async (req, res, next) => {
  let message, code;
  let courses;
  try {
    courses = await Course.find({});
  } catch (err) {
    message = 'courses-api: Fetching courses failed, please try again later.';
    code = 500;
    // return next(new HttpError('courses-api: Fetching courses failed, please try again later.', 500));
    return handleError({ message, code, err, errFn: next });
  }

  // console.log(`getCourses: ${courses.length} courses listed`);
  res.status(201).json({ courses: courses.map(course => course.toObject({ getters: true })) });
};

// add single course
const addCourse = async (req, res, next) => {
  let message, code;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msgs = errors.errors.map(e => {
      return e.msg + ' ';
    });
    message = `Input error: ${JSON.stringify(msgs)}`;
    code = 422;
    // return next(new HttpError(message, code));
    return handleError({ message, code, errFn: next });
  }

  const { course } = req.body;
  const creator = req.userData.userId;

  let newCourse;
  try {
    newCourse = await addCourseToDb(course, creator, next);
  } catch (err) {
    message = err.message || 'courses-api: Add course failed, please try again later.';
    code = err.code || 500;
    // return next(new HttpError(message, code));
    return handleError({ message, code, err, errFn: next });
  }

  console.log(`Added course "${newCourse.title}"`);
  res.status(200).json(newCourse);
};

// add multiple courses (from Excel file)
const addCourses = async (req, res, next) => {
  let message, code;
  const filePath = req.file.path;
  // console.log(`Input file is ${filePath}`);
  const creator = req.userData.userId;

  let data;
  try {
    data = loadExcelData(filePath);
  } catch (err) {
    message = err.message || 'courses-api: Load Excel file failed.';
    code = err.code || 500;
    // return next(new HttpError(message, code));
    return handleError({ message, code, err, errFn: next });
  }
  console.log(`${data.length} courses retrieved from input file`);

  let editedData = data.map(course => (
    { ...course, notes: '', desc: '', provider: 'Udemy' }
  ));

  let addCoursePromises = editedData.map(course => {
    return addCourseToDb(course, creator);
  });

  // console.log(`Promises array: ${addCoursePromises}`);
  const results = await Promise.all(addCoursePromises)
    .then(() => {
      res.status(201).json({ message: 'Courses added' });
    }
    )
    .catch(err => {
      message = err.message || 'courses-api: Add course failed, please try again later.';
      code = err.code || 500;
      res.status(code).json({ message: message });
    });

  // let newCourse;
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
  //     //   const addCoursePromises = await Course.find({});
  //     //   console.log(`${addCoursePromises.length} courses added`);
  //     //   // res.status(200).json(addCoursePromises);
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
  let message, code;
  const courseId = req.params.cid;
  const creator = req.userData.userId;
  const isAdmin = req.userData.isAdmin;

  let title = "";
  try {
    title = await deleteCourseFromDb(courseId, creator, isAdmin);
  } catch (err) {
    message = err.message || 'courses-api: Delete course failed, please try again later.';
    code = err.code || 500;
    // return next(new HttpError(message, code));
    return handleError({ message, code, err, errFn: next });
  }

  console.log(`Deleted "${title}"`);
  res.status(201).json({
    message: `Deleted ${courseId}`
  });
};

// delete all courses
const deleteCourses = async (req, res, next) => {
  let message, code;
  const creator = req.userData.userId;
  let courses;

  try {
    courses = await Course.find({});
  } catch (err) {
    message = 'courses-api: Fetching courses failed, please try again later.';
    code = 500;
    // return next(new HttpError('courses-api: Fetching courses failed, please try again later.', 500));
    return handleError({ message, code, err, errFn: next });
  }

  courses.map(async course => {
    try {
      await deleteCourseFromDb(course._id, creator);
    } catch (err) {
      message = err.message || 'courses-api: Delete course failed, please try again later.';
      code = err.code || 500;
      // return next(new HttpError(message, code));
      return handleError({ message, code, err, errFn: next });
    }
  }
  );

  console.log(`${courses.length} courses deleted`);
  res.status(201).json({
    message: `${courses.length} courses deleted`
  });
};

// update single course (PATCH)
// fields are handled dynamically
const updateCourse = async (req, res, next) => {
  let message, code;
  const courseId = req.params.cid;
  const creator = req.userData.userId;
  const isAdmin = req.userData.isAdmin;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    message = 'coursesdb-api: updateCourse: Invalid inputs passed, please check your data.';
    code = 422;
    // return next(new HttpError('coursesdb-api: updateCourse: Invalid inputs passed, please check your data.', 422));
    return handleError({ message, code, errFn: next });
  }

  const { update } = req.body;

  let course;
  try {
    course = await Course.findById(courseId).populate('creator');
  }
  catch (err) {
    message = 'coursesdb-api: updateCourse: Something went wrong, could not update course!';
    code = 500;
    // return next(new HttpError('coursesdb-api: updateCourse: Something went wrong, could not update course!', 500));
    return handleError({ message, code, err, errFn: next });
  }

  if (!course) {
    message = 'coursesdb-api: updateCourse: Could not find course for provided id!';
    code = 404;
    // return next(new HttpError('coursesdb-api: updateCourse: Could not find course for provided id!', 404));
    return handleError({ message, code, errFn: next });
  }

  let originalCreator = null;
  if (course.creator && course.creator.id) {
    originalCreator = course.creator.id;
  } else {
    console.log('coursesdb-api: updateCourse: creator.id not populated correctly');
    message = 'coursesdb-api: updateCourse: Invalid creator id.';
    code = 404;
    // return next(new HttpError('coursesdb-api: updateCourse: Invalid creator id.', 404));
    return handleError({ message, code, errFn: next });
  }

  if (creator && creator !== originalCreator) {
    if (!isAdmin) {
      console.log('coursesdb-api: updateCourse: creator mismatch');
      message = 'coursesdb-api: updateCourse: Not the owner of this course, cannot be updated.';
      code = 403;
      // return next(new HttpError('coursesdb-api: updateCourse: Not the owner of this course, cannot be updated.', 403));
      return handleError({ message, code, errFn: next });
    }
  }

  const validFields = Object.keys(Course.schema.obj);
  const updateKeys = Object.keys(update);
  updateKeys.forEach((key, index) => {
    if (validFields.includes(key)) {
      if (key === "description" || key === "notes") {
        console.log(`updateCourse: Updating key "${key}": ${update[key].slice(0, 24) + "..."}`);
      } else {
        console.log(`updateCourse: Updating key "${key}": ${update[key]}`);
      }
      course[key] = update[key];
    } else {
      console.log(`updateCourse: Key ${key} not found in database!`);
    }
  });
  course.dateUpdated = new Date();

  try {
    await course.save();
  } catch (err) {
    message = 'coursesdb-api: updateCourse: Something went wrong, could not update course!';
    code = 500;
    // return next(new HttpError('coursesdb-api: updateCourse: Something went wrong, could not update course!', 500));
    return handleError({ message, code, err, errFn: next });
  }

  console.log(`updateCourse: Course "${course.title}" updated`);
  res.status(200).json({ course: course.toObject({ getters: true }) });
};

// return course metadata
const getMetadata = async (req, res, next) => {
  res.status(201).json({ metadata: formMetaData });
  // res.status(201).json({ message: 'abc 123' });
};

// exports
exports.getCourse = getCourse;
exports.getCourses = getCourses;
exports.addCourse = addCourse;
exports.addCourses = addCourses;
exports.deleteCourse = deleteCourse;
exports.deleteCourses = deleteCourses;
exports.updateCourse = updateCourse;
exports.getMetadata = getMetadata;
