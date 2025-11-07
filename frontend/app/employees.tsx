import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function EmployeesScreen() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    phone: '',
    email: '',
    salary: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.log('Error loading employees:', error);
      Alert.alert('Error', 'No se pudieron cargar los empleados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newEmployee.name) {
      Alert.alert('Error', 'Ingresa el nombre del empleado');
      return;
    }

    try {
      await api.post('/api/employees', {
        ...newEmployee,
        salary: parseFloat(newEmployee.salary) || 0,
      });
      Alert.alert('Éxito', 'Empleado creado correctamente');
      setShowModal(false);
      setNewEmployee({ name: '', phone: '', email: '', salary: '' });
      loadEmployees();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al crear empleado');
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    Alert.alert(
      'Eliminar Empleado',
      '¿Estás seguro de que quieres eliminar este empleado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/employees/${employeeId}`);
              Alert.alert('Éxito', 'Empleado eliminado');
              loadEmployees();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el empleado');
            }
          },
        },
      ]
    );
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSalaries = employees.reduce((sum, emp) => sum + emp.salary, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Empleados</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Nómina Total Mensual</Text>
        <Text style={styles.statsValue}>${totalSalaries.toFixed(2)}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar empleados..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadEmployees} />
        }
      >
        {filteredEmployees.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron empleados' : 'No hay empleados aún'}
            </Text>
            <Text style={styles.emptySubtext}>
              {!searchQuery && 'Agrega tu primer empleado'}
            </Text>
          </View>
        ) : (
          filteredEmployees.map((employee) => (
            <View key={employee._id} style={styles.employeeCard}>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{employee.name}</Text>
                <Text style={styles.employeeSalary}>
                  Salario: ${employee.salary.toFixed(2)}/mes
                </Text>
                {employee.phone && (
                  <View style={styles.employeeDetail}>
                    <Ionicons name="call" size={16} color="#666" />
                    <Text style={styles.employeeDetailText}>{employee.phone}</Text>
                  </View>
                )}
                {employee.email && (
                  <View style={styles.employeeDetail}>
                    <Ionicons name="mail" size={16} color="#666" />
                    <Text style={styles.employeeDetailText}>{employee.email}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => deleteEmployee(employee._id)}>
                <Ionicons name="trash-outline" size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Empleado</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={newEmployee.name}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, name: text })}
                placeholder="Nombre del empleado"
              />

              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={newEmployee.phone}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, phone: text })}
                placeholder="0999123456"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={newEmployee.email}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, email: text })}
                placeholder="ejemplo@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Salario Mensual (USD)</Text>
              <TextInput
                style={styles.input}
                value={newEmployee.salary}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, salary: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Text style={styles.submitButtonText}>Crear Empleado</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  employeeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  employeeSalary: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 8,
  },
  employeeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  employeeDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
