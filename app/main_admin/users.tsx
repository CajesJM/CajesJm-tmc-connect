import { Feather } from '@expo/vector-icons';
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
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
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
import { db } from '../../lib/firebaseConfig';
import { usersStyles as styles } from '../../styles/main-admin/usersStyles';

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
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

const TextInput = ({
  style,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  keyboardType,
  secureTextEntry,
  editable = true,
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
  [key: string]: any;
}) => (
  <RNTextInput
    style={[styles.modernFormInput, style]}
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

export default function UserManagement() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth >= 640 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  const isSmallScreen = screenWidth < 375;

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

      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const validateCreateUser = (): { isValid: boolean; errorMessage: string } => {
    if (!newUser.name?.trim()) {
      return { isValid: false, errorMessage: 'Please enter the full name.' };
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

    // ADMIN-specific validation
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
      if (Platform.OS === 'web') {
        window.alert(validation.errorMessage);
      } else {
        Alert.alert('Validation Error', validation.errorMessage);
      }
      return;
    }

    try {
      setModalLoading(true);

      // Check if Student ID already exists (for students)
      if (newUser.role === 'student' && newUser.studentID) {
        const usersCollection = collection(db, 'users');
        const studentIdQuery = query(usersCollection, where('studentID', '==', newUser.studentID.trim()));
        const studentIdSnapshot = await getDocs(studentIdQuery);

        if (!studentIdSnapshot.empty) {
          const existingUser = studentIdSnapshot.docs[0].data();
          if (Platform.OS === 'web') {
            window.alert(`Student ID "${newUser.studentID}" is already registered to ${existingUser.name}. Please use a different Student ID.`);
          } else {
            Alert.alert(
              'Duplicate Student ID',
              `Student ID "${newUser.studentID}" is already registered to ${existingUser.name}. Please use a different Student ID.`
            );
          }
          setModalLoading(false);
          return;
        }
      }

      // Check if email already exists in Firebase Auth (for all users)
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
          if (Platform.OS === 'web') {
            window.alert(`The email "${newUser.email}" is already registered. Please use a different email address.`);
          } else {
            Alert.alert(
              'Email Already Registered',
              `The email "${newUser.email}" is already registered. Please use a different email address.`
            );
          }
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
        role: newUser.role,
        createdAt: new Date().toISOString(),
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

      if (Platform.OS === 'web') {
        window.alert(successMessage);
      } else {
        Alert.alert('Success', successMessage);
      }

      setShowCreateModal(false);
      resetForm();
      fetchUsers();

    } catch (error: any) {
      console.error('Error creating user:', error);

      let errorMessage = 'Failed to create user. Please try again.';

      if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please check the email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setModalLoading(false);
    }
  };

  // VALIDATION FOR EDIT USER
  const validateEditUser = (): { isValid: boolean; errorMessage: string } => {
    if (!selectedUser) {
      return { isValid: false, errorMessage: 'No user selected.' };
    }

    if (!selectedUser.name?.trim()) {
      return { isValid: false, errorMessage: 'Please enter the full name.' };
    }

    if (!selectedUser.role) {
      return { isValid: false, errorMessage: 'Please select a role.' };
    }

    // STUDENT-specific validation for edit
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
    // Run validation first
    const validation = validateEditUser();
    if (!validation.isValid) {
      if (Platform.OS === 'web') {
        window.alert(validation.errorMessage);
      } else {
        Alert.alert('Validation Error', validation.errorMessage);
      }
      return;
    }

    if (!selectedUser) return;

    try {
      setModalLoading(true);

      // Check if Student ID changed and if new ID already exists (JavaScript check instead of query)
      if (selectedUser.role === 'student' && selectedUser.studentID) {
        const trimmedStudentID = selectedUser.studentID.trim();

        // Find if another user has this student ID (excluding current user)
        const duplicateUser = users.find(u =>
          u.id !== selectedUser.id &&
          u.studentID?.trim() === trimmedStudentID
        );

        if (duplicateUser) {
          if (Platform.OS === 'web') {
            window.alert(`Student ID "${trimmedStudentID}" is already registered to ${duplicateUser.name}. Please use a different Student ID.`);
          } else {
            Alert.alert(
              'Duplicate Student ID',
              `Student ID "${trimmedStudentID}" is already registered to ${duplicateUser.name}. Please use a different Student ID.`
            );
          }
          setModalLoading(false);
          return;
        }
      }

      const userRef = doc(db, 'users', selectedUser.id);

      const updateData: any = {
        name: selectedUser.name.trim(),
        role: selectedUser.role,
      };

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

      if (Platform.OS === 'web') {
        window.alert('User updated successfully!');
      } else {
        Alert.alert('Success', 'User updated successfully!');
      }

      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error.message || 'Failed to update user. Please try again.';

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
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
          console.error('Error deleting user:', error);
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
                console.error('Error deleting user:', error);
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
          console.error(`Error ${action}ing user:`, error);
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
              console.error(`Error ${action}ing user:`, error);
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
      default: return '#64748b';
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.paginatedName, isMobile && styles.paginatedNameMobile]} numberOfLines={1}>
              {item.name}
            </Text>
            {!item.active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
              </View>
            )}
          </View>
          <View style={styles.paginatedMeta}>
            <Text style={[styles.paginatedEmail, isMobile && styles.paginatedEmailMobile]}>
              {item.email}
            </Text>
            <View style={[styles.paginatedBadge, { backgroundColor: getRoleBgColor(item.role) }]}>
              <Text style={[styles.paginatedBadgeText, { color: roleColor }]}>
                {item.role.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.paginatedUsername} numberOfLines={1}>
            <Feather name="at-sign" size={8} color="#0ea5e9" /> {item.username}
          </Text>
        </View>
        <View style={styles.paginatedActions}>
          <TouchableOpacity
            style={[styles.paginatedEditButton, isMobile && styles.paginatedEditButtonMobile]}
            onPress={() => {
              setSelectedUser(item);
              setShowEditModal(true);
            }}
          >
            <Feather name="edit-2" size={isMobile ? 12 : 14} color="#3b82f6" />
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

    return (
      <View style={[styles.searchResultItem, isMobile && styles.searchResultItemMobile]}>
        <View style={styles.searchResultHeader}>
          <View style={styles.searchResultTitleContainer}>
            <Text style={[styles.searchResultTitle, isMobile && styles.searchResultTitleMobile]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.searchResultBadges}>
              {!item.active && (
                <View style={[styles.searchResultBadge, { backgroundColor: '#64748b' }]}>
                  <Text style={styles.searchResultBadgeText}>INACTIVE</Text>
                </View>
              )}
              <View style={[styles.searchResultBadge, { backgroundColor: getRoleBgColor(item.role) }]}>
                <Text style={[styles.searchResultBadgeText, { color: roleColor }]}>
                  {item.role.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            {searchQuery && item.studentID && item.studentID.toLowerCase().includes(searchQuery.toLowerCase()) && (
              <Text style={[styles.searchResultEmail, isMobile && styles.searchResultEmailMobile, { color: '#10b981', fontWeight: '600' }]}>
                <Feather name="hash" size={10} color="#10b981" /> ID: {item.studentID} (matched)
              </Text>
            )}
          </View>
          <Text style={[styles.searchResultEmail, isMobile && styles.searchResultEmailMobile]}>
            {item.email}
          </Text>
          <View style={styles.searchResultActions}>
            <TouchableOpacity
              style={[styles.searchResultEditButton, isMobile && styles.searchResultEditButtonMobile]}
              onPress={() => {
                setSelectedUser(item);
                setShowEditModal(true);
              }}
            >
              <Feather name="edit-2" size={isMobile ? 12 : 14} color="#3b82f6" />
            </TouchableOpacity>
            {!isCurrentUser && (
              <>
                <TouchableOpacity
                  style={[
                    styles.searchResultStatusButton,
                    { backgroundColor: item.active ? '#fff7ed' : '#e6f7e6' },
                    isMobile && styles.searchResultStatusButtonMobile
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
                  style={[styles.searchResultDeleteButton, isMobile && styles.searchResultDeleteButtonMobile]}
                  onPress={() => handleDeleteUser(item.id, item.name)}
                >
                  <Feather name="trash-2" size={isMobile ? 12 : 14} color="#ef4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.searchResultFooter}>
          <View style={styles.searchResultRole}>
            <Feather name="at-sign" size={isMobile ? 8 : 10} color="#64748b" />
            <Text style={[styles.searchResultRoleText, isMobile && styles.searchResultRoleTextMobile]}>
              {item.username}
            </Text>
          </View>
          {item.studentID && (
            <View style={styles.searchResultRole}>
              <Feather name="hash" size={isMobile ? 8 : 10} color="#64748b" />
              <Text style={[styles.searchResultRoleText, isMobile && styles.searchResultRoleTextMobile]}>
                {item.studentID}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSelectedDetail = (selected: User) => {
    const roleColor = getRoleColor(selected.role);

    return (
      <View>
        <Text style={[styles.modernDetailLabel]}>User Information</Text>
        <View style={styles.modernDetailRow}>
          <Feather name="user" size={16} color="#0ea5e9" />
          <Text style={styles.modernDetailRowText}>
            {selected.name}
          </Text>
        </View>

        <View style={styles.modernDetailRow}>
          <Feather name="mail" size={16} color="#0ea5e9" />
          <Text style={styles.modernDetailRowText}>
            {selected.email}
          </Text>
        </View>

        <View style={styles.modernDetailRow}>
          <Feather name="at-sign" size={16} color="#0ea5e9" />
          <Text style={styles.modernDetailRowText}>
            @{selected.username}
          </Text>
        </View>

        <View style={styles.modernDetailRow}>
          <Feather name="shield" size={16} color="#0ea5e9" />
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
            <Feather name="hash" size={16} color="#0ea5e9" />
            <Text style={styles.modernDetailRowText}>
              Student ID: {selected.studentID}
            </Text>
          </View>
        )}

        {selected.course && (
          <View style={styles.modernDetailRow}>
            <Feather name="book" size={16} color="#0ea5e9" />
            <Text style={styles.modernDetailRowText}>
              Course: {selected.course}
            </Text>
          </View>
        )}

        {selected.yearLevel && (
          <View style={styles.modernDetailRow}>
            <Feather name="calendar" size={16} color="#0ea5e9" />
            <Text style={styles.modernDetailRowText}>
              Year Level: {selected.yearLevel}
            </Text>
          </View>
        )}

        {selected.block && (
          <View style={styles.modernDetailRow}>
            <Feather name="grid" size={16} color="#0ea5e9" />
            <Text style={styles.modernDetailRowText}>
              Block: {selected.block}
            </Text>
          </View>
        )}

        {selected.gender && (
          <View style={styles.modernDetailRow}>
            <Feather name="user" size={16} color="#0ea5e9" />
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
          <Feather name="chevron-left" size={isMobile ? 14 : 16} color={currentPage === 1 ? '#cbd5e1' : '#0ea5e9'} />
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
          <Feather name="chevron-right" size={isMobile ? 14 : 16} color={currentPage === totalPages ? '#cbd5e1' : '#0ea5e9'} />
        </TouchableOpacity>
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
        <View style={styles.modernModalOverlay}>
          <View style={[styles.modernModalContainer, isMobile && styles.modernModalContainerMobile]}>
            <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
              <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                  <Feather
                    name={isEdit ? "edit-2" : "user-plus"}
                    size={isMobile ? 16 : 20}
                    color="#0ea5e9"
                  />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>
                    {isEdit ? 'Edit User' : 'New User'}
                  </Text>
                  <Text style={[styles.modernModalSubtitle, isMobile && styles.modernModalSubtitleMobile]}>
                    {isEdit ? 'Update user details' : 'Create a new user account'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleCloseForm}
                style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}
              >
                <Feather name="x" size={isMobile ? 18 : 20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView style={[styles.modernModalContent, isMobile && styles.modernModalContentMobile]}>
                <View style={styles.modernFormGroup}>
                  <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Full Name *</Text>
                  <TextInput
                    placeholder="Enter full name"
                    value={isEdit ? selectedUser?.name || '' : newUser.name}
                    onChangeText={(text: string) =>
                      isEdit
                        ? setSelectedUser(prev => prev ? { ...prev, name: text } : null)
                        : setNewUser({ ...newUser, name: text })
                    }
                  />
                </View>

                <View style={styles.modernFormGroup}>
                  <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Username *</Text>
                  {isEdit ? (
                    <Text style={styles.emailText}>@{selectedUser?.username}</Text>
                  ) : (
                    <TextInput
                      placeholder="Enter username (e.g., john.cajes)"
                      value={newUser.username}
                      onChangeText={(text: string) => setNewUser({ ...newUser, username: text })}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  )}
                </View>

                <View style={styles.modernFormGroup}>
                  <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Email *</Text>
                  {isEdit ? (
                    <Text style={styles.emailText}>{selectedUser?.email}</Text>
                  ) : (
                    <TextInput
                      placeholder="Enter email address"
                      value={newUser.email}
                      onChangeText={(text: string) => setNewUser({ ...newUser, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                </View>

                <View style={styles.modernFormGroup}>
                  <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Role *</Text>
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
                                gender: undefined
                              })
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
                        <Text style={[
                          styles.modernRoleOptionText,
                          (isEdit ? selectedUser?.role : newUser.role) === role && styles.modernRoleOptionTextSelected,
                        ]}>
                          {role.replace('_', ' ').toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {(isEdit ? selectedUser?.role : newUser.role) === 'student' && (
                  <>
                    <View style={styles.modernFormGroup}>
                      <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Student ID *</Text>
                      <TextInput
                        placeholder="Enter student ID"
                        value={isEdit ? selectedUser?.studentID || '' : newUser.studentID}
                        onChangeText={(text: string) =>
                          isEdit
                            ? setSelectedUser(prev => prev ? { ...prev, studentID: text } : null)
                            : setNewUser({ ...newUser, studentID: text })
                        }
                      />
                      {!isEdit && <Text style={styles.fieldNote}>This will be used as the password</Text>}
                    </View>

                    <View style={styles.modernFormGroup}>
                      <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Course *</Text>
                      <TextInput
                        placeholder="Enter course (e.g., BSIT, BSCS)"
                        value={isEdit ? selectedUser?.course || '' : newUser.course}
                        onChangeText={(text: string) =>
                          isEdit
                            ? setSelectedUser(prev => prev ? { ...prev, course: text } : null)
                            : setNewUser({ ...newUser, course: text })
                        }
                      />
                    </View>

                    <View style={styles.modernFormGroup}>
                      <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Year Level *</Text>
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
                            <Text style={[
                              styles.modernRoleOptionText,
                              (isEdit ? selectedUser?.yearLevel : newUser.yearLevel) === year && styles.modernRoleOptionTextSelected,
                            ]}>
                              {year}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.modernFormGroup}>
                      <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Block *</Text>
                      <TextInput
                        placeholder="Enter block (e.g., 1, 2, 3)"
                        value={isEdit ? selectedUser?.block || '' : newUser.block}
                        onChangeText={(text: string) =>
                          isEdit
                            ? setSelectedUser(prev => prev ? { ...prev, block: text } : null)
                            : setNewUser({ ...newUser, block: text })
                        }
                      />
                    </View>

                    <View style={styles.modernFormGroup}>
                      <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Gender *</Text>
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
                            <Text style={[
                              styles.modernRoleOptionText,
                              (isEdit ? selectedUser?.gender : newUser.gender) === gender && styles.modernRoleOptionTextSelected,
                            ]}>
                              {gender}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </>
                )}

                {!isEdit && (newUser.role === 'assistant_admin' || newUser.role === 'main_admin') && (
                  <View style={styles.modernFormGroup}>
                    <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Password *</Text>
                    <TextInput
                      placeholder="Enter password"
                      value={newUser.password}
                      onChangeText={(text: string) => setNewUser({ ...newUser, password: text })}
                      secureTextEntry
                    />
                  </View>
                )}

                {isEdit && (selectedUser?.role === 'assistant_admin' || selectedUser?.role === 'main_admin') && (
                  <View style={styles.modernFormGroup}>
                    <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Student ID (Optional)</Text>
                    <TextInput
                      placeholder="Enter student ID if applicable"
                      value={selectedUser?.studentID || ''}
                      onChangeText={(text: string) =>
                        setSelectedUser(prev => prev ? { ...prev, studentID: text } : null)
                      }
                    />
                  </View>
                )}

                <View style={[styles.modernFormActions, isMobile && styles.modernFormActionsMobile]}>
                  <TouchableOpacity
                    style={[
                      styles.modernSubmitButton,
                      modalLoading && styles.modernSubmitButtonDisabled,
                      isMobile && styles.modernSubmitButtonMobile
                    ]}
                    onPress={isEdit ? handleUpdateUser : handleCreateUser}
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Feather
                          name={isEdit ? "check-circle" : "plus-circle"}
                          size={isMobile ? 16 : 18}
                          color="#ffffff"
                        />
                        <Text style={[styles.modernSubmitButtonText, isMobile && styles.modernSubmitButtonTextMobile]}>
                          {isEdit ? 'Update' : 'Create'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modernCancelButton, isMobile && styles.modernCancelButtonMobile]}
                    onPress={handleCloseForm}
                  >
                    <Text style={[styles.modernCancelButtonText, isMobile && styles.modernCancelButtonTextMobile]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#14203d', '#06080b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, isMobile && styles.headerGradientMobile]}
      >
        <View style={[styles.headerContent, isMobile && styles.headerContentMobile]}>
          <View>
            <Text style={[styles.greetingText, isMobile && styles.greetingTextMobile]}>Welcome back,</Text>
            <Text style={[styles.userName, isMobile && styles.userNameMobile]}>{userData?.name || 'Admin'}</Text>
            <Text style={[styles.roleText, isMobile && styles.roleTextMobile]}>User Manager</Text>
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
            <Feather name="calendar" size={isMobile ? 10 : 12} color="#94a3b8" />
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

      {/* Stats Grid */}
      <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
        <View style={[styles.statCard, isMobile && styles.statCardMobile, { borderLeftColor: '#0ea5e9' }]}>
          <View style={[styles.statIconContainer, isMobile && styles.statIconContainerMobile, { backgroundColor: '#0ea5e915' }]}>
            <Feather name="users" size={isMobile ? 16 : 20} color="#0ea5e9" />
          </View>
          <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.total}</Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>Total Users</Text>
        </View>

        <View style={[styles.statCard, isMobile && styles.statCardMobile, { borderLeftColor: '#1d4ed8' }]}>
          <View style={[styles.statIconContainer, isMobile && styles.statIconContainerMobile, { backgroundColor: '#dbeafe' }]}>
            <Feather name="shield" size={isMobile ? 16 : 20} color="#1d4ed8" />
          </View>
          <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.mainAdmins}</Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>Main Admins</Text>
        </View>

        <View style={[styles.statCard, isMobile && styles.statCardMobile, { borderLeftColor: '#7c3aed' }]}>
          <View style={[styles.statIconContainer, isMobile && styles.statIconContainerMobile, { backgroundColor: '#ede9fe' }]}>
            <Feather name="user-check" size={isMobile ? 16 : 20} color="#7c3aed" />
          </View>
          <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.assistantAdmins}</Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>Assistant Admins</Text>
        </View>

        <View style={[styles.statCard, isMobile && styles.statCardMobile, { borderLeftColor: '#15803d' }]}>
          <View style={[styles.statIconContainer, isMobile && styles.statIconContainerMobile, { backgroundColor: '#dcfce7' }]}>
            <Feather name="book" size={isMobile ? 16 : 20} color="#15803d" />
          </View>
          <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.students}</Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>Students</Text>
        </View>
      </View>

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

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size={isMobile ? "small" : "large"} color="#0ea5e9" />
              <Text style={[styles.loadingText, isMobile && styles.loadingTextMobile]}>Loading users...</Text>
            </View>
          ) : (
            <>
              <View style={{ flex: 1 }}>
                <FlatList
                  data={paginatedUsers}
                  keyExtractor={(item) => item.id}
                  renderItem={renderPaginatedItem}
                  style={styles.paginatedList}
                  showsVerticalScrollIndicator={true}
                  ListEmptyComponent={
                    <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                      <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                        <Feather name="users" size={isMobile ? 24 : 32} color="#cbd5e1" />
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
              <Feather name="search" size={isMobile ? 14 : 16} color="#64748b" />
              <RNTextInput
                style={[styles.searchInput, isMobile && styles.searchInputMobile]}
                placeholder="Search by name, email, username, or student ID..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.searchClearButton}>
                  <Feather name="x" size={isMobile ? 14 : 16} color="#64748b" />
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
                <ActivityIndicator size="small" color="#0ea5e9" />
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
                        <Feather name="search" size={isMobile ? 24 : 32} color="#cbd5e1" />
                      </View>
                      <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>No matches</Text>
                      <Text style={[styles.emptyStateText, isMobile && styles.emptyStateTextMobile]}>
                        Try different keywords
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                      <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                        <Feather name="search" size={isMobile ? 24 : 32} color="#cbd5e1" />
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

      {/* User Details Modal */}
      <Modal
        visible={selectedUserId !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedUserId(null)}
      >
        <View style={styles.modernModalOverlay}>
          <View style={[styles.modernModalContainer, isMobile && styles.modernModalContainerMobile]}>
            <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
              <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                  <Feather name="user" size={isMobile ? 16 : 20} color="#0ea5e9" />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>
                    User Details
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedUserId(null)}
                style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}
              >
                <Feather name="x" size={isMobile ? 18 : 20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={[styles.modernModalContent, isMobile && styles.modernModalContentMobile]}>
              {selectedUserId && renderSelectedDetail(
                users.find(u => u.id === selectedUserId)!
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}