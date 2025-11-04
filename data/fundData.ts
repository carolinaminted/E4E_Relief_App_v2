// Define types
export type CVType = 'Domain' | 'Roster' | 'SSO';

export interface Fund {
  code: string;
  name: string;
  cvType: CVType;
  limits: {
    twelveMonthMax: number;
    lifetimeMax: number;
    singleRequestMax: number;
  };
  eligibleCountries: string[];
  hireEligibility: {
    employmentStartOnOrBeforeEvent: boolean;
    minTenureDays: number;
  };
  domainConfig?: {
    allowedDomains: string[];
  };
  rosterConfig?: {
    requiredFields: string[];
    sampleEligibilityRecords: { employeeId: string; birthDay: number; birthMonth: number }[];
  };
  ssoConfig?: {
    provider: string;
    issuer: string;
    clientId: string;
    scopes: string[];
  };
  eligibleEmploymentTypes: string[];
  eligibleDisasters: string[];
  eligibleHardships: string[];
  aiParams?: Record<string, any>;
}

// Store the fund data
const funds: Fund[] = [
    {
      "code": "E4E",
      "name": "E4E Relief",
      "cvType": "Domain",
      "limits": { "twelveMonthMax": 10000, "lifetimeMax": 50000, "singleRequestMax": 10000 },
      "eligibleCountries": ["US", "CA", "MX"],
      "hireEligibility": {
        "employmentStartOnOrBeforeEvent": true,
        "minTenureDays": 0
      },
      "domainConfig": {
        "allowedDomains": ["e4erelief.org", "partnerco.com", "example.com", "fakemail.example"]
      },
      "eligibleEmploymentTypes": [
        "Active Full Time",
        "Active Part Time",
        "Full Time Short Term Disability",
        "Part Time Short Term Disability",
      ],
      "eligibleDisasters": [
        "Earthquake",
        "Flood",
        "House Fire",
        "Tornado",
        "Tropical Storm/Hurricane",
        "Wildfire",
        "Winter Storm",
      ],
      "eligibleHardships": [
        "Home Damage (leaks or broken pipes)",
        "Household Loss of Income",
        "Housing Crisis",
      ]
    },
    {
      "code": "JHH",
      "name": "JHH Relief",
      "cvType": "Roster",
      "limits": { "twelveMonthMax": 5000, "lifetimeMax": 25000, "singleRequestMax": 2500 },
      "eligibleCountries": ["US"],
      "hireEligibility": {
        "employmentStartOnOrBeforeEvent": true,
        "minTenureDays": 90
      },
      "rosterConfig": {
        "requiredFields": ["employeeId", "birthDay", "birthMonth"],
        "sampleEligibilityRecords": [
          { "employeeId": "A12345", "birthDay": 12, "birthMonth": 7 },
          { "employeeId": "B98765", "birthDay": 3,  "birthMonth": 11 },
          { "employeeId": "12345", "birthDay": 15, "birthMonth": 5 }
        ]
      },
      "eligibleEmploymentTypes": [
        "Active Full Time",
        "Active Part Time",
        "Full-Time on FMLA (U.S. only)",
        "Part-Time on FMLA (U.S. only)",
      ],
      "eligibleDisasters": [
        "Commercial Carrier Accident",
        "House Fire",
        "Winter Storm",
      ],
      "eligibleHardships": [
        "Death",
        "Household Loss of Income",
        "Workplace Disruption",
        "Mental Health and Well-Being",
      ]
    },
    {
      "code": "SQRT",
      "name": "Squirtle Relief",
      "cvType": "SSO",
      "limits": { "twelveMonthMax": 15000, "lifetimeMax": 75000, "singleRequestMax": 7500 },
      "eligibleCountries": ["US", "GB", "AU", "JP"],
      "hireEligibility": {
        "employmentStartOnOrBeforeEvent": true,
        "minTenureDays": 30
      },
      "ssoConfig": {
        "provider": "oidc",
        "issuer": "https://login.example.com/your-tenant-id",
        "clientId": "your-client-id",
        "scopes": ["openid", "profile", "email"]
      },
       "eligibleEmploymentTypes": [
        "Active Full Time",
        "Active Part Time",
      ],
      "eligibleDisasters": [
        "Flood",
        "Typhoon",
        "Volcanic Eruption"
      ],
      "eligibleHardships": [
        "Crime",
        "Housing Crisis",
      ]
    }
];

// Helper function
export const getFundByCode = (code: string): Fund | undefined => {
    return funds.find(fund => fund.code.toUpperCase() === code.toUpperCase());
};