import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventData } from '../types';
import type { Fund } from '../data/fundData';
import SearchableSelector from './SearchableSelector';
import { FormInput, FormRadioGroup, FormTextarea } from './FormControls';

interface ApplyEventPageProps {
  formData: EventData;
  updateFormData: (data: Partial<EventData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  activeFund: Fund | null;
}

const ApplyEventPage: React.FC<ApplyEventPageProps> = ({ formData, updateFormData, nextStep, prevStep, activeFund }) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eligibleEventsForFund = useMemo(() => {
    if (!activeFund) {
      // Fallback to a minimal list if the fund configuration isn't loaded.
      // The UI should ideally prevent reaching this state, but this is a safeguard.
      return ['My disaster is not listed'];
    }
    const allEvents = [
      ...(activeFund.eligibleDisasters || []),
      ...(activeFund.eligibleHardships || []),
      'My disaster is not listed'
    ];
    // Use a Set to remove any potential duplicates from the configuration.
    return [...new Set(allEvents)];
  }, [activeFund]);
  
  const yes = t('common.yes');
  const no = t('common.no');

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.event) newErrors.event = t('applyEventPage.errorEvent');
    
    // Conditional validation based on event type
    if (formData.event === 'My disaster is not listed' && !formData.otherEvent) newErrors.otherEvent = t('applyEventPage.errorOtherEvent');
    if (formData.event === 'Tropical Storm/Hurricane' && activeFund?.eligibleStorms && activeFund.eligibleStorms.length > 0 && !formData.eventName) {
        newErrors.eventName = t('applyEventPage.errorEventName', 'Please select the storm name.');
    }

    if (!formData.eventDate) newErrors.eventDate = t('applyEventPage.errorEventDate');

    // Power Loss validation
    if (!formData.powerLoss) newErrors.powerLoss = t('applyEventPage.errorPowerLoss');
    if (formData.powerLoss === 'Yes' && (!formData.powerLossDays || formData.powerLossDays <= 0)) newErrors.powerLossDays = t('applyEventPage.errorPowerLossDays');

    // Evacuation validation
    if (!formData.evacuated) newErrors.evacuated = t('applyEventPage.errorEvacuated');
    if (formData.evacuated === 'Yes') {
        if (!formData.evacuatingFromPrimary) newErrors.evacuatingFromPrimary = t('applyEventPage.errorEvacuatingFromPrimary');
        if (formData.evacuatingFromPrimary === 'No' && !formData.evacuationReason) newErrors.evacuationReason = t('applyEventPage.errorEvacuationReason', 'Please provide a reason for evacuating.');
        if (!formData.stayedWithFamilyOrFriend) newErrors.stayedWithFamilyOrFriend = t('applyEventPage.errorStayedWithFamily');
        if (!formData.evacuationStartDate) newErrors.evacuationStartDate = t('applyEventPage.errorEvacuationStartDate');
        if (!formData.evacuationNights || formData.evacuationNights <= 0) newErrors.evacuationNights = t('applyEventPage.errorEvacuationNights');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      nextStep();
    }
  };
  
  const handleUpdate = (data: Partial<EventData>) => {
    const newFormData = { ...data };
    const updatedField = Object.keys(data)[0] as keyof EventData;
    const updatedValue = data[updatedField];

    if (updatedField === 'event') {
        if (updatedValue !== 'My disaster is not listed') { newFormData.otherEvent = ''; }
        if (updatedValue !== 'Tropical Storm/Hurricane') { newFormData.eventName = ''; }
    }
    if (updatedField === 'powerLoss' && updatedValue === 'No') {
        newFormData.powerLossDays = '';
    }
    if (updatedField === 'evacuated' && updatedValue === 'No') {
        newFormData.evacuatingFromPrimary = '';
        newFormData.evacuationReason = '';
        newFormData.stayedWithFamilyOrFriend = '';
        newFormData.evacuationStartDate = '';
        newFormData.evacuationNights = '';
    }
    if (updatedField === 'evacuatingFromPrimary' && updatedValue === 'Yes') {
        newFormData.evacuationReason = '';
    }

    updateFormData(newFormData);

    const fieldNamesToClear = Object.keys(newFormData);
    const currentErrors = { ...errors };
    let didClearError = false;
    fieldNamesToClear.forEach(fieldName => {
        if (currentErrors[fieldName]) {
            delete currentErrors[fieldName];
            didClearError = true;
        }
    });
    if (didClearError) {
        setErrors(currentErrors);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] text-center">{t('applyEventPage.title')}</h2>
        <div className="space-y-6">
            <SearchableSelector
                label={t('applyEventPage.disasterLabel')}
                id="event"
                required
                value={formData.event || ''}
                options={eligibleEventsForFund}
                onUpdate={value => handleUpdate({ event: value })}
                variant="underline"
                error={errors.event}
            />
            {formData.event === 'Tropical Storm/Hurricane' && activeFund?.eligibleStorms && activeFund.eligibleStorms.length > 0 && (
                <SearchableSelector
                    label="Select the storm name"
                    id="eventName"
                    required
                    value={formData.eventName || ''}
                    options={activeFund.eligibleStorms}
                    onUpdate={value => handleUpdate({ eventName: value })}
                    variant="underline"
                    error={errors.eventName}
                />
            )}
            {formData.event === 'My disaster is not listed' && (
                <FormInput 
                    label={t('applyEventPage.otherDisasterLabel')}
                    id="otherEvent"
                    required
                    value={formData.otherEvent || ''}
                    onChange={e => handleUpdate({ otherEvent: e.target.value })}
                    error={errors.otherEvent}
                />
            )}
            <FormInput
                label={t('applyEventPage.eventDateLabel')}
                id="eventDate"
                type="date"
                required
                value={formData.eventDate || ''}
                onChange={e => handleUpdate({ eventDate: e.target.value })}
                error={errors.eventDate}
            />
            <FormRadioGroup
                legend={t('applyEventPage.powerLossLabel')}
                name="powerLoss"
                required
                options={[yes, no]}
                value={formData.powerLoss === 'Yes' ? yes : formData.powerLoss === 'No' ? no : ''}
                onChange={value => handleUpdate({ powerLoss: value === yes ? 'Yes' : 'No' })}
                error={errors.powerLoss}
            />
            {formData.powerLoss === 'Yes' && (
                <FormInput
                    label={t('applyEventPage.powerLossDaysLabel')}
                    id="powerLossDays"
                    type="number"
                    min="1"
                    required
                    value={formData.powerLossDays || ''}
                    onChange={e => handleUpdate({ powerLossDays: parseInt(e.target.value, 10) || '' })}
                    error={errors.powerLossDays}
                />
            )}
            <FormRadioGroup
                legend={t('applyEventPage.evacuatedLabel')}
                name="evacuated"
                required
                options={[yes, no]}
                value={formData.evacuated === 'Yes' ? yes : formData.evacuated === 'No' ? no : ''}
                onChange={value => handleUpdate({ evacuated: value === yes ? 'Yes' : 'No' })}
                error={errors.evacuated}
            />
            {formData.evacuated === 'Yes' && (
                <div className="space-y-6 pl-4 border-l-2 border-[var(--theme-accent)]/50">
                    <FormRadioGroup
                        legend={t('applyEventPage.evacuatingFromPrimaryLabel')}
                        name="evacuatingFromPrimary"
                        required
                        options={[yes, no]}
                        value={formData.evacuatingFromPrimary === 'Yes' ? yes : formData.evacuatingFromPrimary === 'No' ? no : ''}
                        onChange={value => handleUpdate({ evacuatingFromPrimary: value === yes ? 'Yes' : 'No' })}
                        error={errors.evacuatingFromPrimary}
                    />
                    {formData.evacuatingFromPrimary === 'No' && (
                         <FormInput
                            label={t('applyEventPage.evacuationReasonLabel')}
                            id="evacuationReason"
                            required
                            value={formData.evacuationReason || ''}
                            onChange={e => handleUpdate({ evacuationReason: e.target.value })}
                            error={errors.evacuationReason}
                        />
                    )}
                     <FormRadioGroup
                        legend={t('applyEventPage.stayedWithFamilyLabel')}
                        name="stayedWithFamilyOrFriend"
                        required
                        options={[yes, no]}
                        value={formData.stayedWithFamilyOrFriend === 'Yes' ? yes : formData.stayedWithFamilyOrFriend === 'No' ? no : ''}
                        onChange={value => handleUpdate({ stayedWithFamilyOrFriend: value === yes ? 'Yes' : 'No' })}
                        error={errors.stayedWithFamilyOrFriend}
                    />
                    <FormInput
                        label={t('applyEventPage.evacuationStartDateLabel')}
                        id="evacuationStartDate"
                        type="date"
                        required
                        value={formData.evacuationStartDate || ''}
                        onChange={e => handleUpdate({ evacuationStartDate: e.target.value })}
                        error={errors.evacuationStartDate}
                    />
                    <FormInput
                        label={t('applyEventPage.evacuationNightsLabel')}
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
            <FormTextarea
                label={t('applyEventPage.additionalDetailsLabel')}
                id="additionalDetails"
                rows={4}
                value={formData.additionalDetails || ''}
                onChange={e => handleUpdate({ additionalDetails: e.target.value })}
                placeholder={t('applyEventPage.additionalDetailsPlaceholder')}
            />
        </div>
      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
          {t('common.back')}
        </button>
        <button onClick={handleNext} className="bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
          {t('common.next')}
        </button>
      </div>
    </div>
  );
};

export default ApplyEventPage;