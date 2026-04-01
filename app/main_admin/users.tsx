import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../lib/firebaseConfig';
import { createUsersStyles } from '../../styles/main-admin/usersStyles';

const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
};
const FormTextInput = ({
  style,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  keyboardType,
  secureTextEntry,
  editable = true,
  inputStyle,
  ...props
}: {
  style?: any;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: any;
  secureTextEntry?: boolean;
  editable?: boolean;
  inputStyle?: any;
  [key: string]: any;
}) => (
  <RNTextInput
    style={[inputStyle, style]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#94a3b8"
    multiline={multiline}
    numberOfLines={numberOfLines}
    keyboardType={keyboardType}
    secureTextEntry={secureTextEntry}
    editable={editable}
    {...props}
  />
);

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  surname?: string;
  role: 'main_admin' | 'assistant_admin' | 'student';
  studentID?: string;
  createdAt: any;
  course?: string;
  yearLevel?: string;
  block?: string;
  gender?: string;
  active?: boolean;
  deactivatedAt?: string;
}

const AnimatedUserItem = memo(function AnimatedUserItem({
  item,
  index,
  currentPage,
  itemsPerPage,
  styles,
  colors,
  isMobile,
  selectedUserId,
  setSelectedUserId,
  handleEditUser,
  handleDeleteUser,
  handleToggleActive,
  getRoleColor,
  getRoleBgColor,
  isCurrentUser,
}: {
  item: User;
  index: number;
  currentPage: number;
  itemsPerPage: number;
  styles: any;
  colors: any;
  isMobile: boolean;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  handleEditUser: (user: User) => void;
  handleDeleteUser: (id: string, name: string) => void;
  handleToggleActive: (user: User) => void;
  getRoleColor: (role: string) => string;
  getRoleBgColor: (role: string) => string;
  isCurrentUser: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isActive = selectedUserId === item.id;
  const roleColor = getRoleColor(item.role);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.paginatedItem,
          isActive && styles.paginatedItemActive,
          isMobile && styles.paginatedItemMobile,
          !item.active && { opacity: 0.6 },
        ]}
        onPress={() => setSelectedUserId(item.id)}
      >
        <View style={[styles.paginatedNumber, { backgroundColor: `${roleColor}15` }]}>
          <Text style={[styles.paginatedNumberText, { color: roleColor }]}>
            {(currentPage - 1) * itemsPerPage + index + 1}
          </Text>
        </View>

        <View style={styles.paginatedInfo}>
          <View style={styles.paginatedTitleRow}>
            <Text style={[styles.paginatedName, isMobile && styles.paginatedNameMobile]} numberOfLines={1}>
              {item.surname ? `${item.surname}, ${item.name}` : item.name}
            </Text>
            {!item.active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
              </View>
            )}
          </View>

          <View style={[styles.paginatedMeta, { justifyContent: 'space-between' }]}>
            <Text style={[styles.paginatedEmail, isMobile && styles.paginatedEmailMobile]}>
              {item.email}
            </Text>
            <View style={[styles.paginatedBadge, { backgroundColor: getRoleBgColor(item.role) }]}>
              <Text style={[styles.paginatedBadgeText, { color: roleColor }]}>
                {item.role.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.paginatedLocationRow}>
            <Feather name="at-sign" size={8} color={colors.accent.primary} />
            <Text style={[styles.paginatedUsername, { marginLeft: 4 }]} numberOfLines={1}>
              {item.username}
            </Text>
          </View>
        </View>

        <View style={styles.paginatedActions}>
          <TouchableOpacity
            style={[styles.paginatedEditButton, isMobile && styles.paginatedEditButtonMobile]}
            onPress={() => handleEditUser(item)}
          >
            <Feather name="edit-2" size={isMobile ? 12 : 14} color={colors.accent.primary} />
          </TouchableOpacity>
          {!isCurrentUser && (
            <>
              <TouchableOpacity
                style={[
                  styles.paginatedStatusButton,
                  { backgroundColor: item.active ? '#fff7ed' : '#e6f7e6' },
                  isMobile && styles.paginatedStatusButtonMobile,
                ]}
                onPress={() => handleToggleActive(item)}
              >
                <Feather
                  name={item.active ? 'user-x' : 'user-check'}
                  size={isMobile ? 12 : 14}
                  color={item.active ? '#ef4444' : '#10b981'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paginatedDeleteButton, isMobile && styles.paginatedDeleteButtonMobile]}
                onPress={() => handleDeleteUser(item.id, item.name)}
              >
                <Feather name="trash-2" size={isMobile ? 12 : 14} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function UserManagement() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { colors, isDark } = useTheme();

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth >= 640 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  const styles = useMemo(
    () => createUsersStyles(colors, isDark, isMobile, isTablet, isDesktop),
    [colors, isDark, isMobile, isTablet, isDesktop]
  );

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'main_admin' | 'assistant_admin' | 'student'>('all');

  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    name: '',
    surname: '',
    role: 'student' as 'main_admin' | 'assistant_admin' | 'student',
    password: '',
    studentID: '',
    course: '',
    yearLevel: '',
    block: '',
    gender: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers(users, activeFilter);
  }, [users, activeFilter]);

  useEffect(() => {
    let filtered = filterUsersByRole(users, activeFilter);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedUsers(filtered.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  }, [users, activeFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const results = users.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        (user.surname && user.surname.toLowerCase().includes(searchLower)) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower) ||
        (user.studentID && user.studentID.toLowerCase().includes(searchLower))
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, users]);

  const filterUsersByRole = (usersList: User[], filter: 'all' | 'main_admin' | 'assistant_admin' | 'student') => {
    if (filter === 'all') return usersList;
    return usersList.filter(user => user.role === filter);
  };

  const filterUsers = (usersList: User[], filter: 'all' | 'main_admin' | 'assistant_admin' | 'student') => {
    const filtered = filterUsersByRole(usersList, filter);
    setFilteredUsers(filtered);
  };

  const handleFilterChange = (filter: 'all' | 'main_admin' | 'assistant_admin' | 'student') => {
    setActiveFilter(filter);
    setCurrentPage(1);
    setSelectedUserId(null);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);

      const usersList: User[] = [];
      userSnapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          id: doc.id,
          email: data.email,
          username: data.username || '',
          name: data.name,
          surname: data.surname || '',
          role: data.role,
          studentID: data.studentID,
          createdAt: data.createdAt,
          course: data.course,
          yearLevel: data.yearLevel,
          block: data.block,
          gender: data.gender,
          active: data.active === undefined ? true : data.active,
          deactivatedAt: data.deactivatedAt,
        } as User);
      });
      usersList.sort((a, b) => {
        const surnameA = (a.surname || a.name.split(' ').pop() || '').toLowerCase();
        const surnameB = (b.surname || b.name.split(' ').pop() || '').toLowerCase();
        if (surnameA < surnameB) return -1;
        if (surnameA > surnameB) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

      setUsers(usersList);
    } catch (error) {

      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const validateCreateUser = (): { isValid: boolean; errorMessage: string } => {
    if (!newUser.name?.trim()) {
      return { isValid: false, errorMessage: 'Please enter the name.' };
    }
    if (newUser.role === 'student' && !newUser.surname?.trim()) {
      return { isValid: false, errorMessage: 'Surname is required for students.' };
    }
    if (!newUser.username?.trim()) {
      return { isValid: false, errorMessage: 'Please enter a username.' };
    }
    if (!newUser.email?.trim()) {
      return { isValid: false, errorMessage: 'Please enter an email address.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      return { isValid: false, errorMessage: 'Please enter a valid email address (e.g., user@example.com).' };
    }
    if (!newUser.role) {
      return { isValid: false, errorMessage: 'Please select a role.' };
    }
    if (newUser.role === 'student') {
      if (!newUser.studentID?.trim()) {
        return { isValid: false, errorMessage: 'Please enter the Student ID.' };
      }
      if (!newUser.course?.trim()) {
        return { isValid: false, errorMessage: 'Please enter the course (e.g., BSIT, BSCS).' };
      }
      if (!newUser.yearLevel?.trim()) {
        return { isValid: false, errorMessage: 'Please select the year level.' };
      }
      if (!newUser.block?.trim()) {
        return { isValid: false, errorMessage: 'Please enter the block (e.g., 1, 2, 3).' };
      }
      if (!newUser.gender?.trim()) {
        return { isValid: false, errorMessage: 'Please select the gender.' };
      }
    }
    if (newUser.role !== 'student') {
      if (!newUser.password?.trim()) {
        return { isValid: false, errorMessage: 'Please enter a password for the admin account.' };
      }
      if (newUser.password.length < 6) {
        return { isValid: false, errorMessage: 'Password must be at least 6 characters long.' };
      }
    }
    return { isValid: true, errorMessage: '' };
  };

  const handleCreateUser = async () => {
    const validation = validateCreateUser();
    if (!validation.isValid) {
      showAlert('Validation Error', validation.errorMessage);
      setModalLoading(false);
      return;
    }
    try {
      setModalLoading(true);
      if (newUser.role === 'student' && newUser.studentID) {
        const usersCollection = collection(db, 'users');
        const studentIdQuery = query(usersCollection, where('studentID', '==', newUser.studentID.trim()));
        const studentIdSnapshot = await getDocs(studentIdQuery);
        if (!studentIdSnapshot.empty) {
          const existingUser = studentIdSnapshot.docs[0].data();
          showAlert('Duplicate Student ID', `Student ID "${newUser.studentID}" is already registered to ${existingUser.name}. Please use a different Student ID.`);
          setModalLoading(false);
          return;
        }
      }
      const auth = getAuth();
      const password = newUser.role === 'student' ? newUser.studentID : newUser.password;
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          newUser.email.trim(),
          password
        );
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          showAlert('Email Already Registered', `The email "${newUser.email}" is already registered. Please use a different email address.`);
          setModalLoading(false);
          return;
        }
        throw authError;
      }
      const uid = userCredential.user.uid;
      const userData: any = {
        username: newUser.username.trim(),
        email: newUser.email.trim(),
        name: newUser.name.trim(),
        surname: newUser.surname.trim(),
        role: newUser.role,
        createdAt: new Date(),
        uid: uid,
        active: true,
      };
      if (newUser.role === 'student') {
        userData.studentID = newUser.studentID.trim();
        userData.course = newUser.course.trim();
        userData.yearLevel = newUser.yearLevel;
        userData.block = newUser.block.trim();
        userData.gender = newUser.gender;
      } else if (newUser.studentID?.trim()) {
        userData.studentID = newUser.studentID.trim();
      }
      await setDoc(doc(db, 'users', uid), userData);
      const successMessage = newUser.role === 'student'
        ? `Student ${newUser.name} created successfully!\n\nUsername: ${newUser.username}\nPassword: ${newUser.studentID}`
        : `Admin ${newUser.name} created successfully!\n\nEmail: ${newUser.email}\nPassword: ${newUser.password}`;
      showAlert('Success', successMessage);
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {

      let errorMessage = 'Failed to create user. Please try again.';
      if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please check the email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      showAlert('Error', errorMessage);
    } finally {
      setModalLoading(false);
    }
  };

  const validateEditUser = (): { isValid: boolean; errorMessage: string } => {
    if (!selectedUser) {
      return { isValid: false, errorMessage: 'No user selected.' };
    }

    // Name required
    if (!selectedUser.name?.trim()) {
      return { isValid: false, errorMessage: 'Please enter the name.' };
    }

    // Surname required for students
    if (selectedUser.role === 'student' && !selectedUser.surname?.trim()) {
      return { isValid: false, errorMessage: 'Surname is required for students.' };
    }

    // Email validation
    if (!selectedUser.email?.trim()) {
      return { isValid: false, errorMessage: 'Please enter an email address.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(selectedUser.email.trim())) {
      return { isValid: false, errorMessage: 'Please enter a valid email address (e.g., user@example.com).' };
    }

    // Username validation
    if (!selectedUser.username?.trim()) {
      return { isValid: false, errorMessage: 'Please enter a username.' };
    }

    // Role required
    if (!selectedUser.role) {
      return { isValid: false, errorMessage: 'Please select a role.' };
    }

    // Student-specific fields
    if (selectedUser.role === 'student') {
      if (!selectedUser.studentID?.trim()) {
        return { isValid: false, errorMessage: 'Please enter the Student ID.' };
      }
      if (!selectedUser.course?.trim()) {
        return { isValid: false, errorMessage: 'Please enter the course.' };
      }
      if (!selectedUser.yearLevel?.trim()) {
        return { isValid: false, errorMessage: 'Please select the year level.' };
      }
      if (!selectedUser.block?.trim()) {
        return { isValid: false, errorMessage: 'Please enter the block.' };
      }
      if (!selectedUser.gender?.trim()) {
        return { isValid: false, errorMessage: 'Please select the gender.' };
      }
    }

    return { isValid: true, errorMessage: '' };
  };

  const handleUpdateUser = async () => {
    const validation = validateEditUser();
    if (!validation.isValid) {
      showAlert('Validation Error', validation.errorMessage);
      return;
    }
    if (!selectedUser) return;

    try {
      setModalLoading(true);

      // --- Uniqueness checks
      const trimmedEmail = selectedUser.email.trim();
      const trimmedUsername = selectedUser.username.trim();

      // Check email uniqueness
      const emailConflict = users.some(
        u => u.id !== selectedUser.id && u.email.trim() === trimmedEmail
      );
      if (emailConflict) {
        showAlert('Email Already Exists', `Email "${trimmedEmail}" is already used by another user.`);
        setModalLoading(false);
        return;
      }

      const usernameConflict = users.some(
        u => u.id !== selectedUser.id && u.username.trim() === trimmedUsername
      );
      if (usernameConflict) {
        showAlert('Username Already Exists', `Username "${trimmedUsername}" is already taken.`);
        setModalLoading(false);
        return;
      }

      // Student ID uniqueness (already present)
      if (selectedUser.role === 'student' && selectedUser.studentID) {
        const trimmedStudentID = selectedUser.studentID.trim();
        const duplicateUser = users.find(u =>
          u.id !== selectedUser.id && u.studentID?.trim() === trimmedStudentID
        );
        if (duplicateUser) {
          showAlert('Duplicate Student ID', `Student ID "${trimmedStudentID}" is already registered to ${duplicateUser.name}.`);
          setModalLoading(false);
          return;
        }
      }

      const userRef = doc(db, 'users', selectedUser.id);
      const updateData: any = {
        name: selectedUser.name.trim(),
        surname: selectedUser.surname?.trim(),
        role: selectedUser.role,
        email: trimmedEmail,          
        username: trimmedUsername,    
      };

      // Student-specific fields
      if (selectedUser.role === 'student') {
        updateData.studentID = selectedUser.studentID?.trim() || null;
        updateData.course = selectedUser.course?.trim() || null;
        updateData.yearLevel = selectedUser.yearLevel || null;
        updateData.block = selectedUser.block?.trim() || null;
        updateData.gender = selectedUser.gender || null;
      } else {
       
        if (selectedUser.studentID?.trim()) {
          updateData.studentID = selectedUser.studentID.trim();
        }
        updateData.course = null;
        updateData.yearLevel = null;
        updateData.block = null;
        updateData.gender = null;
      }
      await updateDoc(userRef, updateData);

      showAlert('Success', 'User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Update user error:', error);
      showAlert('Error', error.message || 'Failed to update user. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`);
      if (isConfirmed) {
        try {
          setModalLoading(true);
          await deleteDoc(doc(db, 'users', userId));
          window.alert(`"${userName}" deleted successfully!`);
          fetchUsers();
        } catch (error: any) {

          window.alert('Failed to delete user: ' + (error.message || 'Unknown error'));
        } finally {
          setModalLoading(false);
        }
      }
    } else {
      Alert.alert(
        'Delete User',
        `Are you sure you want to permanently delete ${userName}? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setModalLoading(true);
                await deleteDoc(doc(db, 'users', userId));
                Alert.alert('Success', `"${userName}" deleted successfully!`);
                fetchUsers();
              } catch (error: any) {

                Alert.alert('Error', 'Failed to delete user: ' + (error.message || 'Unknown error'));
              } finally {
                setModalLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleToggleActive = async (user: User) => {
    const newActiveStatus = !user.active;
    const action = newActiveStatus ? 'activate' : 'deactivate';
    const actionTitle = newActiveStatus ? 'Activate' : 'Deactivate';

    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm(
        `Are you sure you want to ${action} ${user.name}?`
      );
      if (isConfirmed) {
        try {
          setModalLoading(true);
          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, {
            active: newActiveStatus,
            ...(action === 'deactivate' && { deactivatedAt: new Date().toISOString() }),
            ...(action === 'activate' && { deactivatedAt: null }),
          });
          setUsers(prevUsers =>
            prevUsers.map(u =>
              u.id === user.id
                ? {
                  ...u,
                  active: newActiveStatus,
                  deactivatedAt: action === 'deactivate' ? new Date().toISOString() : undefined
                }
                : u
            )
          );
          window.alert(`User ${action}d successfully`);
        } catch (error: any) {

          window.alert(`Failed to ${action} user: ${error.message || 'Unknown error'}`);
        } finally {
          setModalLoading(false);
        }
      }
      return;
    }
    Alert.alert(
      `${actionTitle} User`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Yes, ${actionTitle}`,
          style: action === 'deactivate' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setModalLoading(true);
              const userRef = doc(db, 'users', user.id);
              await updateDoc(userRef, {
                active: newActiveStatus,
                ...(action === 'deactivate' && { deactivatedAt: new Date().toISOString() }),
                ...(action === 'activate' && { deactivatedAt: null }),
              });
              setUsers(prevUsers =>
                prevUsers.map(u =>
                  u.id === user.id
                    ? {
                      ...u,
                      active: newActiveStatus,
                      deactivatedAt: action === 'deactivate' ? new Date().toISOString() : undefined
                    }
                    : u
                )
              );
              Alert.alert('Success', `User ${action}d successfully`);
            } catch (error: any) {

              Alert.alert('Error', `Failed to ${action} user: ${error.message || 'Unknown error'}`);
            } finally {
              setModalLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setNewUser({
      email: '',
      username: '',
      name: '',
      surname: '',
      role: 'student',
      password: '',
      studentID: '',
      course: '',
      yearLevel: '',
      block: '',
      gender: '',
    });
    setSelectedUser(null);
  };

  const handleCloseForm = () => {
    resetForm();
    setShowCreateModal(false);
    setShowEditModal(false);
  };
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setSelectedUserId(null);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setSelectedUserId(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'main_admin': return '#1d4ed8';
      case 'assistant_admin': return '#7c3aed';
      case 'student': return '#15803d';
      default: return colors.accent.primary;
    }
  };

  const getRoleBgColor = (role: string) => {
    switch (role) {
      case 'main_admin': return '#dbeafe';
      case 'assistant_admin': return '#ede9fe';
      case 'student': return '#dcfce7';
      default: return '#f1f5f9';
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const mainAdmins = users.filter(u => u.role === 'main_admin').length;
    const assistantAdmins = users.filter(u => u.role === 'assistant_admin').length;
    const students = users.filter(u => u.role === 'student').length;
    return { total, mainAdmins, assistantAdmins, students };
  }, [users]);

  const renderPaginatedItem = ({ item, index }: { item: User; index: number }) => {
    const isActive = selectedUserId === item.id;
    const roleColor = getRoleColor(item.role);
    const isCurrentUser = item.email === userData?.email;

    return (
      <TouchableOpacity
        style={[
          styles.paginatedItem,
          isActive && styles.paginatedItemActive,
          isMobile && styles.paginatedItemMobile,
          !item.active && { opacity: 0.6 }
        ]}
        onPress={() => setSelectedUserId(item.id)}
      >
        <View style={[styles.paginatedNumber, { backgroundColor: `${roleColor}15` }]}>
          <Text style={[styles.paginatedNumberText, { color: roleColor }]}>
            {(currentPage - 1) * itemsPerPage + index + 1}
          </Text>
        </View>
        <View style={styles.paginatedInfo}>
          {/* Row 1: Name + Inactive Badge (badge on the right) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.paginatedName, isMobile && styles.paginatedNameMobile]} numberOfLines={1}>
              {item.surname ? `${item.surname}, ${item.name}` : item.name}
            </Text>
            {!item.active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
              </View>
            )}
          </View>


          {/* Row 2: Email + Role Badge (badge on the right) */}
          <View style={[styles.paginatedMeta, { justifyContent: 'space-between' }]}>
            <Text style={[styles.paginatedEmail, isMobile && styles.paginatedEmailMobile]}>
              {item.email}
            </Text>
            <View style={[styles.paginatedBadge, { backgroundColor: getRoleBgColor(item.role) }]}>
              <Text style={[styles.paginatedBadgeText, { color: roleColor }]}>
                {item.role.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Row 3: Username */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="at-sign" size={8} color={colors.accent.primary} />
            <Text style={[styles.paginatedUsername, { marginLeft: 4 }]} numberOfLines={1}>
              {item.username}
            </Text>
          </View>
        </View>
        <View style={styles.paginatedActions}>
          {/* action buttons unchanged */}
          <TouchableOpacity
            style={[styles.paginatedEditButton, isMobile && styles.paginatedEditButtonMobile]}
            onPress={() => {
              setSelectedUser(item);
              setShowEditModal(true);
            }}
          >
            <Feather name="edit-2" size={isMobile ? 12 : 14} color={colors.accent.primary} />
          </TouchableOpacity>
          {!isCurrentUser && (
            <>
              <TouchableOpacity
                style={[
                  styles.paginatedStatusButton,
                  { backgroundColor: item.active ? '#fff7ed' : '#e6f7e6' },
                  isMobile && styles.paginatedStatusButtonMobile
                ]}
                onPress={() => handleToggleActive(item)}
              >
                <Feather
                  name={item.active ? "user-x" : "user-check"}
                  size={isMobile ? 12 : 14}
                  color={item.active ? "#ef4444" : "#10b981"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paginatedDeleteButton, isMobile && styles.paginatedDeleteButtonMobile]}
                onPress={() => handleDeleteUser(item.id, item.name)}
              >
                <Feather name="trash-2" size={isMobile ? 12 : 14} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResultItem = ({ item }: { item: User }) => {
    const roleColor = getRoleColor(item.role);
    const isCurrentUser = item.email === userData?.email;
    const isActive = selectedUserId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.searchResultItem,
          isActive && styles.searchResultItemActive,
          isMobile && styles.searchResultItemMobile,
        ]}
        onPress={() => setSelectedUserId(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.searchResultHeader}>
          {/* Title row: name on left, badges on right */}
          <View style={[styles.searchResultTitleContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={[styles.searchResultTitle, isMobile && styles.searchResultTitleMobile]} numberOfLines={1}>
              {item.surname ? `${item.surname}, ${item.name}` : item.name}
            </Text>
            <View style={styles.searchResultBadges}>
              {!item.active && (
                <View style={[styles.searchResultBadge, { backgroundColor: colors.sidebar.text.muted }]}>
                  <Text style={styles.searchResultBadgeText}>INACTIVE</Text>
                </View>
              )}
              <View style={[styles.searchResultBadge, { backgroundColor: getRoleBgColor(item.role) }]}>
                <Text style={[styles.searchResultBadgeText, { color: roleColor }]}>
                  {item.role.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Email and matched student ID indicator */}
          <Text style={[styles.searchResultEmail, isMobile && styles.searchResultEmailMobile]}>
            {item.email}
          </Text>
          {searchQuery && item.studentID && item.studentID.toLowerCase().includes(searchQuery.toLowerCase()) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Feather name="hash" size={10} color="#10b981" />
              <Text style={[styles.searchResultEmail, isMobile && styles.searchResultEmailMobile, { color: '#10b981', fontWeight: '600', marginLeft: 4 }]}>
                ID: {item.studentID} (matched)
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.searchResultActions}>
            <TouchableOpacity
              style={[styles.searchResultEditButton, isMobile && styles.searchResultEditButtonMobile]}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedUser(item);
                setShowEditModal(true);
              }}
            >
              <Feather name="edit-2" size={isMobile ? 12 : 14} color={colors.accent.primary} />
            </TouchableOpacity>
            {!isCurrentUser && (
              <>
                <TouchableOpacity
                  style={[
                    styles.searchResultStatusButton,
                    { backgroundColor: item.active ? '#fff7ed' : '#e6f7e6' },
                    isMobile && styles.searchResultStatusButtonMobile
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleActive(item);
                  }}
                >
                  <Feather
                    name={item.active ? "user-x" : "user-check"}
                    size={isMobile ? 12 : 14}
                    color={item.active ? "#ef4444" : "#10b981"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.searchResultDeleteButton, isMobile && styles.searchResultDeleteButtonMobile]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteUser(item.id, item.name);
                  }}
                >
                  <Feather name="trash-2" size={isMobile ? 12 : 14} color="#ef4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Footer (username and student ID) */}
        <View style={styles.searchResultFooter}>
          <View style={styles.searchResultRole}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="at-sign" size={isMobile ? 8 : 10} color={colors.sidebar.text.muted} />
              <Text style={[styles.searchResultRoleText, isMobile && styles.searchResultRoleTextMobile, { marginLeft: 4 }]}>
                {item.username}
              </Text>
            </View>
          </View>
          {item.studentID && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="hash" size={isMobile ? 8 : 10} color={colors.sidebar.text.muted} />
              <Text style={[styles.searchResultRoleText, isMobile && styles.searchResultRoleTextMobile, { marginLeft: 4 }]}>
                {item.studentID}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedDetail = (selected: User) => {
    const roleColor = getRoleColor(selected.role);

    return (
      <View>
        <Text style={styles.modernDetailLabel}>User Information</Text>
        <View style={styles.modernDetailRow}>
          <Feather name="user" size={16} color={colors.accent.primary} />
          <Text style={styles.modernDetailRowText}>
            {selected.name}
          </Text>
        </View>

        <View style={styles.modernDetailRow}>
          <Feather name="user" size={16} color={colors.accent.primary} />
          <Text style={styles.modernDetailRowText}>
            Surname: {selected.surname || '—'}
          </Text>
        </View>

        <View style={styles.modernDetailRow}>
          <Feather name="mail" size={16} color={colors.accent.primary} />
          <Text style={styles.modernDetailRowText}>
            {selected.email}
          </Text>
        </View>

        <View style={styles.modernDetailRow}>
          <Feather name="at-sign" size={16} color={colors.accent.primary} />
          <Text style={styles.modernDetailRowText}>
            @{selected.username}
          </Text>
        </View>

        <View style={styles.modernDetailRow}>
          <Feather name="shield" size={16} color={colors.accent.primary} />
          <Text style={styles.modernDetailRowText}>
            Role: {selected.role.replace('_', ' ').toUpperCase()}
          </Text>
          <View style={[styles.paginatedBadge, { backgroundColor: getRoleBgColor(selected.role) }]}>
            <Text style={[styles.paginatedBadgeText, { color: roleColor }]}>
              {selected.active ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {selected.studentID && (
          <View style={styles.modernDetailRow}>
            <Feather name="hash" size={16} color={colors.accent.primary} />
            <Text style={styles.modernDetailRowText}>
              Student ID: {selected.studentID}
            </Text>
          </View>
        )}

        {selected.course && (
          <View style={styles.modernDetailRow}>
            <Feather name="book" size={16} color={colors.accent.primary} />
            <Text style={styles.modernDetailRowText}>
              Course: {selected.course}
            </Text>
          </View>
        )}

        {selected.yearLevel && (
          <View style={styles.modernDetailRow}>
            <Feather name="calendar" size={16} color={colors.accent.primary} />
            <Text style={styles.modernDetailRowText}>
              Year Level: {selected.yearLevel}
            </Text>
          </View>
        )}

        {selected.block && (
          <View style={styles.modernDetailRow}>
            <Feather name="grid" size={16} color={colors.accent.primary} />
            <Text style={styles.modernDetailRowText}>
              Block: {selected.block}
            </Text>
          </View>
        )}

        {selected.gender && (
          <View style={styles.modernDetailRow}>
            <Feather name="user" size={16} color={colors.accent.primary} />
            <Text style={styles.modernDetailRowText}>
              Gender: {selected.gender}
            </Text>
          </View>
        )}

        <View style={[styles.modernFormActions, isMobile && styles.modernFormActionsMobile]}>
          <TouchableOpacity
            style={[styles.modernSubmitButton, isMobile && styles.modernSubmitButtonMobile]}
            onPress={() => {
              setSelectedUser(selected);
              setSelectedUserId(null);
              setShowEditModal(true);
            }}
          >
            <Feather name="edit-2" size={isMobile ? 14 : 16} color="#ffffff" />
            <Text style={[styles.modernSubmitButtonText, isMobile && styles.modernSubmitButtonTextMobile]}>
              Edit
            </Text>
          </TouchableOpacity>

          {selected.email !== userData?.email && (
            <TouchableOpacity
              style={[styles.modernCancelButton, isMobile && styles.modernCancelButtonMobile]}
              onPress={() => {
                handleDeleteUser(selected.id, selected.name);
                setSelectedUserId(null);
              }}
            >
              <Text style={[styles.modernCancelButtonText, isMobile && styles.modernCancelButtonTextMobile]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={[styles.paginationContainer, isMobile && styles.paginationContainerMobile]}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled, isMobile && styles.paginationButtonMobile]}
          onPress={handlePrevPage}
          disabled={currentPage === 1}
        >
          <Feather name="chevron-left" size={isMobile ? 14 : 16} color={currentPage === 1 ? colors.sidebar.text.muted : colors.accent.primary} />
          {!isMobile && <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
            Prev
          </Text>}
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={[styles.pageInfoText, isMobile && styles.pageInfoTextMobile]}>{currentPage}/{totalPages}</Text>
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled, isMobile && styles.paginationButtonMobile]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}
        >
          {!isMobile && <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
            Next
          </Text>}
          <Feather name="chevron-right" size={isMobile ? 14 : 16} color={currentPage === totalPages ? colors.sidebar.text.muted : colors.accent.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const CourseSelector = ({
    value,
    onSelect,
    isMobile
  }: {
    value: string;
    onSelect: (course: string) => void;
    isMobile: boolean;
  }) => {
    const courses = [
      'BSIT', 'BSOA', 'BSCrim'
    ];

    return (
      <View style={[styles.courseGrid, isMobile && styles.courseGridMobile]}>
        {courses.map((course) => (
          <TouchableOpacity
            key={course}
            style={[
              styles.courseChip,
              value === course && styles.courseChipSelected,
              isMobile && styles.courseChipMobile
            ]}
            onPress={() => onSelect(course)}
          >
            <Text
              style={[
                styles.courseChipText,
                value === course && styles.courseChipTextSelected,
                isMobile && styles.courseChipTextMobile
              ]}
            >
              {course}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderForm = (isEdit: boolean = false) => {
    const userState = isEdit ? selectedUser : newUser;
    if (!userState) return null;

    return (
      <Modal
        visible={showCreateModal || showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseForm}
      >
        {/* Outer blur overlay */}
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <TouchableOpacity
            style={styles.glassModalOverlayTouch}
            activeOpacity={1}
            onPress={handleCloseForm}
          />
        </BlurView>

        {/* Modal container */}
        <View style={styles.glassModalCentered}>
          <View style={[styles.glassModalContainer, { borderColor: 'rgba(255,255,255,0.3)' }]}>
            {/* Gradient header */}
            <LinearGradient
              colors={isDark ? ['#1e293b', '#0f172a'] : ['#f8fafc', '#e2e8f0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glassModalGradientHeader}
            >
              <View style={styles.glassModalHeader}>
                <View style={styles.glassModalHeaderLeft}>
                  <View style={[styles.glassModalIconContainer, isMobile && styles.glassModalIconContainerMobile]}>
                    <Feather
                      name={isEdit ? 'edit-2' : 'user-plus'}
                      size={isMobile ? 16 : 20}
                      color={colors.accent.primary}
                    />
                  </View>
                  <View>
                    <Text style={[styles.glassModalTitle, { color: colors.text }]}>
                      {isEdit ? 'Edit User' : 'New User'}
                    </Text>
                    <Text style={[styles.glassModalSubtitle, { color: colors.sidebar.text.secondary }]}>
                      {isEdit ? 'Update user details' : 'Create a new user account'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleCloseForm} style={styles.glassModalCloseButton}>
                  <Ionicons name="close-circle" size={28} color={colors.accent.primary} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Scrollable content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.glassModalScrollContent}
              style={{ backgroundColor: isDark ? 'rgba(15, 25, 35, 0.7)' : 'rgba(255, 255, 255, 0.7)' }}
            >
              <View style={[styles.glassModalFormSection, { borderColor: 'rgba(255,255,255,0.2)' }]}>
                {/* Name */}
                <View style={styles.glassFormGroup}>
                  <Text style={[styles.glassFormLabel, { color: colors.text }]}>Name *</Text>
                  <FormTextInput
                    inputStyle={styles.glassFormInput}
                    placeholder="Enter full name"
                    value={isEdit ? selectedUser?.name || '' : newUser.name}
                    onChangeText={(text) =>
                      isEdit
                        ? setSelectedUser(prev => prev ? { ...prev, name: text } : null)
                        : setNewUser({ ...newUser, name: text })
                    }
                  />
                </View>

                {/* Surname */}
                <View style={styles.glassFormGroup}>
                  <Text style={[styles.glassFormLabel, { color: colors.text }]}>
                    Surname {(isEdit ? selectedUser?.role : newUser.role) === 'student' ? '*' : '(optional)'}
                  </Text>
                  <FormTextInput
                    inputStyle={styles.glassFormInput}
                    placeholder="Enter surname (e.g., Cajes)"
                    value={isEdit ? selectedUser?.surname || '' : newUser.surname}
                    onChangeText={(text) =>
                      isEdit
                        ? setSelectedUser(prev => prev ? { ...prev, surname: text } : null)
                        : setNewUser({ ...newUser, surname: text })
                    }
                  />
                  {(isEdit ? selectedUser?.role : newUser.role) !== 'student' && (
                    <Text style={[styles.glassFormHelperText, { color: colors.sidebar.text.muted }]}>Optional for admin accounts</Text>
                  )}
                </View>

                {/* Username */}
                <View style={styles.glassFormGroup}>
                  <Text style={[styles.glassFormLabel, { color: colors.text }]}>Username *</Text>
                  <FormTextInput
                    inputStyle={styles.glassFormInput}
                    placeholder="Enter username"
                    value={isEdit ? selectedUser?.username || '' : newUser.username}
                    onChangeText={(text) =>
                      isEdit
                        ? setSelectedUser(prev => prev ? { ...prev, username: text } : null)
                        : setNewUser({ ...newUser, username: text })
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Email */}
                <View style={styles.glassFormGroup}>
                  <Text style={[styles.glassFormLabel, { color: colors.text }]}>Email *</Text>
                  <FormTextInput
                    inputStyle={styles.glassFormInput}
                    placeholder="Enter email address"
                    value={isEdit ? selectedUser?.email || '' : newUser.email}
                    onChangeText={(text) =>
                      isEdit
                        ? setSelectedUser(prev => prev ? { ...prev, email: text } : null)
                        : setNewUser({ ...newUser, email: text })
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Role */}
                <View style={styles.glassFormGroup}>
                  <Text style={[styles.glassFormLabel, { color: colors.text }]}>Role *</Text>
                  <View style={styles.modernRoleSelector}>
                    {(['student', 'assistant_admin', 'main_admin'] as const).map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.modernRoleOption,
                          (isEdit ? selectedUser?.role : newUser.role) === role && styles.modernRoleOptionSelected,
                        ]}
                        onPress={() => {
                          if (isEdit && selectedUser) {
                            setSelectedUser({
                              ...selectedUser,
                              role,
                              ...(role !== 'student' && {
                                course: undefined,
                                yearLevel: undefined,
                                block: undefined,
                                gender: undefined,
                              }),
                            });
                          } else {
                            setNewUser({
                              ...newUser,
                              role,
                              studentID: role !== 'student' ? '' : newUser.studentID,
                              block: role !== 'student' ? '' : newUser.block,
                              course: role !== 'student' ? '' : newUser.course,
                              gender: role !== 'student' ? '' : newUser.gender,
                              password: role === 'student' ? '' : newUser.password,
                            });
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.modernRoleOptionText,
                            (isEdit ? selectedUser?.role : newUser.role) === role && styles.modernRoleOptionTextSelected,
                          ]}
                        >
                          {role.replace('_', ' ').toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Student-specific fields */}
                {(isEdit ? selectedUser?.role : newUser.role) === 'student' && (
                  <>
                    <View style={styles.glassFormGroup}>
                      <Text style={[styles.glassFormLabel, { color: colors.text }]}>Student ID *</Text>
                      <FormTextInput
                        inputStyle={styles.glassFormInput}
                        placeholder="Enter student ID"
                        value={isEdit ? selectedUser?.studentID || '' : newUser.studentID}
                        onChangeText={(text) =>
                          isEdit
                            ? setSelectedUser(prev => prev ? { ...prev, studentID: text } : null)
                            : setNewUser({ ...newUser, studentID: text })
                        }
                      />
                      {!isEdit && <Text style={[styles.glassFormHelperText, { color: colors.sidebar.text.muted }]}>This will be used as the password</Text>}
                    </View>

                    <View style={styles.glassFormGroup}>
                      <Text style={[styles.glassFormLabel, { color: colors.text }]}>Course *</Text>
                      <CourseSelector
                        value={isEdit ? selectedUser?.course || '' : newUser.course}
                        onSelect={(course) =>
                          isEdit
                            ? setSelectedUser(prev => prev ? { ...prev, course } : null)
                            : setNewUser({ ...newUser, course })
                        }
                        isMobile={isMobile}
                      />
                    </View>

                    <View style={styles.glassFormGroup}>
                      <Text style={[styles.glassFormLabel, { color: colors.text }]}>Year Level *</Text>
                      <View style={styles.modernRoleSelector}>
                        {(['1st Year', '2nd Year', '3rd Year', '4th Year'] as const).map((year) => (
                          <TouchableOpacity
                            key={year}
                            style={[
                              styles.modernRoleOption,
                              (isEdit ? selectedUser?.yearLevel : newUser.yearLevel) === year && styles.modernRoleOptionSelected,
                            ]}
                            onPress={() =>
                              isEdit
                                ? setSelectedUser(prev => prev ? { ...prev, yearLevel: year } : null)
                                : setNewUser({ ...newUser, yearLevel: year })
                            }
                          >
                            <Text
                              style={[
                                styles.modernRoleOptionText,
                                (isEdit ? selectedUser?.yearLevel : newUser.yearLevel) === year && styles.modernRoleOptionTextSelected,
                              ]}
                            >
                              {year}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.glassFormGroup}>
                      <Text style={[styles.glassFormLabel, { color: colors.text }]}>Block *</Text>
                      <FormTextInput
                        inputStyle={styles.glassFormInput}
                        placeholder="Enter block (e.g., 1, 2, 3)"
                        value={isEdit ? selectedUser?.block || '' : newUser.block}
                        onChangeText={(text) =>
                          isEdit
                            ? setSelectedUser(prev => prev ? { ...prev, block: text } : null)
                            : setNewUser({ ...newUser, block: text })
                        }
                      />
                    </View>

                    <View style={styles.glassFormGroup}>
                      <Text style={[styles.glassFormLabel, { color: colors.text }]}>Gender *</Text>
                      <View style={styles.modernRoleSelector}>
                        {(['Male', 'Female'] as const).map((gender) => (
                          <TouchableOpacity
                            key={gender}
                            style={[
                              styles.modernRoleOption,
                              (isEdit ? selectedUser?.gender : newUser.gender) === gender && styles.modernRoleOptionSelected,
                            ]}
                            onPress={() =>
                              isEdit
                                ? setSelectedUser(prev => prev ? { ...prev, gender } : null)
                                : setNewUser({ ...newUser, gender })
                            }
                          >
                            <Text
                              style={[
                                styles.modernRoleOptionText,
                                (isEdit ? selectedUser?.gender : newUser.gender) === gender && styles.modernRoleOptionTextSelected,
                              ]}
                            >
                              {gender}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </>
                )}

                {/* Password for admins (only on create) */}
                {!isEdit && (newUser.role === 'assistant_admin' || newUser.role === 'main_admin') && (
                  <View style={styles.glassFormGroup}>
                    <Text style={[styles.glassFormLabel, { color: colors.text }]}>Password *</Text>
                    <FormTextInput
                      inputStyle={styles.glassFormInput}
                      placeholder="Enter password"
                      value={newUser.password}
                      onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                      secureTextEntry
                    />
                  </View>
                )}

                {/* Optional Student ID for admins (on edit) */}
                {isEdit && (selectedUser?.role === 'assistant_admin' || selectedUser?.role === 'main_admin') && (
                  <View style={styles.glassFormGroup}>
                    <Text style={[styles.glassFormLabel, { color: colors.text }]}>Student ID (Optional)</Text>
                    <FormTextInput
                      inputStyle={styles.glassFormInput}
                      placeholder="Enter student ID if applicable"
                      value={selectedUser?.studentID || ''}
                      onChangeText={(text) =>
                        setSelectedUser(prev => prev ? { ...prev, studentID: text } : null)
                      }
                    />
                  </View>
                )}

                {/* Actions */}
                <View style={[styles.glassFormActions, isMobile && styles.glassFormActionsMobile]}>
                  <TouchableOpacity
                    style={[
                      styles.glassSubmitButton,
                      modalLoading && styles.glassSubmitButtonDisabled,
                      isMobile && styles.glassSubmitButtonMobile,
                    ]}
                    onPress={isEdit ? handleUpdateUser : handleCreateUser}
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Feather
                          name={isEdit ? 'check-circle' : 'plus-circle'}
                          size={isMobile ? 16 : 18}
                          color="#ffffff"
                        />
                        <Text style={[styles.glassSubmitButtonText, isMobile && styles.glassSubmitButtonTextMobile]}>
                          {isEdit ? 'Update' : 'Create'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.glassCancelButton, isMobile && styles.glassCancelButtonMobile]}
                    onPress={handleCloseForm}
                  >
                    <Text style={[styles.glassCancelButtonText, isMobile && styles.glassCancelButtonTextMobile]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const headerGradientColors = isDark
    ? ['#0f172a', '#1e293b'] as const
    : ['#1e40af', '#3b82f6'] as const;

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={headerGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, isMobile && styles.headerGradientMobile]}
      >
        <View style={[styles.headerContent, isMobile && styles.headerContentMobile]}>
          <View>
            <Text style={[styles.greetingText, { color: isDark ? colors.sidebar.text.secondary : '#ffffff' }]}>Welcome back,</Text>
            <Text style={[styles.userName, isMobile && styles.userNameMobile]}>{userData?.name || 'Admin'}</Text>
            <Text style={[styles.roleText, { color: isDark ? colors.sidebar.text.secondary : '#ffffff' }]}>User Manager</Text>
          </View>

          <TouchableOpacity
            style={[styles.profileButton, isMobile && styles.profileButtonMobile]}
            onPress={() => router.push('/main_admin/profile')}
          >
            {userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text style={[styles.profileInitials, isMobile && styles.profileInitialsMobile]}>
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'A'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.dateSection, isMobile && styles.dateSectionMobile]}>
          <View style={[styles.dateContainer, isMobile && styles.dateContainerMobile]}>
            <Text style={[styles.dateText, isMobile && styles.dateTextMobile]}>
              {new Date().toLocaleDateString('en-US', {
                weekday: isMobile ? 'short' : 'long',
                year: 'numeric',
                month: isMobile ? 'short' : 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerAction, isMobile && styles.headerActionMobile]}
              onPress={() => setShowCreateModal(true)}
            >
              <Feather name="user-plus" size={isMobile ? 16 : 18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content Grid */}
      <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
        {/* Left Grid - Paginated Users */}
        <View style={[styles.leftGrid, isMobile && styles.leftGridMobile]}>
          <View style={[styles.leftHeader, isMobile && styles.leftHeaderMobile]}>
            <Text style={[styles.leftTitle, isMobile && styles.leftTitleMobile]}>Users</Text>
            <View style={[styles.leftControls, isMobile && styles.leftControlsMobile]}>
              <Text style={[styles.userCount, isMobile && styles.userCountMobile]}>
                {filterUsersByRole(users, activeFilter).length}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.leftFilters, isMobile && styles.leftFiltersMobile]}
              >
                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'all' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('all')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'all' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'main_admin' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('main_admin')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'main_admin' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>Main Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'assistant_admin' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('assistant_admin')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'assistant_admin' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>Assistant</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'student' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('student')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'student' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>Students</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              {filterUsersByRole(users, activeFilter).length} user{filterUsersByRole(users, activeFilter).length !== 1 ? 's' : ''}
              {activeFilter !== 'all' && ` from ${activeFilter.replace('_', ' ')}`}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size={isMobile ? "small" : "large"} color={colors.accent.primary} />
              <Text style={[styles.loadingText, isMobile && styles.loadingTextMobile]}>Loading users...</Text>
            </View>
          ) : (
            <>
              <View style={{ flex: 1 }}>
                <FlatList
                  data={paginatedUsers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <AnimatedUserItem
                      item={item}
                      index={index}
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      styles={styles}
                      colors={colors}
                      isMobile={isMobile}
                      selectedUserId={selectedUserId}
                      setSelectedUserId={setSelectedUserId}
                      handleEditUser={handleEditUser}
                      handleDeleteUser={handleDeleteUser}
                      handleToggleActive={handleToggleActive}
                      getRoleColor={getRoleColor}
                      getRoleBgColor={getRoleBgColor}
                      isCurrentUser={item.email === userData?.email}
                    />
                  )}
                  style={styles.paginatedList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                      <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                        <Feather name="users" size={isMobile ? 24 : 32} color={colors.sidebar.text.muted} />
                      </View>
                      <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>No users found</Text>
                      <Text style={[styles.emptyStateText, isMobile && styles.emptyStateTextMobile]}>
                        {activeFilter === 'all' ? 'Create your first user to get started' :
                          `No ${activeFilter.replace('_', ' ')} users found`}
                      </Text>
                    </View>
                  }
                />
              </View>
              {renderPagination()}
            </>
          )}
        </View>

        {/* Right Grid - Search */}
        <View style={[styles.rightGrid, isMobile && styles.rightGridMobile]}>
          <View style={[styles.rightHeader, isMobile && styles.rightHeaderMobile]}>
            <Text style={[styles.searchTitle, isMobile && styles.searchTitleMobile]}>Search Users</Text>

            <View style={[styles.searchContainer, isMobile && styles.searchContainerMobile]}>
              <Feather name="search" size={isMobile ? 14 : 16} color={colors.sidebar.text.secondary} />
              <FormTextInput
                style={[styles.searchInput, isMobile && styles.searchInputMobile]}
                inputStyle={styles.searchInput}
                placeholder="Search by name, email, username, or student ID..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                placeholderTextColor={colors.sidebar.text.muted}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.searchClearButton}>
                  <Feather name="x" size={isMobile ? 14 : 16} color={colors.sidebar.text.secondary} />
                </TouchableOpacity>
              )}
            </View>

            {searchQuery && (
              <View style={[styles.searchStats, isMobile && styles.searchStatsMobile]}>
                <Text style={[styles.resultsCount, isMobile && styles.resultsCountMobile]}>
                  Found <Text style={styles.resultsHighlight}>{searchResults.length}</Text> {isMobile ? '' : 'results'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.searchResultsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent.primary} />
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={renderSearchResultItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  searchQuery ? (
                    <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                      <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                        <Feather name="search" size={isMobile ? 24 : 32} color={colors.sidebar.text.muted} />
                      </View>
                      <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>No matches</Text>
                      <Text style={[styles.emptyStateText, isMobile && styles.emptyStateTextMobile]}>
                        Try different keywords
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                      <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                        <Feather name="search" size={isMobile ? 24 : 32} color={colors.sidebar.text.muted} />
                      </View>
                      <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>Start searching</Text>
                      <Text style={[styles.emptyStateText, isMobile && styles.emptyStateTextMobile]}>
                        Type to find users
                      </Text>
                    </View>
                  )
                }
              />
            )}
          </View>
        </View>
      </View>

      {/* Create/Edit Modal */}
      {renderForm(showEditModal)}

      {/* Glassmorphism User Details Modal */}
      <Modal
        visible={selectedUserId !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedUserId(null)}
      >
        <TouchableOpacity
          style={styles.glassModalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedUserId(null)}
        >
          <TouchableOpacity
            style={[styles.glassModalContent, isMobile && styles.glassModalContentMobile]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.glassModalHeader}>
              <Text style={[styles.glassModalTitle, isMobile && styles.glassModalTitleMobile]}>
                User Details
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedUserId(null)}
                style={styles.glassModalClose}
              >
                <Feather name="x" size={isMobile ? 22 : 26} color={colors.sidebar.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <View style={styles.glassModalBody}>
              {selectedUserId && renderSelectedDetail(
                users.find(u => u.id === selectedUserId)!
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}