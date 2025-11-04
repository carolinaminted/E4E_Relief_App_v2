import React, { useState, useMemo } from 'react';
import type { Application, UserProfile, Address } from '../types';
import ApplicationDetailModal from './ApplicationDetailModal';
import CountrySelector from './CountrySelector';
import SearchableSelector from './SearchableSelector';
import { employmentTypes, languages } from '../data/appData';
import { formatPhoneNumber } from '../utils/formatting';
import RequiredIndicator from './RequiredIndicator';
import { FormInput, FormRadioGroup, AddressFields } from './FormControls';

interface ProfilePageProps {
  navigate: (page: 'home' | 'apply') => void;
  applications: Application[];
  userProfile: UserProfile;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

const statusStyles: Record<Application['status'], string> = {
    Submitted: 'text-[#ff8400]',
    Awarded: 'text-[#edda26]',
    Declined: 'text-red-400',
};

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


const ProfilePage: React.FC<ProfilePageProps> = ({ navigate, applications, userProfile, onProfileUpdate }) => {
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(true);
  const [openSections, setOpenSections] = useState({
    contact: false,
    primaryAddress: false,
    additionalDetails: false,
    mailingAddress: false,
    consent: false,
  });
  
  const { twelveMonthRemaining, lifetimeRemaining } = useMemo(() => {
    if (applications.length === 0) {
      return {
        twelveMonthRemaining: 10000,
        lifetimeRemaining: 50000,
      };
    }

    // The most recent application is the last one in the array, which reflects the latest state.
    const latestApplication = applications[applications.length - 1];
    
    return {
      twelveMonthRemaining: latestApplication.twelveMonthGrantRemaining,
      lifetimeRemaining: latestApplication.lifetimeGrantRemaining,
    };
  }, [applications]);

  // Create a reversed list for display so newest applications appear first
  const sortedApplicationsForDisplay = useMemo(() => {
    return [...applications].reverse();
  }, [applications]);

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


  const handleFormChange = (field: keyof UserProfile, value: any) => {
    let finalValue = value;
    if (field === 'mobileNumber') {
      finalValue = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }));

    // FIX: Used type assertion to prevent 'symbol' cannot be used as an index type error.
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        // FIX: Used type assertion for deleting property.
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };
  
  const handleAddressChange = (addressType: 'primaryAddress' | 'mailingAddress', field: keyof Address, value: string) => {
    setFormData(prev => ({
        ...prev,
        [addressType]: {
            ...(prev[addressType] || { country: '', street1: '', city: '', state: '', zip: '' }), // Ensure mailingAddress is not undefined
            [field]: value
        }
    }));
    // FIX: Explicitly convert `field` to a string to avoid runtime errors with symbols.
    const errorKey = `${addressType}.${String(field)}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };
  
  const handleAddressBulkChange = (addressType: 'primaryAddress' | 'mailingAddress', parsedAddress: Partial<Address>) => {
    setFormData(prev => ({
        ...prev,
        [addressType]: {
            ...(prev[addressType] || { country: '', street1: '', city: '', state: '', zip: '' }),
            ...parsedAddress
        }
    }));
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(parsedAddress).forEach(field => {
        const errorKey = `${addressType}.${field}`;
        if (newErrors[errorKey]) {
          delete newErrors[errorKey];
        }
      });
      return newErrors;
    });
  };

  const validate = () => {
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onProfileUpdate(formData);
      alert('Profile saved!'); // Simple feedback
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="relative flex justify-center items-center mb-6">
        <button 
          onClick={() => navigate('home')} 
          className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" 
          aria-label="Back to Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
          Profile
        </h1>
      </div>
      
      {/* Applications Section */}
        <section className="border-b border-[#005ca0] pb-4 mb-4">
            <button type="button" onClick={() => setIsApplicationsOpen(p => !p)} className="w-full flex justify-between items-center text-left py-2" aria-expanded={isApplicationsOpen}>
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">My Applications</h2>
                <ChevronIcon isOpen={isApplicationsOpen} />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${isApplicationsOpen ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="bg-[#003a70]/50 p-4 rounded-lg mb-4 flex flex-col gap-4 sm:flex-row sm:justify-around text-center border border-[#005ca0]">
                    <div>
                        <p className="text-sm text-white uppercase tracking-wider">12-Month Remaining</p>
                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                            ${twelveMonthRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-white uppercase tracking-wider">Lifetime Remaining</p>
                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                            ${lifetimeRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
                <div className="space-y-4">
                {applications.length > 0 ? (
                    <>
                        {sortedApplicationsForDisplay.map(app => (
                        <button key={app.id} onClick={() => setSelectedApplication(app)} className="w-full text-left bg-[#004b8d] p-4 rounded-md flex justify-between items-center hover:bg-[#005ca0]/50 transition-colors duration-200">
                            <div>
                            <p className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{app.event}</p>
                            <p className="text-sm text-gray-300">Submitted: {app.submittedDate}</p>
                            </div>
                            <div className="text-right">
                            <p className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">${app.requestedAmount.toFixed(2)}</p>
                            <p className="text-sm text-gray-300">Status: <span className={`font-medium ${statusStyles[app.status]}`}>{app.status}</span></p>
                            </div>
                        </button>
                        ))}
                        <div className="flex justify-center pt-4">
                            <button 
                                onClick={() => navigate('apply')} 
                                className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
                            >
                                Apply Now
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 bg-[#003a70]/50 rounded-lg">
                        <p className="text-gray-300">You have not submitted any applications yet.</p>
                        <button onClick={() => navigate('apply')} className="mt-4 bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md">
                        Apply Now
                        </button>
                    </div>
                )}
                </div>
            </div>
        </section>


      <form onSubmit={handleSave} className="space-y-4">
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
                    <FormInput label="First Name" id="firstName" required value={formData.firstName} onChange={e => handleFormChange('firstName', e.target.value)} error={errors.firstName} />
                    <FormInput label="Middle Name(s)" id="middleName" value={formData.middleName || ''} onChange={e => handleFormChange('middleName', e.target.value)} />
                    <FormInput label="Last Name" id="lastName" required value={formData.lastName} onChange={e => handleFormChange('lastName', e.target.value)} error={errors.lastName} />
                    <FormInput label="Suffix" id="suffix" value={formData.suffix || ''} onChange={e => handleFormChange('suffix', e.target.value)} />
                    <FormInput label="Email" id="email" required value={formData.email} disabled />
                    <FormInput label="Mobile Number" id="mobileNumber" required value={formData.mobileNumber} onChange={e => handleFormChange('mobileNumber', e.target.value)} error={errors.mobileNumber} placeholder="(555) 555-5555" />
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
                    <FormInput type="date" label="Employment Start Date" id="employmentStartDate" required value={formData.employmentStartDate} onChange={e => handleFormChange('employmentStartDate', e.target.value)} error={errors.employmentStartDate} />
                    <SearchableSelector
                        label="Eligibility Type"
                        id="eligibilityType"
                        required
                        value={formData.eligibilityType}
                        options={employmentTypes}
                        onUpdate={value => handleFormChange('eligibilityType', value)}
                        variant="underline"
                        error={errors.eligibilityType}
                    />
                    <FormInput type="number" label="Estimated Annual Household Income" id="householdIncome" required value={formData.householdIncome} onChange={e => handleFormChange('householdIncome', parseFloat(e.target.value) || '')} error={errors.householdIncome} />
                    <FormInput type="number" label="Number of people in household" id="householdSize" required value={formData.householdSize} onChange={e => handleFormChange('householdSize', parseInt(e.target.value, 10) || '')} error={errors.householdSize} />
                    <FormRadioGroup legend="Do you own your own home?" name="homeowner" options={['Yes', 'No']} value={formData.homeowner} onChange={value => handleFormChange('homeowner', value)} required error={errors.homeowner} />
                    <SearchableSelector
                        label="Preferred Language"
                        id="preferredLanguage"
                        value={formData.preferredLanguage || ''}
                        options={languages}
                        onUpdate={value => handleFormChange('preferredLanguage', value)}
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
                        onChange={value => handleFormChange('isMailingAddressSame', value === 'Yes')} 
                        required
                        error={errors.isMailingAddressSame}
                    />
                    {!formData.isMailingAddressSame && (
                        <div className="pt-4 mt-4 border-t border-[#002a50] space-y-6">
                            <AddressFields address={formData.mailingAddress || { country: '', street1: '', city: '', state: '', zip: '' }} onUpdate={(field, value) => handleAddressChange('mailingAddress', field, value)} onBulkUpdate={(parsed) => handleAddressBulkChange('mailingAddress', parsed)} prefix="mailing" errors={errors.mailingAddress || {}} />
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
                        <input type="checkbox" id="ackPolicies" required checked={formData.ackPolicies} onChange={e => handleFormChange('ackPolicies', e.target.checked)} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="ackPolicies" className="flex items-center ml-3 text-sm text-white">I have read and agree to E4E Relief’s Privacy Policy and Cookie Policy. <RequiredIndicator required isMet={formData.ackPolicies} /></label>
                    </div>
                     {errors.commConsent && <p className="text-red-400 text-xs">{errors.commConsent}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="commConsent" required checked={formData.commConsent} onChange={e => handleFormChange('commConsent', e.target.checked)} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="commConsent" className="flex items-center ml-3 text-sm text-white">I consent to receive emails and text messages regarding my application. <RequiredIndicator required isMet={formData.commConsent} /></label>
                    </div>
                     {errors.infoCorrect && <p className="text-red-400 text-xs">{errors.infoCorrect}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="infoCorrect" required checked={formData.infoCorrect} onChange={e => handleFormChange('infoCorrect', e.target.checked)} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
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

        <div className="flex justify-center pt-8 flex-col items-center">
            {Object.keys(errors).length > 0 && (
                <div className="bg-red-800/50 border border-red-600 text-red-200 p-4 rounded-md mb-4 w-full max-w-md text-sm">
                    <p className="font-bold">Please correct the highlighted errors before saving.</p>
                </div>
            )}
            <button type="submit" className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-8 rounded-md transition-colors duration-200">Save Changes</button>
        </div>
      </form>

      {selectedApplication && (
        <ApplicationDetailModal 
          application={selectedApplication} 
          onClose={() => setSelectedApplication(null)} 
        />
      )}
    </div>
  );
};

export default ProfilePage;