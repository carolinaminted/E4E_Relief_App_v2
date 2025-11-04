import React, { useState, useEffect, useCallback } from 'react';
import type { UserProfile, ClassVerificationStatus } from '../types';
import { getFundConfig, verifyRoster, linkSSO } from '../services/verificationService';
import { FormInput } from './FormControls';

type Page = 'home' | 'apply' | 'profile' | 'support' | 'tokenUsage' | 'donate' | 'classVerification';

interface ClassVerificationPageProps {
  user: UserProfile;
  onVerificationSuccess: () => void;
  navigate: (page: Page) => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
    </div>
);

// --- Sub-components for each verification method ---

const DomainVerificationView: React.FC<{ user: UserProfile, onVerified: () => void, onBack: () => void }> = ({ user, onVerified, onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const handleDomainCheck = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const config = await getFundConfig(user.fundCode);
            const userDomain = user.email.split('@')[1];
            if (config.allowedDomains.includes(userDomain.toLowerCase())) {
                setIsVerified(true);
                setTimeout(onVerified, 1500); // Wait a bit before calling parent success
            } else {
                setError(`Your email domain (${userDomain}) is not eligible for this fund.`);
            }
        } catch (e) {
            setError('Could not verify domain. Please try another method.');
        } finally {
            setIsLoading(false);
        }
    }, [user, onVerified]);
    
    useEffect(() => {
        handleDomainCheck();
    }, [handleDomainCheck]);

    return (
        <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-white">Verifying with Company Email Domain</h3>
            <p className="text-gray-300 mb-6">We are checking if your email <span className="font-bold text-white">{user.email}</span> belongs to an approved domain for fund code <span className="font-bold text-white">{user.fundCode}</span>.</p>
            {isLoading && <div className="h-8"><LoadingSpinner /></div>}
            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
            {isVerified && <p className="text-green-400 bg-green-900/50 p-3 rounded-md">Success! Your domain is verified.</p>}
            <button onClick={onBack} className="mt-6 text-sm text-gray-400 hover:text-white">Choose another method</button>
        </div>
    );
};

const RosterVerificationView: React.FC<{ onVerified: () => void, onBack: () => void }> = ({ onVerified, onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ employeeId: '', birthMonth: '', birthDay: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.id]: e.target.value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const result = await verifyRoster({
                employeeId: formData.employeeId,
                birthMonth: parseInt(formData.birthMonth, 10),
                birthDay: parseInt(formData.birthDay, 10),
            });
            if (result.ok) {
                onVerified();
            } else {
                setError('The details provided do not match our records. Please try again.');
            }
        } catch (e) {
            setError('An error occurred during verification. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center">
             <h3 className="text-xl font-semibold mb-4 text-white">Verifying with Roster Match</h3>
             <p className="text-gray-300 mb-6">Please enter the following details to verify your status.</p>
             <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <FormInput label="Employee ID" id="employeeId" value={formData.employeeId} onChange={handleChange} required />
                <div className="flex gap-4">
                    <FormInput label="Birth Month (1-12)" type="number" id="birthMonth" value={formData.birthMonth} onChange={handleChange} required min="1" max="12" />
                    <FormInput label="Birth Day (1-31)" type="number" id="birthDay" value={formData.birthDay} onChange={handleChange} required min="1" max="31" />
                </div>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button type="submit" disabled={isLoading} className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 h-12 flex items-center justify-center">
                    {isLoading ? <LoadingSpinner /> : 'Verify'}
                </button>
             </form>
             <button onClick={onBack} className="mt-6 text-sm text-gray-400 hover:text-white">Choose another method</button>
        </div>
    );
};

const SSOVerificationView: React.FC<{ onVerified: () => void, onBack: () => void }> = ({ onVerified, onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLink = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await linkSSO();
            if(result.ok) {
                onVerified();
            } else {
                setError('SSO linking failed. Please try again or use another method.');
            }
        } catch(e) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="text-center">
             <h3 className="text-xl font-semibold mb-4 text-white">Verifying with SSO</h3>
             <p className="text-gray-300 mb-6">Click the button below to link your company's SSO account to complete verification. This will open a new window.</p>
             {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
             <button onClick={handleLink} disabled={isLoading} className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 h-12 flex items-center justify-center">
                 {isLoading ? <LoadingSpinner /> : 'Link SSO Account'}
             </button>
             <button onClick={onBack} className="mt-6 text-sm text-gray-400 hover:text-white">Choose another method</button>
        </div>
    );
};


const ClassVerificationPage: React.FC<ClassVerificationPageProps> = ({ user, onVerificationSuccess, navigate }) => {
    const [method, setMethod] = useState<'domain' | 'roster' | 'sso' | null>(null);

    const renderContent = () => {
        switch (method) {
            case 'domain':
                return <DomainVerificationView user={user} onVerified={onVerificationSuccess} onBack={() => setMethod(null)} />;
            case 'roster':
                return <RosterVerificationView onVerified={onVerificationSuccess} onBack={() => setMethod(null)} />;
            case 'sso':
                return <SSOVerificationView onVerified={onVerificationSuccess} onBack={() => setMethod(null)} />;
            default:
                return (
                    <>
                        <p className="text-center text-gray-200 mb-8">Choose a method below to continue.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <MethodCard title="Company Email Domain" onClick={() => setMethod('domain')} />
                            <MethodCard title="Roster Match" onClick={() => setMethod('roster')} />
                            <MethodCard title="Link SSO Account" onClick={() => setMethod('sso')} />
                        </div>
                    </>
                );
        }
    };

    const MethodCard: React.FC<{ title: string, onClick: () => void }> = ({ title, onClick }) => (
        <button onClick={onClick} className="bg-[#004b8d] p-6 rounded-lg shadow-lg hover:bg-[#005ca0]/50 transition-all duration-300 text-center w-full">
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{title}</h3>
        </button>
    );

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-2xl bg-[#003a70] p-8 md:p-12 rounded-lg shadow-2xl border border-[#005ca0]">
                 <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] text-center mb-2">
                    Verify Your Employee Status
                 </h1>
                {renderContent()}
            </div>
        </div>
    );
};

export default ClassVerificationPage;
