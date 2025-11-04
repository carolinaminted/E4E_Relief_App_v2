// Extracted from image
export const employmentTypes: string[] = [
    'Active Full Time',
    'Active Part Time',
    'Full Time Short Term Disability',
    'Full-Time on FMLA (U.S. only)',
    'Part Time Short Term Disability',
    'Part-Time on FMLA (U.S. only)',
];

export const disasterEvents: string[] = [
    'Commercial Carrier Accident', // Shortened for usability
    'Earthquake',
    'Flood',
    'House Fire',
    'Landslide',
    'Sinkhole',
    'Tornado',
    'Tropical Storm/Hurricane',
    'Typhoon',
    'Volcanic Eruption',
    'Wildfire',
    'Winter Storm',
];

export const hardshipEvents: string[] = [
    'Crime',
    'Death',
    'Home Damage (leaks or broken pipes)',
    'Household Loss of Income',
    'Housing Crisis',
    'Mental Health and Well-Being',
    'Workplace Disruption',
];

// Combined list for forms and AI
export const allEventTypes: string[] = [
    ...disasterEvents,
    ...hardshipEvents,
    'My disaster is not listed'
];


export const expenseTypes: string[] = [
    'Basic Disaster Supplies',
    'Food Spoilage',
    'Meals'
];

export const languages: string[] = [
    "Arabic",
    "Bengali",
    "Chinese",
    "Dutch",
    "English",
    "French",
    "German",
    "Hindi",
    "Italian",
    "Japanese",
    "Korean",
    "Mandarin Chinese",
    "Portuguese",
    "Russian",
    "Spanish",
    "Turkish",
    "Urdu",
    "Vietnamese",
];