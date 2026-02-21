export const GLOBAL_CONSTANTS = {
  API_ENDPOINTS: {
    MASTER: {
      GET_ALL_CATEGORIES: '/get-categories',
      GET_ALL_STATUSES: '/get-statuses',
      SAVE_ENQUIRY: '/create-enquiry',
      GET_ENQUIRIES: '/get-enquiries',
    },
  },
  VALIDATION: {
    CUSTOMER_NAME_MESSAGE: 'Name is required',
    CUSTOMER_NAME_LENGTH_MESSAGE: (char: any) => `Name must be at least ${char} characters`,
    CUSTOMER_EMAIL_MESSAGE: 'Email is required',
    CUSTOMER_EMAIL_VALID_MESSAGE: 'Please enter a valid email address',
    CUSTOMER_PHONE_MESSAGE: 'Phone number is required',
    CUSTOMER_PHONE_DIGIT_MESSAGE: 'Phone must be a 10-digit number',
    MESSAGE_MESSAGE: 'Message is required',
    CATEGORY_ID_MESSAGE: 'Category is required',
    STATUS_ID_MESSAGE: 'Status is required',
    ENQUIRY_TYPE_MESSAGE: 'Enquiry type is required',

    // IS_CONVERTED_MESSAGE: '',
    // ENQUIRY_DATE_MESSAGE: '',
    // FOLLOW_UP_DATE_MESSAGE: '',
    // FEEDBACK_MESSAGE: '',

    PASSWORD: 'Password is required',
    PASSWORD_LENGTH: (char: any) => `Password must be at least ${char} characters`,
  },
  COLORS: ['warning', 'info', 'success', 'primary', 'danger', 'secondary', 'dark'],
  STATUS_COLORS: {
    IN_PROGRESS: 'warning',
    CONTACTED: 'info',
    RESOLVED: 'primary',
    CLOSED: 'danger',
    NEW: 'success',
  },
  TOAST: {
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    NETWORK_ERROR: 'Unable to connect to the server. Please check your connection.',
    PERMISSION_DENIED: "You don't have permission to perform this action.",
    UNEXPECTED_ERROR: 'Something went wrong. Please try again.',
    POST_CREATED: 'Post created successfully!',
    POST_UPDATED: 'Post updated successfully!',
    POST_DELETE_FAILED: 'Failed to delete the post. Your changes have been restored.',
    POST_CREATE_FAILED: 'Failed to create the post. Please try again.',
  },
  ERROR_PAGE: {
    TITLE: 'Something went wrong',
    SUBTITLE: 'An unexpected error occurred in the application.',
    SUGGESTION: 'Try refreshing the page. If the problem persists, please contact support.',
    REFRESH_LABEL: 'Refresh Page',
    HOME_LABEL: 'Go to Home',
  },
  TIME_ZONES: [
    // UTC -12
    { label: 'UTC -12:00 (Baker Island)', value: 'Etc/GMT+12', utcOffset: '-12:00' },

    // UTC -11
    { label: 'UTC -11:00 (American Samoa)', value: 'Pacific/Pago_Pago', utcOffset: '-11:00' },

    // UTC -10
    { label: 'UTC -10:00 (Hawaii)', value: 'Pacific/Honolulu', utcOffset: '-10:00' },

    // UTC -9
    { label: 'UTC -09:00 (Alaska)', value: 'America/Anchorage', utcOffset: '-09:00' },

    // UTC -8
    {
      label: 'UTC -08:00 (Pacific Time - US & Canada)',
      value: 'America/Los_Angeles',
      utcOffset: '-08:00',
    },

    // UTC -7
    {
      label: 'UTC -07:00 (Mountain Time - US & Canada)',
      value: 'America/Denver',
      utcOffset: '-07:00',
    },

    // UTC -6
    {
      label: 'UTC -06:00 (Central Time - US & Canada)',
      value: 'America/Chicago',
      utcOffset: '-06:00',
    },

    // UTC -5
    {
      label: 'UTC -05:00 (Eastern Time - US & Canada)',
      value: 'America/New_York',
      utcOffset: '-05:00',
    },

    // UTC -4
    { label: 'UTC -04:00 (Atlantic Time - Canada)', value: 'America/Halifax', utcOffset: '-04:00' },

    // UTC -3
    {
      label: 'UTC -03:00 (Argentina)',
      value: 'America/Argentina/Buenos_Aires',
      utcOffset: '-03:00',
    },

    // UTC -2
    { label: 'UTC -02:00 (South Georgia)', value: 'Atlantic/South_Georgia', utcOffset: '-02:00' },

    // UTC -1
    { label: 'UTC -01:00 (Azores)', value: 'Atlantic/Azores', utcOffset: '-01:00' },

    // UTC 0
    { label: 'UTC +00:00 (London)', value: 'Europe/London', utcOffset: '+00:00' },
    { label: 'UTC +00:00 (UTC)', value: 'Etc/UTC', utcOffset: '+00:00' },

    // UTC +1
    { label: 'UTC +01:00 (Berlin)', value: 'Europe/Berlin', utcOffset: '+01:00' },
    { label: 'UTC +01:00 (Paris)', value: 'Europe/Paris', utcOffset: '+01:00' },

    // UTC +2
    { label: 'UTC +02:00 (Athens)', value: 'Europe/Athens', utcOffset: '+02:00' },
    { label: 'UTC +02:00 (Cairo)', value: 'Africa/Cairo', utcOffset: '+02:00' },

    // UTC +3
    { label: 'UTC +03:00 (Moscow)', value: 'Europe/Moscow', utcOffset: '+03:00' },
    { label: 'UTC +03:00 (Riyadh)', value: 'Asia/Riyadh', utcOffset: '+03:00' },

    // UTC +3:30
    { label: 'UTC +03:30 (Tehran)', value: 'Asia/Tehran', utcOffset: '+03:30' },

    // UTC +4
    { label: 'UTC +04:00 (Dubai)', value: 'Asia/Dubai', utcOffset: '+04:00' },

    // UTC +4:30
    { label: 'UTC +04:30 (Kabul)', value: 'Asia/Kabul', utcOffset: '+04:30' },

    // UTC +5
    { label: 'UTC +05:00 (Karachi)', value: 'Asia/Karachi', utcOffset: '+05:00' },

    // UTC +5:30
    { label: 'UTC +05:30 (India Standard Time)', value: 'Asia/Kolkata', utcOffset: '+05:30' },

    // UTC +5:45
    { label: 'UTC +05:45 (Nepal)', value: 'Asia/Kathmandu', utcOffset: '+05:45' },

    // UTC +6
    { label: 'UTC +06:00 (Dhaka)', value: 'Asia/Dhaka', utcOffset: '+06:00' },

    // UTC +7
    { label: 'UTC +07:00 (Bangkok)', value: 'Asia/Bangkok', utcOffset: '+07:00' },

    // UTC +8
    { label: 'UTC +08:00 (Singapore)', value: 'Asia/Singapore', utcOffset: '+08:00' },
    { label: 'UTC +08:00 (Beijing)', value: 'Asia/Shanghai', utcOffset: '+08:00' },

    // UTC +9
    { label: 'UTC +09:00 (Tokyo)', value: 'Asia/Tokyo', utcOffset: '+09:00' },
    { label: 'UTC +09:00 (Seoul)', value: 'Asia/Seoul', utcOffset: '+09:00' },

    // UTC +9:30
    { label: 'UTC +09:30 (Adelaide)', value: 'Australia/Adelaide', utcOffset: '+09:30' },

    // UTC +10
    { label: 'UTC +10:00 (Sydney)', value: 'Australia/Sydney', utcOffset: '+10:00' },

    // UTC +11
    { label: 'UTC +11:00 (Solomon Islands)', value: 'Pacific/Guadalcanal', utcOffset: '+11:00' },

    // UTC +12
    { label: 'UTC +12:00 (Auckland)', value: 'Pacific/Auckland', utcOffset: '+12:00' },

    // UTC +13
    { label: 'UTC +13:00 (Samoa)', value: 'Pacific/Apia', utcOffset: '+13:00' },

    // UTC +14
    { label: 'UTC +14:00 (Line Islands)', value: 'Pacific/Kiritimati', utcOffset: '+14:00' },
  ],
};
