import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://yappa-ai.preview.emergentagent.com';

interface Tutorial {
  _id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  order: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

export default function TrainingScreen() {
  const router = useRouter();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load categories
      const catResponse = await axios.get(`${API_URL}/api/training/categories/list`);
      setCategories([
        { id: 'all', name: 'Todos', description: 'Ver todos' },
        ...catResponse.data,
      ]);

      // Load tutorials
      const tutResponse = await axios.get(`${API_URL}/api/training`);
      setTutorials(tutResponse.data);
    } catch (error) {
      console.error('Error loading training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesCategory =
      selectedCategory === 'all' || tutorial.category === selectedCategory;
    const matchesSearch =
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      basic: '#00D2FF',
      intermediate: '#FF9800',
      advanced: '#F44336',
      whatsapp: '#25D366',
      reports: '#9C27B0',
    };
    return colors[category] || '#607D8B';
  };

  const getCategoryBgColor = (category: string) => {
    const colors: Record<string, string> = {
      basic: '#E8F5E9',
      intermediate: '#FFF3E0',
      advanced: '#FFEBEE',
      whatsapp: '#E8F5E9',
      reports: '#F3E5F5',
    };
    return colors[category] || '#ECEFF1';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      basic: 'play-circle',
      intermediate: 'trending-up',
      advanced: 'trophy',
      whatsapp: 'logo-whatsapp',
      reports: 'analytics',
    };
    return icons[category] || 'book';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Capacitación</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingText}>Cargando tutoriales...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capacitación</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeIconContainer}>
            <Ionicons name="school" size={32} color="#E91E63" />
          </View>
          <Text style={styles.welcomeTitle}>Aprende a usar YAPPA</Text>
          <Text style={styles.welcomeText}>
            Descubre todas las funcionalidades y saca el máximo provecho de tu negocio
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tutoriales..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#BDBDBD"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9E9E9E" />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesLabel}>CATEGORÍAS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tutorials List */}
        <View style={styles.tutorialsSection}>
          <Text style={styles.tutorialsLabel}>
            {filteredTutorials.length} TUTORIAL{filteredTutorials.length !== 1 ? 'ES' : ''}
          </Text>

          {filteredTutorials.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="search-outline" size={48} color="#9E9E9E" />
              </View>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyText}>Intenta con otra búsqueda</Text>
            </View>
          ) : (
            filteredTutorials.map((tutorial, index) => (
              <TouchableOpacity
                key={tutorial._id}
                style={styles.tutorialCard}
                onPress={() => router.push(`/training/${tutorial._id}` as any)}
                activeOpacity={0.7}
              >
                {/* Tutorial Header */}
                <View style={styles.tutorialHeader}>
                  <View
                    style={[
                      styles.tutorialIconContainer,
                      {
                        backgroundColor: getCategoryBgColor(tutorial.category),
                      },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryIcon(tutorial.category)}
                      size={28}
                      color={getCategoryColor(tutorial.category)}
                    />
                  </View>

                  <View style={styles.tutorialInfo}>
                    <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                    <Text style={styles.tutorialDescription} numberOfLines={2}>
                      {tutorial.description}
                    </Text>
                  </View>
                </View>

                {/* Tutorial Footer */}
                <View style={styles.tutorialFooter}>
                  <View style={styles.tutorialMeta}>
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={14} color="#757575" />
                      <Text style={styles.durationText}>
                        {tutorial.duration_minutes} min
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.categoryBadge,
                        {
                          backgroundColor: getCategoryBgColor(tutorial.category),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryBadgeText,
                          { color: getCategoryColor(tutorial.category) },
                        ]}
                      >
                        {categories.find((c) => c.id === tutorial.category)?.name ||
                          tutorial.category}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9E9E9E',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },

  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FCE4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
  },

  // Categories
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  categoriesScroll: {
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  categoryChipActive: {
    backgroundColor: '#FCE4EC',
    borderColor: '#E91E63',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  categoryChipTextActive: {
    color: '#E91E63',
    fontWeight: '600',
  },

  // Tutorials
  tutorialsSection: {
    marginBottom: 24,
  },
  tutorialsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  tutorialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tutorialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  tutorialIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialInfo: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 6,
    lineHeight: 22,
  },
  tutorialDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    lineHeight: 20,
  },
  tutorialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tutorialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#757575',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Empty State
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9E9E9E',
  },
});
