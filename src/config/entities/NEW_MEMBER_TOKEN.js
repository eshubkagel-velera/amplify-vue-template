export default {
  name: 'NEW_MEMBER_TOKEN',
  idField: 'NEW_MEMBER_TOKEN_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['NEW_MEMBER_TOKEN_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['FIRST_NAME'],
    stringMatchFields: ['FIRST_NAME'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "NEW_MEMBER_TOKEN_ID",
    "MEMBER_NBR",
    "CARD_NBR",
    "PERSON_NBR",
    "LOAN_APP_ID",
    "FIRST_NAME",
    "LAST_NAME",
    "DOB",
    "TAX_ID",
    "EMAIL_ADDRESS_TEXT",
    "ZIP_CODE",
    "HOME_PHONE_NBR",
    "MOBILE_PHONE_NBR",
    "TOKEN_VALUE",
    "TOKEN_USED_FLAG",
    "CREATED_DATE",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "MEMBER_NBR",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "CARD_NBR",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "PERSON_NBR",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "LOAN_APP_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "FIRST_NAME",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "LAST_NAME",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "DOB",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "TAX_ID",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "EMAIL_ADDRESS_TEXT",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "ZIP_CODE",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "HOME_PHONE_NBR",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "MOBILE_PHONE_NBR",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "TOKEN_VALUE",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "TOKEN_USED_FLAG",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "CREATED_DATE",
      "type": "text",
      "required": false,
      "disabled": true
    },
    {
      "name": "CHANGED_DATE",
      "type": "text",
      "required": false,
      "disabled": true
    }
  ]
};