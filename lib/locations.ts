export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  area: string;
}

export const MOCK_LOCATIONS: Location[] = [
  { id: '1', name: 'Indore Railway Station', lat: 22.7196, lng: 75.8577, area: 'Station Area' },
  { id: '2', name: 'Treasure Island Mall', lat: 22.7532, lng: 75.8937, area: 'AB Road' },
  { id: '3', name: 'Rajwada Palace', lat: 22.7185, lng: 75.8579, area: 'Rajwada' },
  { id: '4', name: 'Sarafa Bazaar', lat: 22.7190, lng: 75.8560, area: 'Old City' },
  { id: '5', name: 'Vijay Nagar Square', lat: 22.7533, lng: 75.8827, area: 'Vijay Nagar' },
  { id: '6', name: 'Palasia Square', lat: 22.7240, lng: 75.8800, area: 'Palasia' },
  { id: '7', name: 'C21 Mall', lat: 22.7190, lng: 75.8652, area: 'AB Road' },
  { id: '8', name: 'Phoenix Citadel Mall', lat: 22.6850, lng: 75.8800, area: 'Ring Road' },
  { id: '9', name: 'IIM Indore', lat: 22.6750, lng: 75.8475, area: 'Rau-Pithampur Road' },
  { id: '10', name: 'Devi Ahilya University', lat: 22.7196, lng: 75.8640, area: 'Takshashila Campus' },
];
