import * as React from 'react';

export const navigationRef = React.createRef<any>();

export const navigate = (name: string, params?: any) => {
  const nav = navigationRef.current;
  if (nav && typeof nav.navigate === 'function') {
    nav.navigate(name, params);
  }
};
