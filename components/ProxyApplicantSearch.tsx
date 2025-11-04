import React, { useState } from 'react';
import type { UserProfile, ApplicationFormData } from '../types';
import AIApplicationStarter from './AIApplicationStarter';
import { parseApplicationDetailsWithGemini } from '../services/geminiService';
import LoadingOverlay from './LoadingOverlay';

interface ProxyApplicantSearchProps {
    allUsers: UserProfile[];
    onApplicantSelect: (applicant: UserProfile) => void;
    onAIParsed: (parsedData: Partial<ApplicationFormData>) => void;
}

const ProxyApplicantSearch: React.FC<ProxyApplicantSearchProps> = ({ allUsers, onApplicantSelect, onAIParsed }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
    const [error, setError] = useState('');
    const [isAIParsing, setIsAIParsing] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFoundUser(null);
        if (!searchTerm.trim()) {
            setError('Please enter an email to search.');
            return;
        }
        const user = allUsers.find(u => u.email.toLowerCase() === searchTerm.toLowerCase().trim());
        if (user) {
            setFoundUser(user);
        } else {
            setError('No applicant found with that email address.');
        }
    };

    const handleAIParse = async (description: string) => {
        setIsAIParsing(true);
        try {
            const parsedDetails = await parseApplicationDetailsWithGemini(description);
            onAIParsed(parsedDetails);
        } catch (e) {
            console.error("AI Parsing failed:", e);
            throw e; // Let child component handle display
        } finally {
            setIsAIParsing(false);
        }
    };

    return (
        <div className="space-y-8 p-4 md:p-8">
            {isAIParsing && <LoadingOverlay message="We are applying your details to the application now..." />}
            <AIApplicationStarter 
                onParse={handleAIParse} 
                isLoading={isAIParsing} 
                variant="underline" 
            />
            
            <div className="border-t border-[#005ca0] pt-8">
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Find Applicant</h2>
                <p className="text-gray-300 mt-1 mb-4">Enter the email address of the employee you are applying for.</p>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="email"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="applicant@example.com"
                        className="flex-grow bg-transparent border-0 border-b p-2 text-white focus:outline-none focus:ring-0 border-[#005ca0] focus:border-[#ff8400]"
                        aria-label="Applicant's email address"
                    />
                    <button type="submit" className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
                        Search
                    </button>
                </form>
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>

            {foundUser && (
                <div className="bg-[#004b8d]/50 p-6 rounded-lg border border-[#005ca0] animate-[fadeIn_0.5s_ease-out]">
                    <h3 className="font-semibold text-lg text-white">Applicant Found:</h3>
                    <div className="mt-4 space-y-2 text-gray-200">
                        <p><span className="font-semibold">Name:</span> {foundUser.firstName} {foundUser.lastName}</p>
                        <p><span className="font-semibold">Email:</span> {foundUser.email}</p>
                        <p><span className="font-semibold">Fund:</span> {foundUser.fundName} ({foundUser.fundCode})</p>
                    </div>
                    <div className="flex justify-end mt-6">
                        <button onClick={() => onApplicantSelect(foundUser)} className="bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-90 text-white font-bold py-2 px-6 rounded-md transition-all duration-200">
                            Start Application for this User
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProxyApplicantSearch;
