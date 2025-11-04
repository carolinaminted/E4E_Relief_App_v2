

import React, { useState, useMemo } from 'react';
import type { UserProfile, Address, ApplicationFormData } from '../types';
import CountrySelector from './CountrySelector';
import SearchableSelector from './SearchableSelector';
import { employmentTypes, languages } from '../data/appData';
import { formatPhoneNumber } from '../utils/formatting';
import AIApplicationStarter from './AIApplicationStarter';
import RequiredIndicator from './RequiredIndicator';
import LoadingOverlay from './LoadingOverlay';
import { parseApplicationDetailsWithGemini } from '../services/geminiService';
import { FormInput, FormRadioGroup, AddressFields } from './FormControls';

interface ApplyContactPageProps {
  formData: UserProfile;
  updateFormData: (data: Partial<UserProfile>) => void;
  nextStep: () => void;
  onAIParsed: (data: Partial<ApplicationFormData>) => void;
}

// --- UI Icons ---
const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[#ff8400] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const NotificationIcon: React.FC = () => (
    <span className="relative flex h-3 w-3" title="Action required in this section">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff8400] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff9d33]"></span>
    </span>
);


const ApplyContactPage: React.FC<ApplyContactPageProps> = ({ formData, updateFormData, nextStep, onAIParsed }) => {
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [openSections, setOpenSections] = useState({
    aiStarter: true,
    contact: false,
    primaryAddress: false,
    additionalDetails: false,
    mailingAddress: false,
    consent: false,
  });
  const [isAIParsing, setIsAIParsing] = useState(false);

  const sectionHasErrors = useMemo(() => {
    // Contact
    const contactHasBlanks = !formData.firstName || !formData.lastName || !formData.mobileNumber;
    
    // Primary Address
    const primaryAddressHasBlanks = !formData.primaryAddress.country || !formData.primaryAddress.street1 || !formData.primaryAddress.city || !formData.primaryAddress.state || !formData.primaryAddress.zip;
    
    // Additional Details
    const additionalDetailsHasBlanks = !formData.employmentStartDate || !formData.eligibilityType || formData.householdIncome === '' || formData.householdSize === '' || !formData.homeowner;
    
    // Mailing Address
    let mailingAddressHasBlanks = false;
    if (formData.isMailingAddressSame === null) {
        mailingAddressHasBlanks = true;
    } else if (!formData.isMailingAddressSame) {
        mailingAddressHasBlanks = !formData.mailingAddress?.country || !formData.mailingAddress?.street1 || !formData.mailingAddress?.city || !formData.mailingAddress?.state || !formData.mailingAddress?.zip;
    }

    // Consent
    const consentHasBlanks = !formData.ackPolicies || !formData.commConsent || !formData.infoCorrect;

    return {
        contact: contactHasBlanks,
        primaryAddress: primaryAddressHasBlanks,
        additionalDetails: additionalDetailsHasBlanks,
        mailingAddress: mailingAddressHasBlanks,
        consent: consentHasBlanks,
    };
  }, [formData]);
  
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const handleFormUpdate = (data: Partial<UserProfile>) => {
    let finalData = { ...data };
    if ('mobileNumber' in data && typeof data.mobileNumber === 'string') {
        finalData.mobileNumber = formatPhoneNumber(data.mobileNumber);
    }
    updateFormData(finalData);
    
    const fieldName = Object.keys(data)[0];
    if (errors[fieldName]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }
  };

  const handleAddressChange = (addressType: 'primaryAddress' | 'mailingAddress', field: keyof Address, value: string) => {
    const updatedAddress = {
        ...(formData[addressType] || { country: '', street1: '', city: '', state: '', zip: '' }),
        [field]: value
    };
    updateFormData({ [addressType]: updatedAddress });

    // FIX: Used type assertion to prevent 'symbol' cannot be used as an index type error.
     if (errors[addressType]?.[field as string]) {
        setErrors(prev => {
            const newAddrErrors = { ...prev[addressType] };
            // FIX: Used type assertion for deleting property.
            delete newAddrErrors[field as string];
            return { ...prev, [addressType]: newAddrErrors };
        });
    }
  };

  const handleAddressBulkChange = (addressType: 'primaryAddress' | 'mailingAddress', parsedAddress: Partial<Address>) => {
    updateFormData({
        [addressType]: {
            ...(formData[addressType] || { country: '', street1: '', city: '', state: '', zip: '' }),
            ...parsedAddress,
        }
    });
     // Clear related errors
    if (errors[addressType]) {
        setErrors(prev => ({...prev, [addressType]: {}}));
    }
  };
  
  const handleAIParse = async (description: string) => {
    setIsAIParsing(true);
    try {
      const parsedDetails = await parseApplicationDetailsWithGemini(description);
      onAIParsed(parsedDetails);
    } catch (e) {
      console.error("AI Parsing failed in parent component:", e);
      // Re-throw the error so the child component can catch it and display a local error message.
      throw e;
    } finally {
      setIsAIParsing(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, any> = {};
    const sectionsToOpen: Partial<Record<keyof typeof openSections, boolean>> = {};

    // Contact Info
    if (!formData.firstName) newErrors.firstName = 'First name is required.';
    if (!formData.lastName) newErrors.lastName = 'Last name is required.';
    if (!formData.mobileNumber) {
        newErrors.mobileNumber = 'Mobile number is required.';
    } else {
        const digitCount = formData.mobileNumber.replace(/[^\d]/g, '').length;
        if (digitCount < 7) {
            newErrors.mobileNumber = 'Please enter a valid phone number (at least 7 digits).';
        }
    }

    // Primary Address
    const primaryAddrErrors: Record<string, string> = {};
    if (!formData.primaryAddress.country) primaryAddrErrors.country = 'Country is required.';
    if (!formData.primaryAddress.street1) primaryAddrErrors.street1 = 'Street 1 is required.';
    if (!formData.primaryAddress.city) primaryAddrErrors.city = 'City is required.';
    if (!formData.primaryAddress.state) primaryAddrErrors.state = 'State is required.';
    if (!formData.primaryAddress.zip) primaryAddrErrors.zip = 'ZIP code is required.';
    if (Object.keys(primaryAddrErrors).length > 0) newErrors.primaryAddress = primaryAddrErrors;

    // Additional Details
    if (!formData.employmentStartDate) newErrors.employmentStartDate = 'Employment start date is required.';
    if (!formData.eligibilityType) newErrors.eligibilityType = 'Eligibility type is required.';
    if (formData.householdIncome === '') newErrors.householdIncome = 'Household income is required.';
    if (formData.householdSize === '') newErrors.householdSize = 'Household size is required.';
    if (!formData.homeowner) newErrors.homeowner = 'Homeowner status is required.';
    
    // Mailing Address (if applicable)
    if (formData.isMailingAddressSame === null) {
        newErrors.isMailingAddressSame = 'Please select an option for the mailing address.';
    } else if (!formData.isMailingAddressSame) {
        const mailingAddrErrors: Record<string, string> = {};
        if (!formData.mailingAddress?.country) mailingAddrErrors.country = 'Country is required.';
        if (!formData.mailingAddress?.street1) mailingAddrErrors.street1 = 'Street 1 is required.';
        if (!formData.mailingAddress?.city) mailingAddrErrors.city = 'City is required.';
        if (!formData.mailingAddress?.state) mailingAddrErrors.state = 'State is required.';
        if (!formData.mailingAddress?.zip) mailingAddrErrors.zip = 'ZIP code is required.';
        if (Object.keys(mailingAddrErrors).length > 0) newErrors.mailingAddress = mailingAddrErrors;
    }

    // Consent
    if (!formData.ackPolicies) newErrors.ackPolicies = 'You must agree to the policies.';
    if (!formData.commConsent) newErrors.commConsent = 'You must consent to communications.';
    if (!formData.infoCorrect) newErrors.infoCorrect = 'You must confirm your information is correct.';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
        if(newErrors.firstName || newErrors.lastName || newErrors.mobileNumber) sectionsToOpen.contact = true;
        if(newErrors.primaryAddress) sectionsToOpen.primaryAddress = true;
        if(newErrors.employmentStartDate || newErrors.eligibilityType || newErrors.householdIncome || newErrors.householdSize || newErrors.homeowner) sectionsToOpen.additionalDetails = true;
        if(newErrors.mailingAddress || newErrors.isMailingAddressSame) sectionsToOpen.mailingAddress = true;
        if(newErrors.ackPolicies || newErrors.commConsent || newErrors.infoCorrect) sectionsToOpen.consent = true;
        setOpenSections(prev => ({ ...prev, ...sectionsToOpen }));
    }
    
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validate()) {
      nextStep();
    }
  };

  return (
    <div className="space-y-4">
        {isAIParsing && <LoadingOverlay message="We are applying your details to the application now..." />}

        {/* AI Application Starter Section */}
        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('aiStarter')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSections.aiStarter} aria-controls="ai-starter-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Let's Get Started</h2>
                </div>
                <ChevronIcon isOpen={openSections.aiStarter} />
            </button>
            <div id="ai-starter-section" className={`transition-all duration-500 ease-in-out ${openSections.aiStarter ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="pt-4">
                    <AIApplicationStarter 
                        onParse={handleAIParse}
                        isLoading={isAIParsing}
                        variant="underline"
                    />
                </div>
                {openSections.aiStarter && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('aiStarter')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="ai-starter-section"
                            aria-expanded="true"
                        >
                            Collapse
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </fieldset>
        
        {/* 1a Contact Information */}
        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('contact')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSections.contact} aria-controls="contact-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Contact Information</h2>
                    {sectionHasErrors.contact && !openSections.contact && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSections.contact} />
            </button>
            <div id="contact-section" className={`transition-all duration-500 ease-in-out ${openSections.contact ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <FormInput label="First Name" id="firstName" required value={formData.firstName} onChange={e => handleFormUpdate({ firstName: e.target.value })} error={errors.firstName} />
                    <FormInput label="Middle Name(s)" id="middleName" value={formData.middleName || ''} onChange={e => handleFormUpdate({ middleName: e.target.value })} />
                    <FormInput label="Last Name" id="lastName" required value={formData.lastName} onChange={e => handleFormUpdate({ lastName: e.target.value })} error={errors.lastName} />
                    <FormInput label="Suffix" id="suffix" value={formData.suffix || ''} onChange={e => handleFormUpdate({ suffix: e.target.value })} />
                    <FormInput label="Email" id="email" required value={formData.email} disabled />
                    <FormInput label="Mobile Number" id="mobileNumber" required value={formData.mobileNumber} onChange={e => handleFormUpdate({ mobileNumber: e.target.value })} error={errors.mobileNumber} placeholder="(555) 555-5555" />
                </div>
                {openSections.contact && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('contact')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="contact-section"
                            aria-expanded="true"
                        >
                            Collapse
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </fieldset>

        {/* 1b Primary Address */}
        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('primaryAddress')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSections.primaryAddress} aria-controls="address-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Primary Address</h2>
                    {sectionHasErrors.primaryAddress && !openSections.primaryAddress && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSections.primaryAddress} />
            </button>
            <div id="address-section" className={`transition-all duration-500 ease-in-out ${openSections.primaryAddress ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-6 pt-4">
                    <AddressFields address={formData.primaryAddress} onUpdate={(field, value) => handleAddressChange('primaryAddress', field, value)} onBulkUpdate={(parsed) => handleAddressBulkChange('primaryAddress', parsed)} prefix="primary" errors={errors.primaryAddress || {}} />
                </div>
                {openSections.primaryAddress && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('primaryAddress')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="address-section"
                            aria-expanded="true"
                        >
                            Collapse
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </fieldset>
        
        {/* 1c Additional Details */}
        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('additionalDetails')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSections.additionalDetails} aria-controls="details-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Additional Details</h2>
                    {sectionHasErrors.additionalDetails && !openSections.additionalDetails && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSections.additionalDetails} />
            </button>
            <div id="details-section" className={`transition-all duration-500 ease-in-out ${openSections.additionalDetails ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <FormInput type="date" label="Employment Start Date" id="employmentStartDate" required value={formData.employmentStartDate} onChange={e => handleFormUpdate({ employmentStartDate: e.target.value })} error={errors.employmentStartDate} />
                    <SearchableSelector
                        label="Eligibility Type"
                        id="eligibilityType"
                        required
                        value={formData.eligibilityType}
                        options={employmentTypes}
                        onUpdate={value => handleFormUpdate({ eligibilityType: value as UserProfile['eligibilityType'] })}
                        variant="underline"
                        error={errors.eligibilityType}
                    />
                    <FormInput type="number" label="Estimated Annual Household Income" id="householdIncome" required value={formData.householdIncome} onChange={e => handleFormUpdate({ householdIncome: parseFloat(e.target.value) || '' })} error={errors.householdIncome} />
                    <FormInput type="number" label="Number of people in household" id="householdSize" required value={formData.householdSize} onChange={e => handleFormUpdate({ householdSize: parseInt(e.target.value, 10) || '' })} error={errors.householdSize} />
                    <FormRadioGroup legend="Do you own your own home?" name="homeowner" options={['Yes', 'No']} value={formData.homeowner} onChange={value => handleFormUpdate({ homeowner: value })} required error={errors.homeowner} />
                    <SearchableSelector
                        label="Preferred Language"
                        id="preferredLanguage"
                        value={formData.preferredLanguage || ''}
                        options={languages}
                        onUpdate={value => handleFormUpdate({ preferredLanguage: value })}
                        variant="underline"
                    />
                </div>
                {openSections.additionalDetails && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('additionalDetails')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="details-section"
                            aria-expanded="true"
                        >
                            Collapse
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </fieldset>

        {/* 1d Mailing Address */}
        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('mailingAddress')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSections.mailingAddress} aria-controls="mailing-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Mailing Address</h2>
                    {sectionHasErrors.mailingAddress && !openSections.mailingAddress && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSections.mailingAddress} />
            </button>
             <div id="mailing-section" className={`transition-all duration-500 ease-in-out ${openSections.mailingAddress ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-4 pt-4">
                    <FormRadioGroup 
                        legend="Mailing Address Same as Primary?" 
                        name="isMailingAddressSame" 
                        options={['Yes', 'No']} 
                        value={formData.isMailingAddressSame === null ? '' : (formData.isMailingAddressSame ? 'Yes' : 'No')} 
                        onChange={value => handleFormUpdate({ isMailingAddressSame: value === 'Yes' })} 
                        required
                        error={errors.isMailingAddressSame}
                    />
                    {!formData.isMailingAddressSame && (
                        <div className="pt-4 mt-4 border-t border-[#002a50] space-y-6">
                        <AddressFields address={formData.mailingAddress || { country: '', street1: '', city: '', state: '', zip: '' }} onUpdate={(field, value) => handleAddressChange('mailingAddress', field, value)} onBulkUpdate={(parsed) => handleAddressBulkChange('mailingAddress', parsed)} prefix="mailing" errors={errors.mailingAddress || {}}/>
                        </div>
                    )}
                </div>
                {openSections.mailingAddress && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('mailingAddress')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="mailing-section"
                            aria-expanded="true"
                        >
                            Collapse
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </fieldset>

        {/* 1e Consent and Acknowledgement */}
        <fieldset className="pb-4">
            <button type="button" onClick={() => toggleSection('consent')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSections.consent} aria-controls="consent-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Consent & Acknowledgement</h2>
                    {sectionHasErrors.consent && !openSections.consent && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSections.consent} />
            </button>
            <div id="consent-section" className={`transition-all duration-500 ease-in-out ${openSections.consent ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-3 pt-4">
                    {errors.ackPolicies && <p className="text-red-400 text-xs">{errors.ackPolicies}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="ackPolicies" required checked={formData.ackPolicies} onChange={e => handleFormUpdate({ ackPolicies: e.target.checked })} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="ackPolicies" className="flex items-center ml-3 text-sm text-white">I have read and agree to E4E Relief’s Privacy Policy and Cookie Policy. <RequiredIndicator required isMet={formData.ackPolicies} /></label>
                    </div>
                    {errors.commConsent && <p className="text-red-400 text-xs">{errors.commConsent}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="commConsent" required checked={formData.commConsent} onChange={e => handleFormUpdate({ commConsent: e.target.checked })} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="commConsent" className="flex items-center ml-3 text-sm text-white">I consent to receive emails and text messages regarding my application. <RequiredIndicator required isMet={formData.commConsent} /></label>
                    </div>
                    {errors.infoCorrect && <p className="text-red-400 text-xs">{errors.infoCorrect}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="infoCorrect" required checked={formData.infoCorrect} onChange={e => handleFormUpdate({ infoCorrect: e.target.checked })} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="infoCorrect" className="flex items-center ml-3 text-sm text-white">All information I have provided is accurate. <RequiredIndicator required isMet={formData.infoCorrect} /></label>
                    </div>
                </div>
                {openSections.consent && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('consent')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="consent-section"
                            aria-expanded="true"
                        >
                            Collapse
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </fieldset>
      
      <div className="flex justify-end pt-8 flex-col items-end">
        {Object.keys(errors).length > 0 && (
            <div className="bg-red-800/50 border border-red-600 text-red-200 p-3 rounded-md mb-4 w-full max-w-sm text-sm" role="alert">
                <p className="font-bold text-center">Please correct the highlighted errors to continue.</p>
            </div>
        )}
        <button onClick={handleNext} className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
          Next
        </button>
      </div>
    </div>
  );
};

export default ApplyContactPage;