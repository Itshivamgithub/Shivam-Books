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

// Helper to convert blob to base64 on web
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
};

export default function Create() {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(3);
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const [pdfBase64, setPdfBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  const router = useRouter();
  const { token } = useAuthStore();

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Need permissions");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setImage(asset.uri);

        if (Platform.OS === "web") {
          setConverting(true);
          try {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);
            setImageBase64(base64); // This is a full Data URI
          } catch (err) {
            console.error("Web Image conversion error:", err);
          } finally {
            setConverting(false);
          }
        } else {
          // Mobile
          const base64 = asset.base64 || await readAsStringAsync(asset.uri, { encoding: EncodingType.Base64 });
          setImageBase64(`data:image/jpeg;base64,${base64}`);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Problem selecting image");
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setPdfName(file.name);

        if (Platform.OS === "web") {
          setConverting(true);
          try {
            const response = await fetch(file.uri);
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);
            setPdfBase64(base64);
          } catch (err) {
            console.error("Web PDF conversion error:", err);
          } finally {
            setConverting(false);
          }
        } else {
          // Mobile
          const base64 = await readAsStringAsync(file.uri, { encoding: EncodingType.Base64 });
          setPdfBase64(`data:application/pdf;base64,${base64}`);
        }
      }
    } catch (error) {
      console.error("Error picking PDF:", error);
      Alert.alert("Error", "Problem selecting PDF");
    }
  };

  const handleSubmit = async () => {
    if (!title || !caption || !imageBase64 || !rating) {
      Alert.alert("Error", "Please fill in all fields (Title, Rating, Image, Caption)");
      return;
    }

    if (converting) {
      Alert.alert("Wait", "Still processing your files...");
      return;
    }

    try {
      setLoading(true);

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
          image: imageBase64,
          pdf: pdfBase64,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Server Error");

      Alert.alert("Success", "Book Shared!");
      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", error.message);
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
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
                <Ionicons name="book-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter book title" value={title} onChangeText={setTitle} />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Rating</Text>
              {renderRatingPicker()}
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Image (Cover)</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="image-outline" size={40} color={COLORS.textSecondary} />
                    <Text style={styles.placeholderText}>Tap to select image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book PDF (Optional)</Text>
              <TouchableOpacity style={[styles.imagePicker, { height: 80, borderStyle: "dashed", justifyContent: "center" }]} onPress={pickPdf}>
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20 }}>
                  <Ionicons name="document-text-outline" size={32} color={pdfName ? COLORS.primary : COLORS.textSecondary} />
                  <Text style={{ marginLeft: 15, color: pdfName ? COLORS.text : COLORS.textSecondary, flex: 1 }} numberOfLines={1}>
                    {pdfName || "Tap to select PDF file"}
                  </Text>
                  {pdfName && (
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); setPdfName(""); setPdfBase64(null); }}>
                      <Ionicons name="close-circle" size={24} color={COLORS.error || "#ff4444"} />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Caption</Text>
              <TextInput style={styles.textArea} placeholder="Review..." value={caption} onChangeText={setCaption} multiline />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading || converting}>
              {loading || converting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Share</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
