import { Redirect } from 'expo-router';

export default function StudentIndex() {
  return <Redirect href="/student/(tabs)/announcements" />;
}