import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => boolean;
  switchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, switchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    const success = onLogin(email, password);
    if (!success) {
      setError('Invalid email or password. Please try again.');
    } else {
      setError('');
    }
  };

  return (
    <div className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-2">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-2">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 !mt-10">
          Sign In
        </button>
        <p className="text-sm text-center text-white">
          Don't have an account?{' '}
          <button type="button" onClick={switchToRegister} className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 hover:underline">
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;