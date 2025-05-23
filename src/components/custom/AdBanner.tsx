'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/router'; // Import useRouter

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
  const adRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // Initialize router

  // Existing useEffect for initial ad load & shouldShowAd changes
  useEffect(() => {
    if (!shouldShowAd) {
      console.log(`AdBanner: Ad not shown for slot ${dataAdSlot} because shouldShowAd is false (initial/prop change).`);
      return;
    }
    if (!adRef.current) {
      console.log(`AdBanner: Ad not pushed for slot ${dataAdSlot} because adRef is not yet available (initial load).`);
      return;
    }
    // Only push if no children, to avoid multiple pushes if component re-renders without route change
    if (adRef.current && !adRef.current.hasChildNodes()) {
      console.log(`AdBanner: Attempting to push ad for slot ${dataAdSlot}. Ad container visibility: ${shouldShowAd} (initial/prop change).`);
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        console.log(`AdSense push for slot ${dataAdSlot} (initial/prop change)`);
      } catch (err) {
        console.error(`Error pushing to adsbygoogle for slot ${dataAdSlot} (initial/prop change):`, err);
      }
    } else if (adRef.current && adRef.current.hasChildNodes()) {
        console.log(`AdBanner: Ad slot ${dataAdSlot} already has content. Skipping initial push. Route change handler will manage refreshes.`);
    }
  }, [shouldShowAd, dataAdSlot]); // Keep dependencies relevant to initial load

  // New useEffect for handling route changes
  useEffect(() => {
    console.log(`AdBanner: Router readiness for slot ${dataAdSlot}: ${router.isReady}`);

    if (!router.isReady) {
      console.log(`AdBanner: Router not ready for slot ${dataAdSlot}. Skipping route event subscription for now.`);
      return; // Router is not ready yet, so don't attach listeners
    }

    const handleRouteChange = () => {
      console.log(`AdBanner: Route change detected. Slot: ${dataAdSlot}, Visible: ${shouldShowAd}`);
      if (shouldShowAd && adRef.current) {
        // We assume AdSense handles a new push({}) on an existing initialized slot.
        // No manual clearing of adRef.current.innerHTML.
        console.log(`AdBanner: Attempting to refresh ad for slot ${dataAdSlot} due to route change.`);
        try {
          if (typeof (window as any).adsbygoogle !== 'undefined') { // Check if adsbygoogle is loaded
            (window as any).adsbygoogle.push({});
            console.log(`AdBanner: AdSense push successful for slot ${dataAdSlot} (route change).`);
          } else {
            console.warn(`AdBanner: adsbygoogle not defined at time of route change for slot ${dataAdSlot}.`);
          }
        } catch (err) {
          console.error(`AdBanner: Error pushing to adsbygoogle for slot ${dataAdSlot} (route change):`, err);
        }
      } else {
        console.log(`AdBanner: Ad not refreshed on route change. Conditions not met (shouldShowAd: ${shouldShowAd}, adRef.current: ${!!adRef.current}) for slot ${dataAdSlot}.`);
      }
    };

    // Proceed with attaching event listeners only if router is ready
    router.events.on('routeChangeComplete', handleRouteChange);
    console.log(`AdBanner: Subscribed to routeChangeComplete for slot ${dataAdSlot} (router is ready).`);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      console.log(`AdBanner: Unsubscribed from routeChangeComplete for slot ${dataAdSlot} (router is ready).`);
    };
  }, [router, dataAdSlot, shouldShowAd]); // Add router, dataAdSlot, shouldShowAd to dependencies

  if (!shouldShowAd) {
    return null; 
  }

  return (
    <div className={`ad-container ${className}`} ref={adRef} key={dataAdSlot}> {/* Added key here */}
      <ins
        className="adsbygoogle"
        // key={dataAdSlot} // key on parent div is generally preferred
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
