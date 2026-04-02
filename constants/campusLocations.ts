export interface CampusLocation {
  id: string;
  name: string;
  image: any; 
  description?: string;
}

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: 'tmc-new-building',
    name: 'TMC New Building',
    image: require('../assets/images/campusLocations/TMC-new-building.jpeg'),
    description: 'TMC new building'
  },
  {
    id: 'tennis-court',
    name: 'Tennis Court',
    image: require('../assets/images/campusLocations/Tennis-court.jpeg'),
    description: 'Outdoor tennis court'
  },
  {
    id: 'river-side',
    name: 'River Side',
    image: require('../assets/images/campusLocations/River-Side.jpeg'),
    description: 'Scenic river view area'
  },
  {
    id: 'motorpool',
    name: 'Motorpool',
    image: require('../assets/images/campusLocations/Motorpool.jpeg'),
    description: 'Vehicle parking and maintenance area'
  },
  {
    id: 'guinobatan',
    name: 'Guinobatan Gymnasium',
    image: require('../assets/images/campusLocations/Guinobatan.jpeg'),
    description: 'Gymnasium for performances and sports events'
  },
];