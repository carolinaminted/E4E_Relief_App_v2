export interface FundConfig {
    allowedDomains: string[];
}

// Mock API to get fund configuration
export const getFundConfig = async (fundCode: string): Promise<FundConfig> => {
    console.log(`Fetching config for fundCode: ${fundCode}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    if (fundCode.toUpperCase() === 'E4E') {
        return {
            allowedDomains: ['example.com', 'fakemail.example'],
        };
    }
    return {
        allowedDomains: [],
    };
};

export interface RosterVerificationInput {
    employeeId: string;
    birthDay: number;
    birthMonth: number;
}

// Mock API to verify user against a roster
export const verifyRoster = async (input: RosterVerificationInput): Promise<{ ok: boolean }> => {
    console.log('Verifying roster with input:', input);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock success logic
    if (input.employeeId === '12345' && input.birthDay === 15 && input.birthMonth === 5) {
        return { ok: true };
    }
    return { ok: false };
};

// Mock API to link SSO
export const linkSSO = async (): Promise<{ ok: boolean }> => {
    console.log('Linking SSO...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Mock success
    return { ok: true };
};
