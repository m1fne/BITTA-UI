'use client';

import SplashScreen from './SplashScreen';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      {children}
    </>
  );
}