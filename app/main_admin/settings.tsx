import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsScreen() {
  const { theme, setTheme, colors, isDark, toggleTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light Mode', icon: 'sunny-outline' },
    { value: 'dark', label: 'Dark Mode', icon: 'moon-outline' },
    { value: 'system', label: 'System Default', icon: 'phone-portrait-outline' },
  ] as const;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Settings', headerShown: true }} />
      
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        
        {/* Quick Toggle */}
        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLeft}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={colors.accent.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.accent.primary }}
            thumbColor={isDark ? '#fff' : '#f4f3f4'}
          />
        </View>

        <Text style={[styles.subTitle, { color: colors.sidebar.text.secondary }]}>Theme Preference</Text>
        
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.themeOption,
              theme === option.value && { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)' }
            ]}
            onPress={() => setTheme(option.value)}
          >
            <View style={styles.themeOptionLeft}>
              <Ionicons 
                name={option.icon} 
                size={22} 
                color={theme === option.value ? colors.accent.primary : colors.sidebar.text.secondary} 
              />
              <Text style={[
                styles.themeOptionText, 
                { color: theme === option.value ? colors.accent.primary : colors.text }
              ]}>
                {option.label}
              </Text>
            </View>
            {theme === option.value && (
              <Ionicons name="checkmark" size={22} color={colors.accent.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <View style={styles.settingItem}>
          <Text style={[styles.settingText, { color: colors.sidebar.text.secondary }]}>Version</Text>
          <Text style={[styles.versionText, { color: colors.text }]}>1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { margin: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  sectionTitle: { fontSize: 18, fontWeight: '600', padding: 16, paddingBottom: 8 },
  subTitle: { fontSize: 13, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { fontSize: 16, fontWeight: '500' },
  versionText: { fontSize: 16, color: '#64748B' },
  themeOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginHorizontal: 8, marginVertical: 4, borderRadius: 8 },
  themeOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeOptionText: { fontSize: 15, fontWeight: '500' },
});