// A simplified Google Calendar-style icon (white page, blue/yellow/green/red
// edges, "31"), drawn in SVG so it needs no image asset, for the Connect
// Google Calendar buttons. Not Google's official artwork.
import React from 'react';
import Svg, { Defs, ClipPath, Rect, G, Path, Text as SvgText } from 'react-native-svg';

export function GoogleCalendarLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id="gcal-clip">
          <Rect x="4" y="4" width="40" height="40" rx="6" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#gcal-clip)">
        <Rect x="4" y="4" width="40" height="40" fill="#FFFFFF" />
        <Rect x="4" y="4" width="40" height="9" fill="#4285F4" />
        <Rect x="4" y="4" width="9" height="40" fill="#4285F4" />
        <Rect x="35" y="13" width="9" height="22" fill="#FBBC04" />
        <Rect x="13" y="35" width="22" height="9" fill="#34A853" />
        <Path d="M35 35h9v9h-9z" fill="#EA4335" />
      </G>
      <SvgText x="24" y="32" fontSize="15" fontWeight="bold" fill="#4285F4" textAnchor="middle">
        31
      </SvgText>
    </Svg>
  );
}
