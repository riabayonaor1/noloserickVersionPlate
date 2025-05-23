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
    console.log(`AdBanner: useEffect triggered for slot ${dataAdSlot}. shouldShowAd: ${shouldShowAd}`);
    if (shouldShowAd) {
      if (adRef.current && adRef.current.hasChildNodes()) {
        console.log(`AdBanner: Ad container for slot ${dataAdSlot} already has content. Skipping ad push for this instance.`);
        return;
      }
      console.log(`AdBanner: Attempting to load ad for slot ${dataAdSlot}. Ad container visible: ${!!adRef.current}`);
      try {
        // Ensure adsbygoogle is initialized
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        console.log(`AdBanner: adsbygoogle.push() called for slot ${dataAdSlot}.`);
      } catch (err) {
        console.error(`AdBanner: Error during adsbygoogle.push() for slot ${dataAdSlot}:`, err);
      }
    }
  }, [shouldShowAd, dataAdSlot]);

  if (!shouldShowAd) {
    console.log(`AdBanner: Ad not shown for slot ${dataAdSlot} because shouldShowAd is false.`);
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
