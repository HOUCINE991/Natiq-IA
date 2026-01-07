import React from 'react';

interface InfoSectionProps {
  content: string;
}

const InfoSection: React.FC<InfoSectionProps> = ({ content }) => {
  return (
    <div className="text-slate-300 leading-relaxed text-base space-y-4">
      <p>{content}</p>
      <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
        <p className="text-xs text-indigo-200 opacity-80">
            Natiq AI &copy; {new Date().getFullYear()}. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default InfoSection;