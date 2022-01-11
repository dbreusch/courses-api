const formMetaData = [
  {
    "id": "purchaseSequence",
    "constraints": [['require'], ['numeric_int'], ['min', 1]],
    "type": "number",
    "errorText": "Please enter an integer purchase sequence > 0.",
    "isUpdateable": true
  },
  {
    "id": "title",
    "constraints": [['require'], ['min_length', 5]],
    "errorText": "Title must be at least five characters.",
    "isUpdateable": true
  },
  {
    "id": "category",
    "constraints": [['require']],
    "errorText": "Please enter a valid category value.",
    "isUpdateable": true
  },
  {
    "id": "tools",
    "constraints": [['require']],
    "errorText": "Please enter a valid tools value.",
    "isUpdateable": true
  },
  {
    "id": "hours",
    "constraints": [['require'], ['numeric_float'], ['gt', 0]],
    "errorText": "# of hours value must be > 0.",
    "isUpdateable": true
  },
  {
    "id": "sections",
    "constraints": [['require'], ['numeric_int'], ['gt', 0]],
    "errorText": "Please enter an integer # of sections value > 0.",
    "isUpdateable": true
  },
  {
    "id": "lectures",
    "constraints": [['require'], ['numeric_int'], ['gt', 0]],
    "errorText": "Please enter an integer # of lectures value > 0.",
    "isUpdateable": true
  },
  {
    "id": "instructor",
    "constraints": [['require'], ['min_length', 3]],
    "errorText": "Instructor name must be at least three characters.",
    "isUpdateable": true
  },
  {
    "id": "provider",
    "constraints": [],
    "errorText": "Please enter a valid provider name.",
    "isUpdateable": true
  },
  {
    "id": "dateBought",
    "type": "date",
    "constraints": [['require']],
    "errorText": "Please enter a valid bought date.",
    "isUpdateable": true
  },
  {
    "id": "dateStarted",
    "type": "date",
    "constraints": [],
    "errorText": "Please enter a valid start date.",
    "isUpdateable": true
  },
  {
    "id": "dateCompleted",
    "type": "date",
    "constraints": [],
    "errorText": "Please enter a valid completion date.",
    "isUpdateable": true
  },
  {
    "id": "description",
    "constraints": [],
    "errorText": "Please enter a valid description.",
    "isUpdateable": true
  },
  {
    "id": "notes",
    "constraints": [],
    "errorText": "Please enter valid notes.",
    "isUpdateable": true
  },
];

exports.formMetaData = formMetaData;
