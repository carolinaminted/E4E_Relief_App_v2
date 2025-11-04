import React, { useState } from 'react';
import { FormInput } from './FormControls';

interface DonatePageProps {
  navigate: (page: 'support') => void;
}

const predefinedAmounts = [25, 50, 100, 250];

// --- UI Icons ---
const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[#ff8400] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

type DonateSection = 'amount' | 'details';

const DonatePage: React.FC<DonatePageProps> = ({ navigate }) => {
  const [amount, setAmount] = useState<number | string>(50);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [openSection, setOpenSection] = useState<DonateSection | null>('amount');

  const toggleSection = (section: DonateSection) => {
    setOpenSection(prev => (prev === section ? null : section));
  };

  const handleAmountSelect = (selectedAmount: number | 'custom') => {
    if (selectedAmount === 'custom') {
      setAmount('');
    } else {
      setAmount(selectedAmount);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    let finalValue = value;

    if (id === 'cardNumber') {
      finalValue = value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
    } else if (id === 'expiryDate') {
      finalValue = value.replace(/[^\d]/g, '').replace(/(\d{2})(\d{1,2})/, '$1 / $2').slice(0, 7);
    } else if (id === 'cvc') {
      finalValue = value.replace(/[^\d]/g, '').slice(0, 4);
    }

    setFormData(prev => ({ ...prev, [id]: finalValue }));
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!amount || Number(amount) <= 0) newErrors.amount = 'Please enter a valid amount.';
    if (!formData.firstName) newErrors.firstName = 'First name is required.';
    if (!formData.lastName) newErrors.lastName = 'Last name is required.';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email.';
    if (!formData.cardholderName) newErrors.cardholderName = 'Cardholder name is required.';
    if (formData.cardNumber.replace(/\s/g, '').length < 15) newErrors.cardNumber = 'Please enter a valid card number.';
    if (!/^(0[1-9]|1[0-2]) \/ \d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Invalid format (MM / YY).';
    } else {
        const [month, year] = formData.expiryDate.split(' / ');
        const expiry = new Date(Number(`20${year}`), Number(month) - 1);
        const now = new Date();
        now.setMonth(now.getMonth(), 1); // Compare against the first day of the current month
        if (expiry < now) {
            newErrors.expiryDate = 'Card has expired.';
        }
    }
    if (formData.cvc.length < 3) newErrors.cvc = 'CVC must be 3 or 4 digits.';
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
        if (newErrors.amount) {
            setOpenSection('amount');
        } else {
            setOpenSection('details');
        }
    }
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
      }, 2000);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-full max-w-md bg-[#004b8d] p-10 rounded-lg shadow-lg">
          <svg className="w-16 h-16 text-[#edda26] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#edda26] to-[#ff8400]">
            Thank You!
          </h1>
          <p className="text-white mb-8">
            Your generous donation of ${Number(amount).toFixed(2)} will make a difference. A receipt has been sent to your email.
          </p>
          <button
            onClick={() => navigate('support')}
            className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
          >
            Back to Support Center
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-6">
            <button onClick={() => navigate('support')} className="absolute left-0 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Support Center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
              Make a Donation
            </h1>
        </div>
        
        <form onSubmit={handleSubmit} noValidate className="bg-[#004b8d]/50 p-8 rounded-lg border border-[#005ca0] space-y-4">
            
            {/* Amount Section */}
            <fieldset className="border-b border-[#005ca0] pb-4">
                 <button type="button" onClick={() => toggleSection('amount')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'amount'}>
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Choose an Amount</h2>
                    <ChevronIcon isOpen={openSection === 'amount'} />
                </button>
                <div className={`transition-all duration-500 ease-in-out ${openSection === 'amount' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {predefinedAmounts.map(preAmount => (
                            <button type="button" key={preAmount} onClick={() => handleAmountSelect(preAmount)} className={`p-4 rounded-md font-bold text-lg transition-all duration-200 border-2 ${amount === preAmount ? 'bg-[#ff8400] text-white border-[#ff8400]' : 'bg-[#003a70]/50 border-transparent hover:border-[#ff8400]'}`}>
                                ${preAmount}
                            </button>
                        ))}
                        <input 
                            type="number" 
                            placeholder="Custom" 
                            value={typeof amount === 'number' ? '' : amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onFocus={() => handleAmountSelect('custom')}
                            className={`p-4 rounded-md font-bold text-lg text-center bg-[#003a70]/50 border-2 focus:bg-[#ff8400] focus:text-white focus:border-[#ff8400] focus:outline-none focus:ring-0 ${!predefinedAmounts.includes(Number(amount)) && amount !== '' ? 'bg-[#ff8400] text-white border-[#ff8400]' : 'border-transparent'}`}
                        />
                    </div>
                    {errors.amount && <p className="text-red-400 text-xs mt-2">{errors.amount}</p>}
                </div>
            </fieldset>

            {/* Details Section */}
             <fieldset className="pb-4">
                 <button type="button" onClick={() => toggleSection('details')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'details'}>
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Donor & Payment Information</h2>
                    <ChevronIcon isOpen={openSection === 'details'} />
                </button>
                <div className={`transition-all duration-500 ease-in-out ${openSection === 'details' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        {/* Donor Information */}
                        <fieldset className="space-y-6">
                            <legend className="text-lg font-semibold text-white/90 mb-2">Your Information</legend>
                            <FormInput label="First Name" id="firstName" value={formData.firstName} onChange={handleInputChange} error={errors.firstName} required />
                            <FormInput label="Last Name" id="lastName" value={formData.lastName} onChange={handleInputChange} error={errors.lastName} required />
                            <FormInput label="Email Address" id="email" type="email" value={formData.email} onChange={handleInputChange} error={errors.email} required />
                        </fieldset>

                        {/* Payment Details */}
                        <fieldset className="space-y-6">
                            <legend className="text-lg font-semibold text-white/90 mb-2">Payment Details</legend>
                            <FormInput label="Name on Card" id="cardholderName" value={formData.cardholderName} onChange={handleInputChange} error={errors.cardholderName} required />
                            <FormInput label="Card Number" id="cardNumber" value={formData.cardNumber} onChange={handleInputChange} error={errors.cardNumber} placeholder="0000 0000 0000 0000" required />
                            <div className="flex gap-6">
                                <FormInput label="Expiry Date" id="expiryDate" value={formData.expiryDate} onChange={handleInputChange} error={errors.expiryDate} placeholder="MM / YY" required />
                                <FormInput label="CVC" id="cvc" value={formData.cvc} onChange={handleInputChange} error={errors.cvc} placeholder="123" required />
                            </div>
                        </fieldset>
                    </div>
                </div>
            </fieldset>

            <div className="flex justify-center pt-6">
                 <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full max-w-xs bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-90 text-white font-bold py-3 px-6 rounded-md transition-all duration-200 flex justify-center items-center h-12 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isProcessing ? (
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                    ) : (
                        `Donate $${Number(amount).toFixed(2)}`
                    )}
                </button>
            </div>
        </form>
    </div>
  );
};

export default DonatePage;