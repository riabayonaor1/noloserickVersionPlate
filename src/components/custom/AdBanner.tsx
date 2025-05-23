'use client';

import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  shouldShowAd: boolean; // Prop to control ad visibility
}

const AdBanner: React.FC<AdBannerProps> = ({
  dataAdSlot,
  dataAdFormat = 'auto',
  dataFullWidthResponsive = true,
  className = '',
  style = { display: 'block' },
  shouldShowAd,
}) => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (shouldShowAd && adRef.current && !adRef.current.hasChildNodes()) {
      try {
        // Ensure adsbygoogle is initialized
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        console.log(`AdSense push for slot ${dataAdSlot}`);
      } catch (err) {
        console.error(`Error pushing to adsbygoogle for slot ${dataAdSlot}:`, err);
      }
    }
  }, [shouldShowAd, dataAdSlot]);

  if (!shouldShowAd) {
    return null; // Don't render the ad container if shouldShowAd is false
  }

  return (
    <div className={`ad-container ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-6483322960648315"
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive?.toString()}
        data-adtest={process.env.NODE_ENV === 'development' ? 'on' : undefined} // Enable test ads in development
      ></ins>
    </div>
  );
};

export default AdBanner;
