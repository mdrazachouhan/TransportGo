import React from 'react';
import { View } from 'react-native';

export const MapView = React.forwardRef((props: any, ref: any) => {
  return <View ref={ref} {...props} />;
}) as any;

MapView.displayName = 'MapView';

export const Marker = (_props: any) => null;
