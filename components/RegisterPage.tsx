import React, { useState } from 'react';

interface RegisterPageProps {
  onRegister: (firstName: string, lastName: string, email: string, password: string) => boolean;
  switchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, switchToLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      setError('All fields are required.');
      return;
    }
    const success = onRegister(firstName, lastName, email, password);
    if (!success) {
      setError('This email is already registered. Please try logging in.');
    } else {
      setError('');
    }
  };

  return (
    <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-4">
            <div className="flex-1">
                <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">First Name</label>
                <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
                    required
                    autoComplete="given-name"
                />
            </div>
            <div className="flex-1">
                <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">Last Name</label>
                <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
                    required
                    autoComplete="family-name"
                />
            </div>
        </div>
        <div>
            <label htmlFor="email-register" className="block text-sm font-medium text-white mb-2">Email Address</label>
            <input
            type="email"
            id="email-register"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
            required
            autoComplete="email"
            />
        </div>
        <div>
            <label htmlFor="password-register" className="block text-sm font-medium text-white mb-2">Password</label>
            <input
            type="password"
            id="password-register"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
            required
            autoComplete="new-password"
            />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 !mt-10">
            Sign Up
        </button>
        <p className="text-sm text-center text-white">
            Already have an account?{' '}
            <button type="button" onClick={switchToLogin} className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 hover:underline">
            Sign In
            </button>
        </p>
        </form>
    </div>
  );
};

export default RegisterPage;