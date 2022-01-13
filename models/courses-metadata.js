const metadata = {
  "purchaseSequence": {
    "description": "Position within overall course purchase history",
    "type": "Number",
    "required": "true",
    "admin": "true",
    "source": "Excel",
    "sourceField": "n",
    "form": {
      "constraints": [['require'], ['numeric_int'], ['min', 1]],
      "type": "number",
      "errorText": "Please enter an integer purchase sequence > 0.",
      "isUpdateable": true
    }
  },
  "title": {
    "description": "Course title",
    "type": "String",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Title",
    "form": {
      "constraints": [['require'], ['min_length', 5]],
      "errorText": "Title must be at least five characters.",
      "isUpdateable": true
    }
  },
  "category": {
    "description": "Course category",
    "type": "String",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Category",
    "form": {
      "constraints": [['require']],
      "errorText": "Please enter a valid category value.",
      "isUpdateable": true
    }
  },
  "tools": {
    "description": "Course tools/topics",
    "type": "String",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Tools",
    "form": {
      "constraints": [['require']],
      "errorText": "Please enter a valid tools value.",
      "isUpdateable": true
    }
  },
  "hours": {
    "description": "Hours of course video",
    "type": "Number",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Hours",
    "form": {
      "constraints": [['require'], ['numeric_float'], ['gt', 0]],
      "errorText": "# of hours value must be > 0.",
      "isUpdateable": true
    }
  },
  "sections": {
    "description": "Number of course sections/modules",
    "type": "Number",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Sections",
    "form": {
      "constraints": [['require'], ['numeric_int'], ['gt', 0]],
      "errorText": "Please enter an integer # of sections value > 0.",
      "isUpdateable": true
    }
  },
  "lectures": {
    "description": "Number of individual course lectures",
    "type": "Number",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Lectures",
    "form": {
      "constraints": [['require'], ['numeric_int'], ['gt', 0]],
      "errorText": "Please enter an integer # of lectures value > 0.",
      "isUpdateable": true
    }
  },
  "instructor": {
    "description": "Name of course instructor",
    "type": "String",
    "required": "true",
    "admin": "false",
    "source": "Excel",
    "sourceField": "Instructor",
    "form": {
      "constraints": [['require'], ['min_length', 3]],
      "errorText": "Instructor name must be at least three characters.",
      "isUpdateable": true
    }
  },
  "dateBought": {
    "description": "Date course purchased/acquired",
    "type": "Date",
    "required": "true",
    "admin": "true",
    "source": "Excel",
    "sourceField": "Bought",
    "form": {
      "type": "date",
      "constraints": [['require']],
      "errorText": "Please enter a valid bought date.",
      "isUpdateable": true
    }
  },
  "dateStarted": {
    "description": "Date course started",
    "type": "Date",
    "required": "false",
    "admin": "false",
    "source": "Derived",
    "form": {
      "type": "date",
      "constraints": [],
      "errorText": "Please enter a valid start date.",
      "isUpdateable": true
    }
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
    "sourceField": "Finished",
    "form": {
      "type": "date",
      "constraints": [],
      "errorText": "Please enter a valid completion date.",
      "isUpdateable": true
    }
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
    "source": "Manual",
    "form": {
      "constraints": [],
      "errorText": "Please enter a valid description.",
      "isUpdateable": true
    }
  },
  "notes": {
    "description": "Additional course notes",
    "type": "String",
    "required": "false",
    "admin": "false",
    "source": "Manual",
    "form": {
      "constraints": [],
      "errorText": "Please enter valid notes.",
      "isUpdateable": true
    }
  },
  "creator": {
    "description": "User that created the course in the database",
    "type": "mongoose.Types.ObjectId",
    "ref": "User",
    "required": "true",
    "admin": "true",
    "source": "Derived"
  },
  "provider": {
    "description": "Course provider (Udemy, LinkedIn, etc.)",
    "type": "String",
    "required": "false",
    "admin": "false",
    "source": "Manual",
    "form": {
      "constraints": [],
      "errorText": "Please enter a valid provider name.",
      "isUpdateable": true
    }
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
