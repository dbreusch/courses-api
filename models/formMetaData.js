const formMetaData = [
  {
    "id": "n",
    "alias": "purchaseSequence",
    "label": "Purchase Sequence",
    "constraints": [['require'], ['numeric_int'], ['min', 1]],
    "type": "number",
    "errorText": "Please enter an integer purchase sequence > 0.",
    "initialValue": "loadedCourse.purchaseSequence",
    "isPublic": false,
    "isUpdateable": true,
    "formDisplay": "form-control--inline"
  },
  {
    "id": "title",
    "label": "Title",
    "constraints": [['require'], ['min_length', 5]],
    "errorText": "Title must be at least five characters.",
    "initialValue": "loadedCourse.title",
    "isPublic": true,
    "isUpdateable": true
  },
  {
    "id": "category",
    "label": "Category",
    "constraints": [['require']],
    "errorText": "Please enter a valid category value.",
    "initialValue": "loadedCourse.category",
    "isPublic": true,
    "isUpdateable": true,
    "formDisplay": "form-control--inline"
  },
  {
    "id": "tools",
    "label": "Tools",
    "constraints": [['require']],
    "errorText": "Please enter a valid tools value.",
    "initialValue": "loadedCourse.tools",
    "isPublic": true,
    "isUpdateable": true,
    "formDisplay": "form-control--inline"
  },
  {
    "id": "hours",
    "label": "Hours",
    "constraints": [['require'], ['numeric_float'], ['gt', 0]],
    "errorText": "# of hours value must be > 0.",
    "initialValue": "loadedCourse.hours",
    "isPublic": true,
    "isUpdateable": true,
    "formDisplay": "form-control--inline"
  },
  {
    "id": "sections",
    "label": "Sections",
    "constraints": [['require'], ['numeric_int'], ['gt', 0]],
    "errorText": "Please enter an integer # of sections value > 0.",
    "initialValue": "loadedCourse.sections",
    "isPublic": true,
    "isUpdateable": true,
    "formDisplay": "form-control--inline"
  },
  {
    "id": "lectures",
    "label": "Lectures",
    "constraints": [['require'], ['numeric_int'], ['gt', 0]],
    "errorText": "Please enter an integer # of lectures value > 0.",
    "initialValue": "loadedCourse.lectures",
    "isPublic": true,
    "isUpdateable": true,
    "formDisplay": "form-control--inline"
  },
  {
    "id": "instructor",
    "label": "Instructor",
    "constraints": [['require'], ['min_length', 3]],
    "errorText": "Instructor name must be at least three characters.",
    "initialValue": "loadedCourse.instructor",
    "isPublic": true,
    "isUpdateable": true,
    "formDisplay": "form-control--inline"
  },
  {
    "id": "provider",
    "label": "Provider",
    "constraints": [],
    "errorText": "Please enter a valid provider name.",
    "initialValue": "loadedCourse.provider",
    "initialIsValid": true,
    "isPublic": true,
    "isUpdateable": true,
    "formDisplay": "form-control--inline"
  },
  {
    "id": "dateBought",
    "label": "Date Bought",
    "type": "date",
    "constraints": [['require']],
    "errorText": "Please enter a valid bought date.",
    "initialValue": "loadedCourse.dateBought",
    "isPublic": false,
    "isUpdateable": true,
    "formDisplay": "form-control--inline"
  },
  {
    "id": "dateStarted",
    "label": "Date Started",
    "type": "date",
    "constraints": [],
    "errorText": "Please enter a valid start date.",
    "initialValue": "loadedCourse.dateStarted",
    "initialIsValid": true,
    "isPublic": false,
    "isUpdateable": true,
    "formDisplay": "form-control--inline"
  },
  {
    "id": "dateCompleted",
    "label": "Date Completed",
    "type": "date",
    "constraints": [],
    "errorText": "Please enter a valid completion date.",
    "initialValue": "loadedCourse.dateCompleted",
    "initialIsValid": true,
    "isPublic": false,
    "isUpdateable": true,
    "formDisplay": "form-control--inline"
  },
  {
    "id": "description",
    "element": "textarea",
    "label": "Description",
    "constraints": [],
    "errorText": "Please enter a valid description.",
    "initialValue": "loadedCourse.description",
    "initialIsValid": true,
    "isPublic": true,
    "isUpdateable": true,
    "isScrollable": true
  },
  {
    "id": "notes",
    "element": "textarea",
    "label": "Notes",
    "constraints": [],
    "errorText": "Please enter valid notes.",
    "initialValue": "loadedCourse.notes",
    "initialIsValid": true,
    "isPublic": true,
    "isUpdateable": true,
    "isScrollable": true
  },
];

exports.formMetaData = formMetaData;
