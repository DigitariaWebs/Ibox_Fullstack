import React, { createContext, useContext, useState } from 'react';

interface MapTransitionContextType {
  mapOverlayRef: React.RefObject<any> | null;
  setMapOverlayRef: (ref: React.RefObject<any>) => void;
  overlayPosition: { x: number; y: number; width: number; height: number } | null;
  setOverlayPosition: (position: { x: number; y: number; width: number; height: number }) => void;
}

const MapTransitionContext = createContext<MapTransitionContextType | undefined>(undefined);

export const MapTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mapOverlayRef, setMapOverlayRef] = useState<React.RefObject<any> | null>(null);
  const [overlayPosition, setOverlayPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  return (
    <MapTransitionContext.Provider value={{
      mapOverlayRef,
      setMapOverlayRef,
      overlayPosition,
      setOverlayPosition,
    }}>
      {children}
    </MapTransitionContext.Provider>
  );
};

export const useMapTransition = () => {
  const context = useContext(MapTransitionContext);
  if (context === undefined) {
    throw new Error('useMapTransition must be used within a MapTransitionProvider');
  }
  return context;
};