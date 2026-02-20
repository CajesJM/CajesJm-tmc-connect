import { Redirect } from 'expo-router';

export default function AdminIndex() {
  return <Redirect href="/assistant_admin/(tabs)/announcements" />;
}