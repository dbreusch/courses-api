const metadata = {
  "purchaseSequence": {
    "description": "Position with overall course purchase history",
    "type": "Number",
    "required": "true",
    "admin": "true",
    "source": "Excel",
    "sourceField": "n"
  },
  "title": {
    "description": "Course title",
    "type": "String",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Title"
  },
  "category": {
    "description": "Course category",
    "type": "String",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Category"
  },
  "tools": {
    "description": "Course tools/topics",
    "type": "String",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Tools"
  },
  "hours": {
    "description": "Hours of course video",
    "type": "Number",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Hours"
  },
  "sections": {
    "description": "Number of course sections/modules",
    "type": "Number",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Sections"
  },
  "lectures": {
    "description": "Number of individual course lectures",
    "type": "Number",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Lectures"
  },
  "instructor": {
    "description": "Name of course instructor",
    "type": "String",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Instructor"
  },
  "dateBought": {
    "description": "Date course purchased/acquired",
    "type": "Date",
    "required": "true",
    "admin": "true",
    "source": "Excel",
    "sourceField": "Bought"
  },
  "dateStarted": {
    "description": "Date course started",
    "type": "Date",
    "required": "false",
    "admin": "false",
    "source": "Derived"
  },
  "started": {
    "description": "Has course been started",
    "type": "Boolean",
    "required": "false",
    "admin": "false",
    "source": "Derived"
  },
  "dateCompleted": {
    "description": "Date course finished",
    "type": "Date",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Finished"
  },
  "completed": {
    "description": "Has course been completed",
    "type": "Boolean",
    "required": "false",
    "admin": "false",
    "source": "Derived"
  },
  "description": {
    "description": "Course description",
    "type": "String",
    "required": "false",
    "admin": "false",
    "source": "Manual"
  },
  "notes": {
    "description": "Additional course notes",
    "type": "String",
    "required": "false",
    "admin": "false",
    "source": "Manual"
  },
  "creator": {
    "description": "User that created the course in the database",
    "type": "mongoose.Types.ObjectId",
    "required": "true",
    "admin": "true",
    "source": "Derived"
  },
  "provider": {
    "description": "Course provider (Udemy, LinkedIn, etc.)",
    "type": "String",
    "required": "false",
    "admin": "false",
    "source": "Manual"
  },
  "dateAdded": {
    "description": "Date course added to database",
    "type": "Date",
    "required": "false",
    "admin": "true",
    "source": "Derived"
  },
  "dateUpdated": {
    "description": "Date course last updated in database",
    "type": "Date",
    "required": "false",
    "admin": "true",
    "source": "Derived"
  },
};

exports.metadata = metadata;
