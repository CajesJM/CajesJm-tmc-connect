export interface CampusLocation {
  id: string;
  name: string;
  image: any; 
  description?: string;
}

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: 'library-hall',
    name: 'Library Hall',
    image: require('../assets/images/campusLocations/sampleevents.jpg'),
    description: 'Main library and study hall'
  },
  {
    id: 'main-campus',
    name: 'Main Campus',
    image: require('../assets/images/campusLocations/sampleevents.jpg'),
    description: 'Central campus area'
  },
  {
    id: 'expansion-building',
    name: 'Expansion Building',
    image: require('../assets/images/campusLocations/sampleevents.jpg'),
    description: 'New academic building'
  },
  {
    id: 'gymnasium',
    name: 'Gymnasium',
    image: require('../assets/images/campusLocations/sampleevents.jpg'),
    description: 'Sports and events venue'
  },
  {
    id: 'auditorium',
    name: 'Auditorium',
    image: require('../assets/images/campusLocations/sampleevents.jpg'),
    description: 'Main events and performances hall'
  },
  {
    id: 'cafeteria',
    name: 'Cafeteria',
    image: require('../assets/images/campusLocations/sampleevents.jpg'),
    description: 'Student dining area'
  }
];