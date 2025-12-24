import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '../theme';
import { useUploadToS3Mutation } from '../services/api/storageApi';

interface ImageUploadS3Props {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  disabled?: boolean;
  folder?: string; // S3 folder path
  useS3?: boolean; // Enable/disable S3 upload
  entityId?: string; // Entity ID for unique file naming
  autoSave?: boolean; // Auto-save to database when images change
  onAutoSave?: (images: string[]) => Promise<void>; // Callback for auto-save
}

export const ImageUploadS3: React.FC<ImageUploadS3Props> = ({
  images = [],
  onImagesChange,
  maxImages = 5,
  label = 'Images',
  disabled = false,
  folder = 'rooms/images',
  useS3 = true,
  entityId,
  autoSave = false,
  onAutoSave,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [uploadToS3Mutation] = useUploadToS3Mutation();

  const generateUniqueFileName = (baseName: string, prefix: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const safePrefix = (prefix || 'file').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = (baseName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${safePrefix}_${timestamp}_${random}_${safeName}`;
  };

  const validateBase64FileSize = (dataUriOrBase64: string, maxSizeMB: number) => {
    try {
      const base64 = dataUriOrBase64.includes('base64,') ? dataUriOrBase64.split('base64,')[1] : dataUriOrBase64;
      // base64 size in bytes ~= (len * 3/4) - padding
      const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
      const bytes = Math.floor((base64.length * 3) / 4) - padding;
      return bytes <= maxSizeMB * 1024 * 1024;
    } catch {
      return false;
    }
  };

  // Helper function to clean up images array
  const cleanImages = (imageArray: string[]) => {
    return imageArray.filter(uri => uri && uri.trim() !== '' && uri !== 'undefined' && uri !== 'null');
  };

  // Clean up images array on mount and when images change
  useEffect(() => {
    const cleanedImages = cleanImages(images);
    if (cleanedImages.length !== images.length) {
      console.log('Cleaning up images array:', images, '->', cleanedImages);
      onImagesChange(cleanedImages);
    }
  }, [images.length]); // Only trigger when length changes to avoid infinite loops

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload images.'
      );
      return false;
    }
    return true;
  };

  const uploadToS3 = async (base64Image: string, index: number): Promise<string> => {
    try {
      setUploadProgress(prev => ({ ...prev, [index]: 0 }));

      const fileName = generateUniqueFileName(
        `room_image_${Date.now()}.jpg`,
        entityId ? `room_${entityId}` : 'room'
      );

      const result = await uploadToS3Mutation({
        file: base64Image,
        options: {
          folder,
          fileName,
          isPublic: true,
        },
      }).unwrap();

      setUploadProgress(prev => ({ ...prev, [index]: 100 }));

      if (result.success && result.url) {
        return result.url;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('S3 Upload Error:', error);
      throw error;
    } finally {
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[index];
          return newProgress;
        });
      }, 1000);
    }
  };

  const pickImage = async () => {
    if (disabled) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload ${maxImages} images.`);
      return;
    }

    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets) {
        const remainingSlots = maxImages - images.length;
        const assetsToProcess = result.assets.slice(0, remainingSlots);
        
        if (useS3) {
          // Upload to S3 only - no base64 fallback for new uploads
          try {
            const uploadPromises = assetsToProcess.map(async (asset, index) => {
              if (!asset.base64) {
                throw new Error('Base64 data not available');
              }

              // Validate file size (max 10MB for images)
              const base64Image = `data:image/jpeg;base64,${asset.base64}`;
              if (!validateBase64FileSize(base64Image, 10)) {
                throw new Error('Image size exceeds 10MB limit');
              }

              // Upload to S3 - no fallback
              const result = await uploadToS3(base64Image, images.length + index);
              console.log('S3 upload result:', result);
              return result;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            const newImages = cleanImages([...images, ...uploadedUrls]);
            onImagesChange(newImages);
          } catch (error: any) {
            console.error('S3 upload failed:', error);
            Alert.alert('Upload Failed', error.message || 'Failed to upload images to cloud storage. Please try again.');
            return;
          }
        } else {
          // Use base64 (backward compatibility mode - disabled for new uploads)
          Alert.alert('Upload Disabled', 'Base64 uploads are disabled. Please enable S3 uploads.');
          return;
        }

        if (result.assets.length > remainingSlots) {
          Alert.alert(
            'Some Images Not Added',
            `Only ${remainingSlots} image(s) could be added due to the ${maxImages} image limit.`
          );
        }
      }
    } catch (error: any) {
      console.error('Error picking images:', error);
      Alert.alert('Upload Error', error.message || 'Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    if (disabled) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload ${maxImages} images.`);
      return;
    }

    try {
      setUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        if (useS3 && asset.base64) {
          // Upload to S3 only - no base64 fallback
          const base64Image = `data:image/jpeg;base64,${asset.base64}`;
          
          // Validate file size
          if (!validateBase64FileSize(base64Image, 10)) {
            Alert.alert('Error', 'Image size exceeds 10MB limit');
            return;
          }

          try {
            const uploadedUrl = await uploadToS3(base64Image, images.length);
            const newImages = cleanImages([...images, uploadedUrl]);
            onImagesChange(newImages);
          } catch (s3Error: any) {
            console.error('S3 upload failed:', s3Error);
            Alert.alert('Upload Failed', s3Error.message || 'Failed to upload image to cloud storage. Please try again.');
            return;
          }
        } else {
          // Base64 uploads disabled for new images
          Alert.alert('Upload Disabled', 'Base64 uploads are disabled. Please enable S3 uploads.');
          return;
        }
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Upload Error', error.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    if (disabled) return;

    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const imageToRemove = images[index];
            console.log('Removing image at index:', index, 'URI:', imageToRemove);
            console.log('Image marked for removal (will be deleted from S3 on backend save):', imageToRemove);

            // Remove the image and clean up the array
            console.log('Before removal - images array:', images);
            console.log('Removing index:', index);
            
            const filteredImages = images.filter((_, i) => i !== index);
            const newImages = cleanImages(filteredImages);
            
            console.log('After removal - filtered images:', filteredImages);
            console.log('After cleanup - final images:', newImages);
            
            // Update local state - this will update the room payload immediately
            onImagesChange([...newImages]);
            console.log('Images updated in room payload (local state):', newImages);
            
            // Auto-save to database if enabled (for existing rooms)
            // Backend will handle S3 deletion when images are updated
            if (autoSave && onAutoSave) {
              try {
                console.log('Auto-saving images to database...', newImages);
                await onAutoSave([...newImages]);
                console.log('Auto-save successful - backend will delete removed images from S3');
              } catch (saveError) {
                console.error('Auto-save failed:', saveError);
                Alert.alert('Save Error', 'Failed to update room in database. Please save manually.');
              }
            }
          },
        },
      ]
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>
      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>
          {images.filter(uri => uri && uri.trim() !== '').length} / {maxImages} images
        </Text>
        {useS3 && (
          <View style={styles.s3Badge}>
            <Text style={styles.s3BadgeText}>☁️ S3</Text>
          </View>
        )}
      </View>

      {/* Image Grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Existing Images */}
        {images.map((imageUri, index) => {
          // Skip empty or invalid URIs
          if (!imageUri || imageUri.trim() === '' || imageUri === 'undefined' || imageUri === 'null') {
            return null;
          }
          
          return (
            <View key={`${index}-${imageUri.substring(0, 20)}`} style={styles.imageContainer}>
              <Image 
                source={{ uri: imageUri }} 
                style={styles.image}
                onError={() => console.warn('Failed to load image:', imageUri)}
              />
              
              {/* Upload Progress */}
              {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                <View style={styles.progressOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.progressText}>{uploadProgress[index]}%</Text>
                </View>
              )}
              
              {/* Remove Button */}
              {!disabled && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              )}

              {/* Image Number Badge */}
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>{images.filter((uri, i) => i <= index && uri && uri.trim() !== '').length}</Text>
              </View>

              {/* S3 Indicator */}
              {useS3 && imageUri.includes('amazonaws.com') && (
                <View style={styles.s3Indicator}>
                  <Text style={styles.s3IndicatorText}>☁️</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Add Image Button */}
        {images.filter(uri => uri && uri.trim() !== '').length < maxImages && !disabled && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={showImageOptions}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="large" color={Theme.colors.primary} />
            ) : (
              <>
                <View style={styles.addIconContainer}>
                  <Text style={styles.addIcon}>📷</Text>
                </View>
                <Text style={styles.addButtonText}>Add Image</Text>
                {useS3 && (
                  <Text style={styles.addButtonSubtext}>Upload to S3</Text>
                )}
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Help Text */}
      {!disabled && images.filter(uri => uri && uri.trim() !== '').length === 0 && (
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            📸 Tap to add {label.toLowerCase()}
          </Text>
          {useS3 && (
            <Text style={styles.helpSubtext}>
              Images will be uploaded to cloud storage
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  s3Badge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  s3BadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: Theme.colors.border,
  } as const,
  progressOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF4444', // Bright red background
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  imageBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  s3Indicator: {
    position: 'absolute',
    top: 8,
    left: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  s3IndicatorText: {
    fontSize: 10,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background.primary,
  },
  addIconContainer: {
    marginBottom: 4,
  },
  addIcon: {
    fontSize: 24,
  },
  addButtonText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  addButtonSubtext: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  helpContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  helpSubtext: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ImageUploadS3;
