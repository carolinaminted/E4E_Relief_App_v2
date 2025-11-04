import React, { useState } from 'react';
import type { EventData } from '../types';
import SearchableSelector from './SearchableSelector';
import { eventTypes } from '../data/appData';
import RequiredIndicator from './RequiredIndicator';

interface ApplyEventPageProps {
  formData: EventData;
  updateFormData: (data: Partial<EventData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

// --- Reusable Form Components ---
const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, required?: boolean, error?: string }> = ({ label, id, required, error, ...props }) => (
    <div>
        <label htmlFor={id} className="flex items-center text-sm font-medium text-white mb-1">
            {label} <RequiredIndicator required={required} isMet={!!props.value} />
        </label>
        <input id={id} {...props} className={`w-full bg-transparent border-0 border-b p-2 text-white focus:outline-none focus:ring-0 ${error ? 'border-red-500' : 'border-[#005ca0] focus:border-[#ff8400]'} disabled:bg-transparent disabled:border-b disabled:border-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed`} />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string, required?: boolean, error?: string }> = ({ label, id, required, error, ...props }) => (
    <div>
        <label htmlFor={id} className="flex items-center text-sm font-medium text-white mb-1">
            {label} <RequiredIndicator required={required} isMet={!!props.value} />
        </label>
        <textarea id={id} {...props} className={`w-full bg-transparent border-0 border-b p-2 text-white focus:outline-none focus:ring-0 ${error ? 'border-red-500' : 'border-[#005ca0] focus:border-[#ff8400]'}`} />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);


const FormRadioGroup: React.FC<{ legend: string, name: string, options: string[], value: string, onChange: (value: any) => void, required?: boolean, error?: string }> = ({ legend, name, options, value, onChange, required, error }) => (
    <div>
        <p className={`flex items-center text-sm font-medium text-white mb-1 ${error ? 'text-red-400' : ''}`}>
            {legend} <RequiredIndicator required={required} isMet={!!value} />
        </p>
        <div className="flex gap-4 mt-2">
            {options.map(option => (
                <label key={option} className="flex items-center cursor-pointer">
                    <input type="radio" name={name} value={option} checked={value === option} onChange={(e) => onChange(e.target.value)} className="form-radio h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 focus:ring-[#ff8400]" />
                    <span className="ml-2 text-white">{option}</span>
                </label>
            ))}
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

const ApplyEventPage: React.FC<ApplyEventPageProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    // 201
    if (!formData.event) newErrors.event = 'Please select the disaster you experienced.';
    // 202
    if (formData.event === 'My disaster is not listed' && !formData.otherEvent) newErrors.otherEvent = 'Please specify the disaster.';
    // 203
    if (!formData.eventDate) newErrors.eventDate = 'Please enter the date of the event.';
    // 204
    if (!formData.evacuated) newErrors.evacuated = 'Please answer if you have evacuated.';
    // 205
    if (formData.evacuated === 'Yes' && !formData.evacuatingFromPrimary) newErrors.evacuatingFromPrimary = 'Please answer if you are evacuating from your primary residence.';
    // 207
    if (formData.evacuated === 'Yes' && !formData.stayedWithFamilyOrFriend) newErrors.stayedWithFamilyOrFriend = 'Please answer if you stayed with family or a friend.';
    // 208
    if (formData.evacuated === 'Yes' && !formData.evacuationStartDate) newErrors.evacuationStartDate = 'Please enter your evacuation start date.';
    // 209
    if (formData.evacuated === 'Yes' && (!formData.evacuationNights || formData.evacuationNights <= 0)) newErrors.evacuationNights = 'Please enter a valid number of nights.';
    // 210
    if (!formData.powerLoss) newErrors.powerLoss = 'Please answer if you lost power.';
    // 211
    if (formData.powerLoss === 'Yes' && (!formData.powerLossDays || formData.powerLossDays <= 0)) newErrors.powerLossDays = 'Please enter a valid number of days.';
    // requestedAmount
    if (!formData.requestedAmount || formData.requestedAmount <= 0) newErrors.requestedAmount = 'Requested amount must be greater than zero.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      nextStep();
    }
  };
  
  const handleUpdate = (data: Partial<EventData>) => {
    updateFormData(data);
    const fieldName = Object.keys(data)[0];
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Event Details</h2>
        <div className="space-y-6">
            {/* 201 */}
            <SearchableSelector
                label="Select the disaster experienced"
                id="event"
                required
                value={formData.event || ''}
                options={eventTypes}
                // FIX: Cast the value from the generic string provided by the selector to the specific string literal union type required by EventData.
                onUpdate={value => handleUpdate({ event: value as EventData['event'] })}
                variant="underline"
                error={errors.event}
            />
            {/* 202 */}
            {formData.event === 'My disaster is not listed' && (
                <FormInput 
                    label="Choose the disaster that affected you"
                    id="otherEvent"
                    required
                    value={formData.otherEvent || ''}
                    onChange={e => handleUpdate({ otherEvent: e.target.value })}
                    error={errors.otherEvent}
                />
            )}
             {/* 203 */}
            <FormInput
                label="What was the date of your event?"
                id="eventDate"
                type="date"
                required
                value={formData.eventDate || ''}
                onChange={e => handleUpdate({ eventDate: e.target.value })}
                error={errors.eventDate}
            />
            {/* 210 */}
            <FormRadioGroup
                legend="Did this event cause you to lose power at your primary residence for more than 4 hours?"
                name="powerLoss"
                required
                options={['Yes', 'No']}
                value={formData.powerLoss}
                onChange={value => handleUpdate({ powerLoss: value })}
                error={errors.powerLoss}
            />
            {/* 211 */}
            {formData.powerLoss === 'Yes' && (
                <FormInput
                    label="How many day(s) were you without power?"
                    id="powerLossDays"
                    type="number"
                    min="1"
                    required
                    value={formData.powerLossDays || ''}
                    onChange={e => handleUpdate({ powerLossDays: parseInt(e.target.value, 10) || '' })}
                    error={errors.powerLossDays}
                />
            )}
            {/* 204 */}
            <FormRadioGroup
                legend="Have you evacuated, or are you planning to evacuate?"
                name="evacuated"
                required
                options={['Yes', 'No']}
                value={formData.evacuated}
                onChange={value => handleUpdate({ evacuated: value })}
                error={errors.evacuated}
            />
            {/* Evacuation Section */}
            {formData.evacuated === 'Yes' && (
                <div className="space-y-6 pl-4 border-l-2 border-[#ff8400]/50">
                    {/* 205 */}
                    <FormRadioGroup
                        legend="Are you evacuating from your primary residence?"
                        name="evacuatingFromPrimary"
                        required
                        options={['Yes', 'No']}
                        value={formData.evacuatingFromPrimary}
                        onChange={value => handleUpdate({ evacuatingFromPrimary: value })}
                        error={errors.evacuatingFromPrimary}
                    />
                    {/* 206 */}
                    {formData.evacuatingFromPrimary === 'No' && (
                         <FormInput
                            label="Select why evacuation is required from the Alternate Evacuation Address"
                            id="evacuationReason"
                            value={formData.evacuationReason || ''}
                            onChange={e => handleUpdate({ evacuationReason: e.target.value })}
                        />
                    )}
                    {/* 207 */}
                     <FormRadioGroup
                        legend="Did you stay, or do you plan to stay with a family member or friend?"
                        name="stayedWithFamilyOrFriend"
                        required
                        options={['Yes', 'No']}
                        value={formData.stayedWithFamilyOrFriend}
                        onChange={value => handleUpdate({ stayedWithFamilyOrFriend: value })}
                        error={errors.stayedWithFamilyOrFriend}
                    />
                    {/* 208 */}
                    <FormInput
                        label="When did you start or when do you plan to start your evacuation?"
                        id="evacuationStartDate"
                        type="date"
                        required
                        value={formData.evacuationStartDate || ''}
                        onChange={e => handleUpdate({ evacuationStartDate: e.target.value })}
                        error={errors.evacuationStartDate}
                    />
                    {/* 209 */}
                    <FormInput
                        label="How many nights were you evacuated, or plan to evacuate?"
                        id="evacuationNights"
                        type="number"
                        min="1"
                        required
                        value={formData.evacuationNights || ''}
                        onChange={e => handleUpdate({ evacuationNights: parseInt(e.target.value, 10) || '' })}
                        error={errors.evacuationNights}
                    />
                </div>
            )}
             {/* 212 */}
            <FormTextarea
                label="Provide additional details that support your relief request and expense needs"
                id="additionalDetails"
                rows={4}
                value={formData.additionalDetails || ''}
                onChange={e => handleUpdate({ additionalDetails: e.target.value })}
                placeholder="Describe any other relevant information here..."
            />
            {/* Amount */}
            <FormInput
                label="Requested Relief Payment ($)"
                id="amount"
                type="number"
                value={formData.requestedAmount || ''}
                onChange={(e) => handleUpdate({ requestedAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                error={errors.requestedAmount}
            />
        </div>
      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
          Back
        </button>
        <button onClick={handleNext} className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
          Next
        </button>
      </div>
    </div>
  );
};

export default ApplyEventPage;