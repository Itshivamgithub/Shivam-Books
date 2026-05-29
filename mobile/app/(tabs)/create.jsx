import { useState } from "react";
import {
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import styles from "../../assets/styles/create.styles";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";

import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";
import { API_URL } from "../../constants/api";

export default function Create() {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(3);
  const [image, setImage] = useState(null); // to display the selected image
  const [imageBase64, setImageBase64] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const [pdfBase64, setPdfBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { token } = useAuthStore();

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "We need camera roll permissions to upload an image");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true, // Always request base64, even on web
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setImage(asset.uri);

        // On Web, ImagePicker often provides the full data URI in `uri` or `base64`
        if (Platform.OS === "web") {
           // On web, if base64 is provided by Expo, use it.
           if (asset.base64) {
             setImageBase64(asset.base64);
           } else if (asset.uri && asset.uri.startsWith('data:')) {
             // Sometimes the URI itself is the base64 data string
             const base64data = asset.uri.split(",")[1];
             setImageBase64(base64data);
           } else {
             Alert.alert("Web Upload Error", "Unable to process image data on the web.");
           }
        } else {
          // Mobile: use legacy FileSystem
          if (asset.base64) {
            setImageBase64(asset.base64);
          } else {
            const base64 = await readAsStringAsync(asset.uri, {
              encoding: EncodingType.Base64,
            });
            setImageBase64(base64);
          }
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "There was a problem selecting your image");
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setPdfName(file.name);

        if (Platform.OS === "web") {
          // On Web, DocumentPicker provides the data URI directly in the `uri` property
          if (file.uri && file.uri.startsWith('data:')) {
            setPdfBase64(file.uri);
          } else {
             // Fallback for web if it's a blob (read using modern file method)
             if (file.file) { // The raw File object is sometimes available on web
                const reader = new FileReader();
                reader.onloadend = () => {
                  setPdfBase64(reader.result.toString());
                };
                reader.readAsDataURL(file.file);
             } else {
                Alert.alert("Web Upload Error", "Unable to process PDF data on the web.");
             }
          }
        } else {
          // Mobile: use legacy FileSystem
          const base64 = await readAsStringAsync(file.uri, {
            encoding: EncodingType.Base64,
          });
          setPdfBase64(`data:application/pdf;base64,${base64}`);
        }
      }
    } catch (error) {
      console.error("Error picking PDF:", error);
      Alert.alert("Error", "There was a problem selecting your PDF");
    }
  };

  const handleSubmit = async () => {
    if (!title || !caption || !imageBase64 || !rating) {
      Alert.alert("Error", "Please fill in all fields (Title, Rating, Image, Caption)");
      return;
    }

    try {
      setLoading(true);

      const uriParts = image.split(".");
      const fileType = uriParts[uriParts.length - 1];
      const imageType = fileType ? `image/${fileType.toLowerCase()}` : "image/jpeg";

      const imageDataUrl = `data:${imageType};base64,${imageBase64}`;

      const response = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          caption,
          rating: rating.toString(),
          image: imageDataUrl,
          pdf: pdfBase64,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert("Success", "Your book recommendation has been posted!");
      setTitle("");
      setCaption("");
      setRating(3);
      setImage(null);
      setImageBase64(null);
      setPdfName("");
      setPdfBase64(null);
      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderRatingPicker = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starButton}>
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={32}
            color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} style={styles.scrollViewStyle}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Book Recommendation</Text>
            <Text style={styles.subtitle}>Share your favorite reads with others</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter book title"
                  placeholderTextColor={COLORS.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Rating</Text>
              {renderRatingPicker()}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Image (Cover)</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="image-outline" size={40} color={COLORS.textSecondary} />
                    <Text style={styles.placeholderText}>Tap to select image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Book PDF (Optional)</Text>
              <TouchableOpacity
                style={[
                  styles.imagePicker,
                  { height: 80, borderStyle: "dashed", justifyContent: "center" },
                ]}
                onPress={pickPdf}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20 }}>
                  <Ionicons
                    name="document-text-outline"
                    size={32}
                    color={pdfName ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text
                    style={{
                      marginLeft: 15,
                      color: pdfName ? COLORS.text : COLORS.textSecondary,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {pdfName || "Tap to select PDF file"}
                  </Text>
                  {pdfName && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setPdfName("");
                        setPdfBase64(null);
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.error || "#ff4444"} />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Caption</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Write your review or thoughts about this book..."
                placeholderTextColor={COLORS.placeholderText}
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Share</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
