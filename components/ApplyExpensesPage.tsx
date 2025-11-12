import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { EventData, Expense, UserProfile } from '../types';
import { expenseTypes } from '../data/appData';
import SearchableSelector from './SearchableSelector';
import { FormInput } from './FormControls';
import { storageRepo } from '../services/firebaseStorageRepo';

interface ApplyExpensesPageProps {
  formData: EventData;
  userProfile: UserProfile; // Added userProfile to access UID for storage path
  updateFormData: (data: Partial<EventData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

interface ExpenseFormState {
    type: Expense['type'];
    amount: number | '';
    file: File | null;
    fileName?: string; // For displaying existing file name during edit
    fileUrl?: string; // For tracking existing file URL during edit
}

const initialFormState: ExpenseFormState = {
    type: '',
    amount: '',
    file: null,
    fileName: '',
    fileUrl: '',
};

// --- Icons ---
const EditIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const DeleteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const UploadSpinner: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
    </div>
);


const ApplyExpensesPage: React.FC<ApplyExpensesPageProps> = ({ formData, userProfile, updateFormData, nextStep, prevStep }) => {
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const modalRoot = document.getElementById('modal-root');

  useEffect(() => {
    if (showErrorOverlay) {
        const timer = setTimeout(() => setShowErrorOverlay(false), 3000);
        return () => clearTimeout(timer);
    }
  }, [showErrorOverlay]);

  const totalExpenses = useMemo(() => {
    return formData.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [formData.expenses]);
  
  const availableExpenseTypes = useMemo(() => {
    const usedTypes = new Set(formData.expenses.map(exp => exp.type));
    if (editingId) {
        // If editing, the current expense type should be available in the dropdown
        const currentType = formData.expenses.find(e => e.id === editingId)?.type;
        if (currentType) usedTypes.delete(currentType);
    }
    return expenseTypes.filter(type => !usedTypes.has(type as Expense['type']));
  }, [formData.expenses, editingId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!expenseForm.type) newErrors.type = 'Please select an expense type.';
    if (!expenseForm.amount || expenseForm.amount <= 0) newErrors.amount = 'Amount must be greater than zero.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleFormChange = (updates: Partial<ExpenseFormState>) => {
    setExpenseForm(prev => ({ ...prev, ...updates }));
    const fields = Object.keys(updates);
    if (fields.some(field => errors[field])) {
      setErrors(prev => {
        const newErrors = { ...prev };
        fields.forEach(field => delete newErrors[field as keyof typeof newErrors]);
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFormChange({ file });
  };
  
  const handleSaveExpense = async () => {
    if (!validateForm()) return;
    setIsUploading(true);

    const expenseId = editingId || `exp-${Date.now()}`;
    let fileUploadData: { fileName: string; fileUrl?: string } = {
        fileName: expenseForm.fileName || '',
        fileUrl: expenseForm.fileUrl || '',
    };

    try {
        if (expenseForm.file) {
            const { downloadURL, fileName } = await storageRepo.uploadExpenseReceipt(expenseForm.file, userProfile.uid, expenseId);
            fileUploadData = { fileName, fileUrl: downloadURL };
        }
    
        const newExpense: Expense = {
          id: expenseId,
          type: expenseForm.type,
          amount: expenseForm.amount,
          fileName: fileUploadData.fileName,
          fileUrl: fileUploadData.fileUrl,
        };

        const updatedExpenses = editingId
          ? formData.expenses.map(exp => exp.id === editingId ? newExpense : exp)
          : [...formData.expenses, newExpense];
        
        updateFormData({ expenses: updatedExpenses });
        setExpenseForm(initialFormState);
        setEditingId(null);
        setErrors({});
    } catch (error) {
        console.error("File upload failed:", error);
        setErrors(prev => ({...prev, file: "File upload failed. Please try again."}));
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setExpenseForm({
      type: expense.type,
      amount: expense.amount,
      file: null, // User can optionally re-upload file on edit
      fileName: expense.fileName,
      fileUrl: expense.fileUrl,
    });
    setErrors({});
  };

  const handleDelete = (id: string) => {
    // In a real app, you'd also delete the file from storage here
    // using a reference created from the fileUrl or path.
    const updatedExpenses = formData.expenses.filter(exp => exp.id !== id);
    updateFormData({ expenses: updatedExpenses });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setExpenseForm(initialFormState);
    setErrors({});
  };
  
  const handleNext = () => {
    if (formData.expenses.length < expenseTypes.length) {
      setShowErrorOverlay(true);
      return;
    }
    nextStep();
  };


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Expenses</h2>
        <p className="text-gray-300 mt-1">Add your expenses for each category below. A receipt is not required for any expense.</p>
      </div>

      {availableExpenseTypes.length > 0 || editingId ? (
        <div className="bg-[#004b8d]/50 p-6 rounded-lg border border-[#005ca0] space-y-4">
          <h3 className="font-semibold text-lg text-white">{editingId ? 'Edit Expense' : 'Add New Expense'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              <SearchableSelector
                  label="Expense Type"
                  id="expenseType"
                  required
                  value={expenseForm.type}
                  onUpdate={value => handleFormChange({ type: value as Expense['type'] })}
                  options={availableExpenseTypes}
                  variant="underline"
                  error={errors.type}
                  disabled={!!editingId} // Prevent changing type on edit
              />
               <FormInput
                  label="Amount (USD)"
                  id="amount"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => handleFormChange({ amount: parseFloat(e.target.value) || '' })}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                  error={errors.amount}
              />
              <div>
                   <label htmlFor="receiptUpload" className="flex items-center text-sm font-medium text-white mb-1">
                      Receipt
                   </label>
                   <div className="flex items-center gap-2">
                      <label className="bg-[#005ca0] hover:bg-[#006ab3] text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200 cursor-pointer">
                          <span>Upload</span>
                          <input id="receiptUpload" type="file" className="hidden" onChange={handleFileChange} accept="image/jpeg,image/png,application/pdf" />
                      </label>
                      <span className="text-gray-300 text-sm truncate" title={expenseForm.file?.name || expenseForm.fileName}>
                        {expenseForm.file?.name || expenseForm.fileName || 'No file chosen'}
                      </span>
                   </div>
                   {errors.file && <p className="text-red-400 text-xs mt-1">{errors.file}</p>}
              </div>
          </div>
          <div className="flex justify-center gap-4 pt-4">
              {editingId && (
                  <button type="button" onClick={handleCancelEdit} disabled={isUploading} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-5 rounded-md transition-colors duration-200 text-base disabled:opacity-50">Cancel</button>
              )}
              <button type="button" onClick={handleSaveExpense} disabled={isUploading} className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-5 rounded-md transition-colors duration-200 text-base w-40 h-12 flex items-center justify-center disabled:opacity-50">
                  {isUploading ? <UploadSpinner /> : (editingId ? 'Update Expense' : 'Add Expense')}
              </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#004b8d]/50 p-6 rounded-lg border border-[#005ca0] text-center">
          <p className="text-white font-semibold">All available expense types have been added.</p>
        </div>
      )}
      
      {/* Summary Grid */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-2">Expense Summary</h3>
        <table className="min-w-full bg-[#005ca0] rounded-lg">
          <thead>
            <tr className="border-b border-[#003a70]">
              <th className="text-left p-3 font-semibold text-white/90">Type</th>
              <th className="text-right p-3 font-semibold text-white/90">Amount (USD)</th>
              <th className="text-center p-3 font-semibold text-white/90">Actions</th>
            </tr>
          </thead>
          <tbody>
            {formData.expenses.length > 0 ? (
                formData.expenses.map(expense => (
                    <tr key={expense.id} className="border-b border-[#003a70] last:border-b-0">
                        <td className="p-3 text-white font-medium">{expense.type}</td>
                        <td className="text-right p-3 text-white font-mono">${Number(expense.amount).toFixed(2)}</td>
                        <td className="p-3">
                            <div className="flex justify-center items-center gap-4">
                                <button onClick={() => handleEdit(expense)} className="text-gray-300 hover:text-white transition-colors" title="Edit Expense"><EditIcon /></button>
                                <button onClick={() => handleDelete(expense.id)} className="text-gray-300 hover:text-red-400 transition-colors" title="Delete Expense"><DeleteIcon /></button>
                            </div>
                        </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={3} className="text-center p-8 text-gray-400">No expenses added yet.</td>
                </tr>
            )}
          </tbody>
           <tfoot>
                <tr className="bg-[#003a70]">
                    <td className="text-right font-bold p-3 text-white/90">Total</td>
                    <td className="text-right font-bold p-3 text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] font-mono text-lg">${totalExpenses.toFixed(2)}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
      </div>

      <div className="flex justify-between items-start pt-4">
        <button onClick={prevStep} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
          Back
        </button>
        <div className="flex flex-col items-end">
          <button onClick={handleNext} disabled={formData.expenses.length < expenseTypes.length} className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
      </div>
      {showErrorOverlay && modalRoot && createPortal(
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] animate-[fadeIn_0.3s_ease-out]"
            role="alert"
            aria-live="assertive"
        >
            <div className="bg-[#003a70] border border-red-500/50 rounded-lg p-8 shadow-2xl text-center max-w-sm mx-4">
                <p className="text-white text-lg">Add details for all available expenses before advancing</p>
            </div>
        </div>,
        modalRoot
      )}
    </div>
  );
};

export default ApplyExpensesPage;