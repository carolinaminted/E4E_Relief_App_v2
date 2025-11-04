import React from 'react';
import type { Address } from '../types';
import RequiredIndicator from './RequiredIndicator';
import CountrySelector from './CountrySelector';
import AddressHelper from './AddressHelper';

export const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, required?: boolean, error?: string }> = ({ label, id, required, error, ...props }) => (
    <div>
        <label htmlFor={id} className="flex items-center text-sm font-medium text-white mb-1">
            {label} <RequiredIndicator required={required} isMet={!!props.value} />
        </label>
        <input id={id} {...props} className={`w-full bg-transparent border-0 border-b p-2 text-white focus:outline-none focus:ring-0 ${error ? 'border-red-500' : 'border-[#005ca0] focus:border-[#ff8400]'} disabled:bg-transparent disabled:border-b disabled:border-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed`} />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);


export const FormRadioGroup: React.FC<{ legend: string, name: string, options: string[], value: string, onChange: (value: any) => void, required?: boolean, error?: string }> = ({ legend, name, options, value, onChange, required, error }) => (
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

export const AddressFields: React.FC<{ address: Address, onUpdate: (field: keyof Address, value: string) => void, onBulkUpdate: (parsedAddress: Partial<Address>) => void, prefix: string, errors: Record<string, string> }> = ({ address, onUpdate, onBulkUpdate, prefix, errors }) => (
    <>
        <AddressHelper onAddressParsed={onBulkUpdate} variant="underline" />
        <CountrySelector id={`${prefix}Country`} required value={address.country} onUpdate={value => onUpdate('country', value)} variant="underline" error={errors.country}/>
        <FormInput label="Street 1" id={`${prefix}Street1`} required value={address.street1} onChange={e => onUpdate('street1', e.target.value)} error={errors.street1} />
        <FormInput label="Street 2" id={`${prefix}Street2`} value={address.street2 || ''} onChange={e => onUpdate('street2', e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormInput label="City" id={`${prefix}City`} required value={address.city} onChange={e => onUpdate('city', e.target.value)} error={errors.city} />
            <FormInput label="State or Province" id={`${prefix}State`} required value={address.state} onChange={e => onUpdate('state', e.target.value)} error={errors.state} />
            <FormInput label="ZIP/Postal Code" id={`${prefix}Zip`} required value={address.zip} onChange={e => onUpdate('zip', e.target.value)} error={errors.zip} />
        </div>
    </>
);
