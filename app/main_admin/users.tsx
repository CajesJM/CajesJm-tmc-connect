import Alert from '@blazejkustra/react-native-alert';
import { Feather } from '@expo/vector-icons';
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
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebaseConfig';

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

export default function UserManagement() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');

      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);

      const usersList: User[] = [];
      userSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`User ${data.email} active status:`, data.active);

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
          active: data.active === undefined ? true : data.active, // Default to true if not set
          deactivatedAt: data.deactivatedAt,
        } as User);
      });

      console.log('Total users fetched:', usersList.length);
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };


  const handleCreateUser = async () => {
    // Common required fields for all roles
    if (!newUser.username || !newUser.name || !newUser.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Student-specific validation
    if (newUser.role === 'student') {
      if (!newUser.studentID || !newUser.course || !newUser.yearLevel || !newUser.block || !newUser.gender) {
        Alert.alert('Error', 'Please fill in all student required fields');
        return;
      }
    }

    // Admin validation
    if (newUser.role !== 'student' && !newUser.password) {
      Alert.alert('Error', 'Password is required for admin accounts');
      return;
    }

    try {
      setModalLoading(true);

      // FIRST: Check if email already exists in Firestore
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('email', '==', newUser.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Email exists in Firestore
        Alert.alert(
          'User Already Exists',
          `A user with email ${newUser.email} already exists in the system. Do you want to update this existing user instead?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Update Existing',
              onPress: () => {
                // Get the existing user data
                const existingUserDoc = querySnapshot.docs[0];
                const existingUser = {
                  id: existingUserDoc.id,
                  ...existingUserDoc.data()
                } as User;

                // Set the selected user and open edit modal
                setSelectedUser(existingUser);
                setShowCreateModal(false);
                setShowEditModal(true);
              }
            }
          ]
        );
        return;
      }

      // If we get here, email doesn't exist in Firestore
      // Now try to create in Firebase Auth
      const auth = getAuth();

      // For students, use studentID as password
      // For admins, use the provided password
      const password = newUser.role === 'student' ? newUser.studentID : newUser.password;

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        password
      );

      const uid = userCredential.user.uid;

      // Prepare user data
      const userData: any = {
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: new Date().toISOString(),
        uid: uid,
        active: true,
      };

      // Add role-specific fields
      if (newUser.role === 'student') {
        userData.studentID = newUser.studentID;
        userData.course = newUser.course;
        userData.yearLevel = newUser.yearLevel;
        userData.block = newUser.block;
        userData.gender = newUser.gender;
      } else if (newUser.studentID) {
        userData.studentID = newUser.studentID;
      }

      await setDoc(doc(db, 'users', uid), userData);

      Alert.alert('Success', `User ${newUser.name} created successfully. ${newUser.role === 'student'
        ? 'They can login using their username and student ID as password.'
        : 'They can login using their email and the password you set.'
        }`);

      setShowCreateModal(false);
      resetForm();
      fetchUsers();

    } catch (error: any) {
      console.error('Error creating user:', error);

      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        // This shouldn't happen now since we check Firestore first,
        // but just in case, let's handle it
        Alert.alert(
          'Email in Use',
          'This email is already registered in Authentication but not in our database. This is an inconsistency. Please contact support.'
        );
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'Password should be at least 6 characters.');
      } else {
        Alert.alert('Error', 'Failed to create user: ' + error.message);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setModalLoading(true);
      const userRef = doc(db, 'users', selectedUser.id);

      // Prepare update data based on role
      const updateData: any = {
        name: selectedUser.name,
        role: selectedUser.role,
      };

      // Handle student-specific fields
      if (selectedUser.role === 'student') {
        updateData.studentID = selectedUser.studentID || null;
        updateData.course = selectedUser.course || null;
        updateData.yearLevel = selectedUser.yearLevel || null;
        updateData.block = selectedUser.block || null;
        updateData.gender = selectedUser.gender || null;
      } else {
        // For admins, only update studentID if provided
        if (selectedUser.studentID) {
          updateData.studentID = selectedUser.studentID;
        }

        // Clear student fields when role changed from student to admin
        updateData.course = null;
        updateData.yearLevel = null;
        updateData.block = null;
        updateData.gender = null;
      }

      await updateDoc(userRef, updateData);

      Alert.alert('Success', 'User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
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
              Alert.alert('Success', 'User deleted successfully from Firestore');
              fetchUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
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

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={[styles.userCard, !item.active && styles.inactiveUserCard]}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.name}</Text>
          {!item.active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
        <View style={[
          styles.roleBadge,
          item.role === 'main_admin' && styles.mainAdminBadge,
          item.role === 'assistant_admin' && styles.assistantAdminBadge,
          item.role === 'student' && styles.studentBadge,
        ]}>
          <Text style={[
            styles.roleText,
            item.role === 'main_admin' && styles.mainAdminBadgeText,
            item.role === 'assistant_admin' && styles.assistantAdminBadgeText,
            item.role === 'student' && styles.studentBadgeText,
          ]}>
            {item.role.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        {item.studentID && (
          <Text style={styles.studentId}>ID: {item.studentID}</Text>
        )}
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setSelectedUser(item);
            setShowEditModal(true);
          }}
        >
          <Feather name="edit-2" size={16} color="#3b82f6" />
        </TouchableOpacity>

        {item.email !== userData?.email && (
          <>
            {/* Activate/Deactivate Button - Make it more obvious */}
            <TouchableOpacity
              style={[
                styles.statusButton,
                item.active ? styles.deactivateButton : styles.activateButton
              ]}
              onPress={() => handleToggleActive(item)}
            >
              <Feather
                name={item.active ? "user-x" : "user-check"}
                size={16}
                color={item.active ? "#ef4444" : "#10b981"}
              />
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteUser(item.id, item.name)}
            >
              <Feather name="trash-2" size={16} color="#ef4444" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
  const handleToggleActive = async (user: User) => {
    const newActiveStatus = !user.active;
    const action = newActiveStatus ? 'activate' : 'deactivate';

    console.log('=== Toggle Active Debug ===');
    console.log('User:', user.name);
    console.log('Current active:', user.active);
    console.log('New active:', newActiveStatus);
    console.log('User ID:', user.id);

    Alert.alert(
      `${action === 'activate' ? 'Activate' : 'Deactivate'} User`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'activate' ? 'Yes, Activate' : 'Yes, Deactivate',
          style: action === 'deactivate' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setModalLoading(true);

              const userRef = doc(db, 'users', user.id);

              // Update Firestore
              await updateDoc(userRef, {
                active: newActiveStatus,
                ...(action === 'deactivate' && { deactivatedAt: new Date().toISOString() }),
                ...(action === 'activate' && { deactivatedAt: null }),
              });

              console.log('Firestore update successful');

              // Immediately update local state
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

              console.log('Local state updated');

              Alert.alert('Success', `User ${action}d successfully`);

              // Optional: Fetch from server to ensure sync
              // await fetchUsers();

            } catch (error: any) {
              console.error(`Error ${action}ing user:`, error);
              Alert.alert('Error', `Failed to ${action} user: ${error.message}`);
            } finally {
              setModalLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>Manage system users and permissions</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {users.filter(u => u.role === 'main_admin').length}
            </Text>
            <Text style={styles.statLabel}>Main Admins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {users.filter(u => u.role === 'assistant_admin').length}
            </Text>
            <Text style={styles.statLabel}>Assistant Admins</Text>
          </View>
        </View>

       
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Feather name="user-plus" size={18} color="#ffffff" />
            <Text style={styles.createButtonText}>Add New User</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              console.log('Manual refresh');
              fetchUsers();
            }}
          >
            <Feather name="refresh-cw" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.usersList}
          />
        )}
      </ScrollView>

      {/* Create User Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New User</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.name}
                  onChangeText={(text) => setNewUser({ ...newUser, name: text })}
                  placeholder="Enter full name"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username *</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.username}
                  onChangeText={(text) => setNewUser({ ...newUser, username: text })}
                  placeholder="Enter username (e.g., john.cajes)"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.email}
                  onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                  placeholder="Enter email address"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* REMOVED: The standalone password field from here */}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role *</Text>
                <View style={styles.roleSelector}>
                  {(['student', 'assistant_admin', 'main_admin'] as const).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        newUser.role === role && styles.roleOptionSelected,
                      ]}
                      onPress={() => {
                        setNewUser({
                          ...newUser,
                          role,
                          // Reset student-specific fields when switching to non-student roles
                          studentID: role !== 'student' ? '' : newUser.studentID,
                          block: role !== 'student' ? '' : newUser.block,
                          course: role !== 'student' ? '' : newUser.course,
                          gender: role !== 'student' ? '' : newUser.gender,
                          yearLevel: role !== 'student' ? '' : newUser.yearLevel,
                          // Clear password when switching to student
                          password: role === 'student' ? '' : newUser.password,
                        });
                      }}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        newUser.role === role && styles.roleOptionTextSelected,
                      ]}>
                        {role.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Student-specific fields - only shown when role is 'student' */}
              {newUser.role === 'student' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Student ID *</Text>
                    <TextInput
                      style={styles.input}
                      value={newUser.studentID}
                      onChangeText={(text) => setNewUser({ ...newUser, studentID: text })}
                      placeholder="Enter student ID"
                      placeholderTextColor="#94a3b8"
                    />
                    <Text style={styles.fieldNote}>This will be used as the password</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Course *</Text>
                    <TextInput
                      style={styles.input}
                      value={newUser.course}
                      onChangeText={(text) => setNewUser({ ...newUser, course: text })}
                      placeholder="Enter course (e.g., BSIT, BSCS)"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Year Level *</Text>
                    <View style={styles.roleSelector}>
                      {(['1st Year', '2nd Year', '3rd Year', '4th Year'] as const).map((year) => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.roleOption,
                            newUser.yearLevel === year && styles.roleOptionSelected,
                          ]}
                          onPress={() => setNewUser({ ...newUser, yearLevel: year })}
                        >
                          <Text style={[
                            styles.roleOptionText,
                            newUser.yearLevel === year && styles.roleOptionTextSelected,
                          ]}>
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Block *</Text>
                    <TextInput
                      style={styles.input}
                      value={newUser.block}
                      onChangeText={(text) => setNewUser({ ...newUser, block: text })}
                      placeholder="Enter block (e.g., 1, 2, 3)"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Gender *</Text>
                    <View style={styles.roleSelector}>
                      {(['Male', 'Female'] as const).map((gender) => (
                        <TouchableOpacity
                          key={gender}
                          style={[
                            styles.roleOption,
                            newUser.gender === gender && styles.roleOptionSelected,
                          ]}
                          onPress={() => setNewUser({ ...newUser, gender: gender })}
                        >
                          <Text style={[
                            styles.roleOptionText,
                            newUser.gender === gender && styles.roleOptionTextSelected,
                          ]}>
                            {gender}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* For admin roles - only show password field here */}
              {(newUser.role === 'assistant_admin' || newUser.role === 'main_admin') && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password *</Text>
                    <TextInput
                      style={styles.input}
                      value={newUser.password}
                      onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                      placeholder="Enter password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Student ID (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={newUser.studentID}
                      onChangeText={(text) => setNewUser({ ...newUser, studentID: text })}
                      placeholder="Enter student ID if applicable"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleCreateUser}
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Create User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}>
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <>
                <ScrollView style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={selectedUser.name}
                      onChangeText={(text) => setSelectedUser({ ...selectedUser, name: text })}
                      placeholder="Enter full name"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <Text style={styles.emailText}>{selectedUser.username}</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <Text style={styles.emailText}>{selectedUser.email}</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Role *</Text>
                    <View style={styles.roleSelector}>
                      {(['student', 'assistant_admin', 'main_admin'] as const).map((role) => (
                        <TouchableOpacity
                          key={role}
                          style={[
                            styles.roleOption,
                            selectedUser.role === role && styles.roleOptionSelected,
                          ]}
                          onPress={() => {
                            setSelectedUser({
                              ...selectedUser,
                              role,
                              // Clear student fields when switching from student to admin
                              ...(role !== 'student' && {
                                course: undefined,
                                yearLevel: undefined,
                                block: undefined,
                                gender: undefined
                              })
                            });
                          }}
                        >
                          <Text style={[
                            styles.roleOptionText,
                            selectedUser.role === role && styles.roleOptionTextSelected,
                          ]}>
                            {role.replace('_', ' ').toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Student-specific fields - only shown when role is 'student' */}
                  {selectedUser.role === 'student' && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Student ID *</Text>
                        <TextInput
                          style={styles.input}
                          value={selectedUser.studentID || ''}
                          onChangeText={(text) => setSelectedUser({ ...selectedUser, studentID: text })}
                          placeholder="Enter student ID"
                          placeholderTextColor="#94a3b8"
                        />
                        <Text style={styles.fieldNote}>This is used as the password</Text>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Course *</Text>
                        <TextInput
                          style={styles.input}
                          value={selectedUser.course || ''}
                          onChangeText={(text) => setSelectedUser({ ...selectedUser, course: text })}
                          placeholder="Enter course (e.g., BSIT, BSCS)"
                          placeholderTextColor="#94a3b8"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Year Level *</Text>
                        <View style={styles.roleSelector}>
                          {(['1st Year', '2nd Year', '3rd Year', '4th Year'] as const).map((year) => (
                            <TouchableOpacity
                              key={year}
                              style={[
                                styles.roleOption,
                                selectedUser.yearLevel === year && styles.roleOptionSelected,
                              ]}
                              onPress={() => setSelectedUser({ ...selectedUser, yearLevel: year })}
                            >
                              <Text style={[
                                styles.roleOptionText,
                                selectedUser.yearLevel === year && styles.roleOptionTextSelected,
                              ]}>
                                {year}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Block *</Text>
                        <TextInput
                          style={styles.input}
                          value={selectedUser.block || ''}
                          onChangeText={(text) => setSelectedUser({ ...selectedUser, block: text })}
                          placeholder="Enter block (e.g., 1, 2, 3)"
                          placeholderTextColor="#94a3b8"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Gender *</Text>
                        <View style={styles.roleSelector}>
                          {(['Male', 'Female'] as const).map((gender) => (
                            <TouchableOpacity
                              key={gender}
                              style={[
                                styles.roleOption,
                                selectedUser.gender === gender && styles.roleOptionSelected,
                              ]}
                              onPress={() => setSelectedUser({ ...selectedUser, gender: gender })}
                            >
                              <Text style={[
                                styles.roleOptionText,
                                selectedUser.gender === gender && styles.roleOptionTextSelected,
                              ]}>
                                {gender}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </>
                  )}

                  {/* For admin roles - show optional Student ID */}
                  {(selectedUser.role === 'assistant_admin' || selectedUser.role === 'main_admin') && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Student ID (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        value={selectedUser.studentID || ''}
                        onChangeText={(text) => setSelectedUser({ ...selectedUser, studentID: text })}
                        placeholder="Enter student ID if applicable"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={handleUpdateUser}
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.modalSaveButtonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  usersList: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userUsername: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 8,
    fontWeight: '500',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  fieldNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  mainAdminBadge: {
    backgroundColor: '#dbeafe',
  },
  assistantAdminBadge: {
    backgroundColor: '#ede9fe',
  },
  studentBadge: {
    backgroundColor: '#dcfce7',
  },
  inactiveUserCard: {
    opacity: 0.7,
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  inactiveBadge: {
    backgroundColor: '#64748b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  inactiveBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mainAdminBadgeText: {
    color: '#1d4ed8',
  },
  assistantAdminBadgeText: {
    color: '#7c3aed',
  },
  studentBadgeText: {
    color: '#15803d',
  },
  studentId: {
    fontSize: 12,
    color: '#94a3b8',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  emailText: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#64748b',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  roleOptionSelected: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  statusButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activateButton: {
    backgroundColor: '#e6f7e6',
  },
  deactivateButton: {
    backgroundColor: '#fff7ed',
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  roleOptionTextSelected: {
    color: '#ffffff',
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  modalSaveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#64748b',
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});