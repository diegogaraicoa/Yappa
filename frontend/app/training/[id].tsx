import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Markdown from 'react-native-markdown-display';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://tienda-ai.preview.emergentagent.com';

interface Tutorial {
  _id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  video_url?: string;
  duration_minutes: number;
  steps?: Array<{ title: string; content: string }>;
}

export default function TutorialDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadTutorial();
  }, [id]);

  const loadTutorial = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/training/${id}`);
      setTutorial(response.data);
      
      // Parse steps from markdown if they exist
      parseStepsFromContent(response.data.content);
    } catch (error) {
      console.error('Error loading tutorial:', error);
      Alert.alert('Error', 'No se pudo cargar el tutorial');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const parseStepsFromContent = (content: string) => {
    // Extract interactive steps from markdown
    // Look for patterns like "### Paso 1:" or "**Paso 1:**"
    const stepRegex = /###?\s*(Paso\s+\d+:|Step\s+\d+:)/gi;
    const matches = content.match(stepRegex);
    // We'll handle this client-side for now
  };

  const toggleStep = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      basic: '#4CAF50',
      intermediate: '#FF9800',
      advanced: '#F44336',
      whatsapp: '#25D366',
      reports: '#2196F3',
      critical: '#E91E63',
    };
    return colors[category] || '#9E9E9E';
  };

  const markdownStyles = {
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: '#333',
    },
    heading1: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333',
      marginTop: 16,
      marginBottom: 12,
    },
    heading2: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
      marginTop: 16,
      marginBottom: 8,
    },
    heading3: {
      fontSize: 18,
      fontWeight: '600',
      color: '#007AFF',
      marginTop: 12,
      marginBottom: 6,
    },
    paragraph: {
      marginBottom: 12,
    },
    listItem: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    listItemBullet: {
      width: 20,
    },
    code_inline: {
      backgroundColor: '#F5F5F5',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
    },
    code_block: {
      backgroundColor: '#F5F5F5',
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      fontFamily: 'monospace',
    },
    blockquote: {
      backgroundColor: '#FFF9E6',
      borderLeftWidth: 4,
      borderLeftColor: '#FFB300',
      padding: 12,
      marginVertical: 8,
    },
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando tutorial...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!tutorial) {
    return null;
  }

  // Extract steps for interactive checklist
  const steps = extractSteps(tutorial.content);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.category} numberOfLines={1}>
            {getCategoryName(tutorial.category)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{tutorial.title}</Text>
          <Text style={styles.description}>{tutorial.description}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{tutorial.duration_minutes} minutos</Text>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(tutorial.category) }]}>
              <Text style={styles.categoryBadgeText}>{getCategoryName(tutorial.category)}</Text>
            </View>
          </View>
        </View>

        {steps.length > 0 && (
          <View style={styles.stepsSection}>
            <Text style={styles.sectionTitle}>📋 Pasos a Seguir</Text>
            {steps.map((step, index) => (
              <TouchableOpacity
                key={index}
                style={styles.stepCard}
                onPress={() => toggleStep(index)}
              >
                <View style={styles.stepHeader}>
                  <View style={[
                    styles.checkbox,
                    completedSteps.has(index) && styles.checkboxChecked
                  ]}>
                    {completedSteps.has(index) && (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </View>
                  <Text style={[
                    styles.stepTitle,
                    completedSteps.has(index) && styles.stepTitleCompleted
                  ]}>
                    {step.title}
                  </Text>
                </View>
                <Text style={styles.stepContent}>{step.content}</Text>
              </TouchableOpacity>
            ))}
            
            {completedSteps.size === steps.length && steps.length > 0 && (
              <View style={styles.completionBanner}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.completionText}>¡Completado! 🎉</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>📖 Contenido del Tutorial</Text>
          <View style={styles.markdownContainer}>
            <Markdown style={markdownStyles}>
              {tutorial.content}
            </Markdown>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Volver a Tutoriales</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function extractSteps(content: string): Array<{ title: string; content: string }> {
  // Extract steps from content that match patterns like:
  // ### Paso 1: Title
  // or **Paso 1:** Title
  
  const steps: Array<{ title: string; content: string }> = [];
  const lines = content.split('\n');
  
  let currentStep: { title: string; content: string } | null = null;
  
  for (const line of lines) {
    // Check for step headers
    const stepMatch = line.match(/^###?\s*(Paso\s+\d+:.*)/i) || line.match(/^\*\*(Paso\s+\d+:.*?)\*\*/i);
    
    if (stepMatch) {
      // Save previous step
      if (currentStep) {
        steps.push(currentStep);
      }
      
      // Start new step
      currentStep = {
        title: stepMatch[1].replace(/\*\*/g, '').trim(),
        content: ''
      };
    } else if (currentStep && line.trim() && !line.startsWith('#')) {
      // Add content to current step
      currentStep.content += line.trim() + ' ';
    }
  }
  
  // Add last step
  if (currentStep) {
    steps.push(currentStep);
  }
  
  return steps;
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    basic: 'Básico',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    whatsapp: 'WhatsApp AI',
    reports: 'Reportes',
    critical: '⚠️ OBLIGATORIO',
  };
  return names[category] || category;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  category: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  stepsSection: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  stepCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  stepTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stepTitleCompleted: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  stepContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 36,
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  completionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
  contentSection: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 12,
  },
  markdownContainer: {
    marginTop: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  doneButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
