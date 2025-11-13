import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

type ApplySection = 'aiStarter' | 'contact' | 'primaryAddress' | 'additionalDetails' | 'mailingAddress' | 'consent';

const ApplyContactPage: React.FC<ApplyContactPageProps> = ({ formData, updateFormData, nextStep, onAIParsed }) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [openSection, setOpenSection] = useState<ApplySection | null>('aiStarter');
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
  
  const toggleSection = (section: ApplySection) => {
    setOpenSection(prev => (prev === section ? null : section));
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
        let firstErrorSection: ApplySection | null = null;
        if (newErrors.firstName || newErrors.lastName || newErrors.mobileNumber) {
            firstErrorSection = 'contact';
        } else if (newErrors.primaryAddress) {
            firstErrorSection = 'primaryAddress';
        } else if (newErrors.mailingAddress || newErrors.isMailingAddressSame) {
            firstErrorSection = 'mailingAddress';
        } else if (newErrors.employmentStartDate || newErrors.eligibilityType || newErrors.householdIncome || newErrors.householdSize || newErrors.homeowner) {
            firstErrorSection = 'additionalDetails';
        } else if (newErrors.ackPolicies || newErrors.commConsent || newErrors.infoCorrect) {
            firstErrorSection = 'consent';
        }
        
        if (firstErrorSection) {
            setOpenSection(firstErrorSection);
        }
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
        {isAIParsing && <LoadingOverlay message={t('common.loading')} />}

        {/* AI Application Starter Section */}
        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('aiStarter')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'aiStarter'} aria-controls="ai-starter-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{t('applyContactPage.getStartedTitle')}</h2>
                </div>
                <ChevronIcon isOpen={openSection === 'aiStarter'} />
            </button>
            <div id="ai-starter-section" className={`transition-all duration-500 ease-in-out ${openSection === 'aiStarter' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="pt-4">
                    <AIApplicationStarter 
                        onParse={handleAIParse}
                        isLoading={isAIParsing}
                        variant="underline"
                    />
                </div>
                {openSection === 'aiStarter' && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('aiStarter')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="ai-starter-section"
                            aria-expanded="true"
                        >
                            {t('applyContactPage.collapse')}
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
            <button type="button" onClick={() => toggleSection('contact')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'contact'} aria-controls="contact-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{t('applyContactPage.contactInfoTitle')}</h2>
                    {sectionHasErrors.contact && openSection !== 'contact' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'contact'} />
            </button>
            <div id="contact-section" className={`transition-all duration-500 ease-in-out ${openSection === 'contact' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <FormInput label={t('applyContactPage.firstName')} id="firstName" required value={formData.firstName} onChange={e => handleFormUpdate({ firstName: e.target.value })} error={errors.firstName} />
                    <FormInput label={t('applyContactPage.middleName')} id="middleName" value={formData.middleName || ''} onChange={e => handleFormUpdate({ middleName: e.target.value })} />
                    <FormInput label={t('applyContactPage.lastName')} id="lastName" required value={formData.lastName} onChange={e => handleFormUpdate({ lastName: e.target.value })} error={errors.lastName} />
                    <FormInput label={t('applyContactPage.suffix')} id="suffix" value={formData.suffix || ''} onChange={e => handleFormUpdate({ suffix: e.target.value })} />
                    <FormInput label={t('applyContactPage.email')} id="email" required value={formData.email} disabled />
                    <FormInput label={t('applyContactPage.mobileNumber')} id="mobileNumber" required value={formData.mobileNumber} onChange={e => handleFormUpdate({ mobileNumber: e.target.value })} error={errors.mobileNumber} placeholder={t('applyContactPage.mobileNumberPlaceholder')} />
                </div>
                {openSection === 'contact' && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('contact')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                        >
                            {t('applyContactPage.collapse')}
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
            <button type="button" onClick={() => toggleSection('primaryAddress')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'primaryAddress'} aria-controls="address-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{t('applyContactPage.primaryAddressTitle')}</h2>
                    {sectionHasErrors.primaryAddress && openSection !== 'primaryAddress' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'primaryAddress'} />
            </button>
            <div id="address-section" className={`transition-all duration-500 ease-in-out ${openSection === 'primaryAddress' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-6 pt-4">
                    <AddressFields address={formData.primaryAddress} onUpdate={(field, value) => handleAddressChange('primaryAddress', field, value)} onBulkUpdate={(parsed) => handleAddressBulkChange('primaryAddress', parsed)} prefix="primary" errors={errors.primaryAddress || {}} />
                </div>
                {openSection === 'primaryAddress' && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('primaryAddress')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                        >
                            {t('applyContactPage.collapse')}
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
            <button type="button" onClick={() => toggleSection('mailingAddress')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'mailingAddress'} aria-controls="mailing-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{t('applyContactPage.mailingAddressTitle')}</h2>
                    {sectionHasErrors.mailingAddress && openSection !== 'mailingAddress' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'mailingAddress'} />
            </button>
             <div id="mailing-section" className={`transition-all duration-500 ease-in-out ${openSection === 'mailingAddress' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-4 pt-4">
                    <FormRadioGroup 
                        legend={t('applyContactPage.mailingAddressSame')}
                        name="isMailingAddressSame" 
                        options={[t('applyContactPage.yes'), t('applyContactPage.no')]} 
                        value={formData.isMailingAddressSame === null ? '' : (formData.isMailingAddressSame ? t('applyContactPage.yes') : t('applyContactPage.no'))} 
                        onChange={value => handleFormUpdate({ isMailingAddressSame: value === t('applyContactPage.yes') })} 
                        required
                        error={errors.isMailingAddressSame}
                    />
                    {formData.isMailingAddressSame === false && (
                        <div className="pt-4 mt-4 border-t border-[#002a50] space-y-6">
                        <AddressFields address={formData.mailingAddress || { country: '', street1: '', city: '', state: '', zip: '' }} onUpdate={(field, value) => handleAddressChange('mailingAddress', field, value)} onBulkUpdate={(parsed) => handleAddressBulkChange('mailingAddress', parsed)} prefix="mailing" errors={errors.mailingAddress || {}}/>
                        </div>
                    )}
                </div>
                {openSection === 'mailingAddress' && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('mailingAddress')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                        >
                            {t('applyContactPage.collapse')}
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
            <button type="button" onClick={() => toggleSection('additionalDetails')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'additionalDetails'} aria-controls="details-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{t('applyContactPage.additionalDetailsTitle')}</h2>
                    {sectionHasErrors.additionalDetails && openSection !== 'additionalDetails' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'additionalDetails'} />
            </button>
            <div id="details-section" className={`transition-all duration-500 ease-in-out ${openSection === 'additionalDetails' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <FormInput type="date" label={t('applyContactPage.employmentStartDate')} id="employmentStartDate" required value={formData.employmentStartDate} onChange={e => handleFormUpdate({ employmentStartDate: e.target.value })} error={errors.employmentStartDate} />
                    <SearchableSelector
                        label={t('applyContactPage.eligibilityType')}
                        id="eligibilityType"
                        required
                        value={formData.eligibilityType}
                        options={employmentTypes}
                        onUpdate={value => handleFormUpdate({ eligibilityType: value })}
                        variant="underline"
                        error={errors.eligibilityType}
                    />
                    <FormInput type="number" label={t('applyContactPage.householdIncome')} id="householdIncome" required value={formData.householdIncome} onChange={e => handleFormUpdate({ householdIncome: parseFloat(e.target.value) || '' })} error={errors.householdIncome} />
                    <FormInput type="number" label={t('applyContactPage.householdSize')} id="householdSize" required value={formData.householdSize} onChange={e => handleFormUpdate({ householdSize: parseInt(e.target.value, 10) || '' })} error={errors.householdSize} />
                    <FormRadioGroup legend={t('applyContactPage.homeowner')} name="homeowner" options={[t('applyContactPage.yes'), t('applyContactPage.no')]} value={formData.homeowner as string} onChange={value => handleFormUpdate({ homeowner: value as 'Yes' | 'No' })} required error={errors.homeowner} />
                    <SearchableSelector
                        label={t('applyContactPage.preferredLanguage')}
                        id="preferredLanguage"
                        value={formData.preferredLanguage || ''}
                        options={languages}
                        onUpdate={value => handleFormUpdate({ preferredLanguage: value })}
                        variant="underline"
                    />
                </div>
                {openSection === 'additionalDetails' && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('additionalDetails')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                        >
                            {t('applyContactPage.collapse')}
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
            <button type="button" onClick={() => toggleSection('consent')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'consent'} aria-controls="consent-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{t('applyContactPage.consentTitle')}</h2>
                    {sectionHasErrors.consent && openSection !== 'consent' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'consent'} />
            </button>
            <div id="consent-section" className={`transition-all duration-500 ease-in-out ${openSection === 'consent' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-3 pt-4">
                    {errors.ackPolicies && <p className="text-red-400 text-xs">{errors.ackPolicies}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="ackPolicies" required checked={formData.ackPolicies} onChange={e => handleFormUpdate({ ackPolicies: e.target.checked })} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="ackPolicies" className="flex items-center ml-3 text-sm text-white">{t('applyContactPage.ackPolicies')} <RequiredIndicator required isMet={formData.ackPolicies} /></label>
                    </div>
                    {errors.commConsent && <p className="text-red-400 text-xs">{errors.commConsent}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="commConsent" required checked={formData.commConsent} onChange={e => handleFormUpdate({ commConsent: e.target.checked })} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="commConsent" className="flex items-center ml-3 text-sm text-white">{t('applyContactPage.commConsent')} <RequiredIndicator required isMet={formData.commConsent} /></label>
                    </div>
                    {errors.infoCorrect && <p className="text-red-400 text-xs">{errors.infoCorrect}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="infoCorrect" required checked={formData.infoCorrect} onChange={e => handleFormUpdate({ infoCorrect: e.target.checked })} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="infoCorrect" className="flex items-center ml-3 text-sm text-white">{t('applyContactPage.infoCorrect')} <RequiredIndicator required isMet={formData.infoCorrect} /></label>
                    </div>
                </div>
                {openSection === 'consent' && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('consent')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                        >
                            {t('applyContactPage.collapse')}
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
                <p className="font-bold text-center">{t('applyContactPage.errorCorrection')}</p>
            </div>
        )}
        <button onClick={handleNext} className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
          {t('common.next')}
        </button>
      </div>
    </div>
  );
};

export default ApplyContactPage;