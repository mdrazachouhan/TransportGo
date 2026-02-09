export interface VehiclePricing {
  base: number;
  perKm: number;
  name: string;
  capacity: string;
  icon: string;
  iconFamily: 'MaterialCommunityIcons' | 'Ionicons';
}

export const VEHICLE_PRICING: Record<string, VehiclePricing> = {
  auto: { base: 50, perKm: 10, name: 'Auto', capacity: 'Up to 200kg', icon: 'rickshaw', iconFamily: 'MaterialCommunityIcons' },
  tempo: { base: 100, perKm: 10, name: 'Tempo', capacity: 'Up to 1000kg', icon: 'van-utility', iconFamily: 'MaterialCommunityIcons' },
  truck: { base: 200, perKm: 10, name: 'Truck', capacity: '1000kg+', icon: 'truck', iconFamily: 'MaterialCommunityIcons' },
};

export function calculatePrice(vehicleType: string, distance: number) {
  const pricing = VEHICLE_PRICING[vehicleType];
  if (!pricing) return { basePrice: 0, perKmCharge: 0, totalPrice: 0 };
  return {
    basePrice: pricing.base,
    perKmCharge: pricing.perKm,
    distanceCharge: Math.round(distance * pricing.perKm),
    totalPrice: Math.round(pricing.base + distance * pricing.perKm),
  };
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function calculateDistance(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
