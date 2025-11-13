import React from 'react';

export const UserIcon: React.FC = () => (
  <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-sm">
    YOU
  </div>
);

export const BotIcon: React.FC = () => (
  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.5 8.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6.5-1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM6 13a4 4 0 008 0H6z" clipRule="evenodd" />
    </svg>
  </div>
);

export const UserAIcon: React.FC = () => (
  <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
    A
  </div>
);

export const UserBIcon: React.FC = () => (
  <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
    B
  </div>
);

export const SendIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

export const MicIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" />
        <path fillRule="evenodd" d="M10 18a7 7 0 007-7h-2a5 5 0 01-5 5v2zM3 11a7 7 0 007 7v-2a5 5 0 01-5-5H3z" clipRule="evenodd" />
    </svg>
);

export const MicOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a3 3 0 00-3 3v4a3 3 0 005.121 2.121l4.764 4.764a1 1 0 001.414-1.414l-1.88-1.88A7.002 7.002 0 0017 8V7a7 7 0 00-7-7zM8.707 12.293a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM10 12a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

export const VolumeOnIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
    <path d="M12.293 5.293a1 1 0 011.414 0A5.973 5.973 0 0115 10a5.973 5.973 0 01-1.293 4.707 1 1 0 11-1.414-1.414A3.973 3.973 0 0013 10a3.973 3.973 0 00-.707-2.293 1 1 0 010-1.414z" />
  </svg>
);

export const VolumeOffIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9.383 3.076a1 1 0 011.09.217l3.707 3.707H18a1 1 0 011 1v4a1 1 0 01-1 1h-2.586l-3.707 3.707a1 1 0 01-1.707-.707V4a1 1 0 01.617-.924zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
      <path d="M12.293 5.293a1 1 0 011.414 0A5.973 5.973 0 0115 10a5.973 5.973 0 01-1.293 4.707 1 1 0 11-1.414-1.414A3.973 3.973 0 0013 10a3.973 3.973 0 00-.707-2.293 1 1 0 010-1.414z" />
      <path fillRule="evenodd" d="M1.293 1.293a1 1 0 011.414 0L8 6.586l5.293-5.293a1 1 0 111.414 1.414L9.414 8l5.293 5.293a1 1 0 01-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 01-1.414-1.414L6.586 8 1.293 2.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

export const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

export const FileIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
);

export const CheckCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const XCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const LogoutIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
    </svg>
);

export const TrashIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
  </svg>
);