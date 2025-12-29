import React from 'react';
import { ToastHost } from '../components/ToastHost';

type Props = {
  children: React.ReactNode;
};

export const ToastProvider: React.FC<Props> = ({ children }) => {
  return (
    <>
      {children}
      <ToastHost />
    </>
  );
};
