import React, { useState } from 'react';
import PolicyModal from './PolicyModal';

const Footer: React.FC = () => {
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  return (
    <>
      <footer className="w-full text-center py-4 px-4 flex-shrink-0">
        <button
          onClick={() => setIsPolicyModalOpen(true)}
          className="text-sm italic text-[#898c8d] hover:text-white transition-colors duration-200"
        >
          Powered by E4E Relief
        </button>
      </footer>
      {isPolicyModalOpen && <PolicyModal onClose={() => setIsPolicyModalOpen(false)} />}
    </>
  );
};

export default Footer;