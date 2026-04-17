import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import * as Sharing from "expo-sharing";
import { Paths, File } from "expo-file-system";
import { Theme } from "../theme";

interface ImageViewerModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string | null | undefined;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  onClose,
  imageUri,
}) => {
  const [downloadingImage, setDownloadingImage] = React.useState(false);

  const handleShareImage = async () => {
    if (!imageUri) return;

    try {
      setDownloadingImage(true);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Not Available", "Sharing is not available on this device");
        return;
      }

      // Download image to local directory using new API with unique filename
      const filename = `shared_image_${Date.now()}.jpg`;
      const file = new File(Paths.cache, filename);

      const downloadedFile = await File.downloadFileAsync(imageUri, file, {
        idempotent: true,
      });

      // Share the local file
      await Sharing.shareAsync(downloadedFile.uri, {
        mimeType: "image/jpeg",
        dialogTitle: "Save Photo",
      });

      onClose();
    } catch (error) {
      console.error("Error sharing image:", error);
      Alert.alert("Error", "Failed to share image");
    } finally {
      setDownloadingImage(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header with close button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Image Viewer</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <View style={styles.closeButtonInner}>
              <Text style={styles.closeButtonText}>✕</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Image container */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>No image available</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.shareButton,
              downloadingImage && styles.shareButtonDisabled,
            ]}
            onPress={handleShareImage}
            disabled={downloadingImage}
            activeOpacity={0.8}
          >
            {downloadingImage ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.shareButtonText}>Share Image</Text>
                <Text style={styles.shareButtonIcon}>⤤</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
    lineHeight: 22,
  },
  imageContainer: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.65,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: Dimensions.get("window").width - 32,
    height: Dimensions.get("window").height * 0.6,
    borderRadius: 12,
  },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
  },
  actionsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  shareButtonIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
  },
});
