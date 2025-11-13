import React from 'react';
import { useTranslation } from 'react-i18next';

interface RequiredIndicatorProps {
  required?: boolean;
  isMet: boolean;
}

const RequiredIndicator: React.FC<RequiredIndicatorProps> = ({ required, isMet }) => {
  const { t } = useTranslation();
  if (!required || isMet) {
    return null;
  }

  return (
    <span className="relative flex h-3 w-3 ml-1" title={t('formControls.requiredField')}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff8400] opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff9d33]"></span>
    </span>
  );
};

export default RequiredIndicator;