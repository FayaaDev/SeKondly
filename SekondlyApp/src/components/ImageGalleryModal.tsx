import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  PinchGestureHandler, 
  PanGestureHandler, 
  State,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ImageGalleryModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ImageGalleryModal({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const insets = useSafeAreaInsets();
  
  // Animated values for pinch and pan
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Swipe navigation
  const swipeTranslateX = useRef(new Animated.Value(0)).current;
  
  // Gesture refs
  const pinchRef = useRef(null);
  const panRef = useRef(null);
  const swipeRef = useRef(null);

  // Pinch gesture handler
  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    { useNativeDriver: true }
  );

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Get the final scale value and constrain it
      const newScale = Math.max(1, Math.min(4, event.nativeEvent.scale));
      
      // Set the scale to the constrained value
      scale.setValue(newScale);
      
      // If zoomed out completely, reset translation
      if (newScale <= 1) {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      }
    }
  };

  // Pan gesture handler (for zoomed images)
  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Add some constraints to prevent panning too far
      const currentScale = (scale as any)._value;
      if (currentScale > 1) {
        const maxTranslate = (screenWidth * (currentScale - 1)) / 2;
        
        const constrainedX = Math.max(-maxTranslate, Math.min(maxTranslate, event.nativeEvent.translationX));
        const constrainedY = Math.max(-maxTranslate, Math.min(maxTranslate, event.nativeEvent.translationY));
        
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: constrainedX,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: constrainedY,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  // Swipe gesture handler (for navigation)
  const onSwipeGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: swipeTranslateX } }],
    { useNativeDriver: true }
  );

  const onSwipeHandlerStateChange = (event: any) => {
    const currentScale = (scale as any)._value || 1;
    
    // Only allow swipe navigation if not zoomed (scale close to 1)
    if (currentScale <= 1.2 && event.nativeEvent.oldState === State.ACTIVE) {
      const swipeThreshold = screenWidth * 0.25;
      
      if (event.nativeEvent.translationX > swipeThreshold && currentIndex > 0) {
        // Swipe right - previous image
        navigateToImage(currentIndex - 1);
      } else if (event.nativeEvent.translationX < -swipeThreshold && currentIndex < images.length - 1) {
        // Swipe left - next image
        navigateToImage(currentIndex + 1);
      } else {
        // Reset position
        Animated.spring(swipeTranslateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    } else {
      // Reset swipe position when zoomed
      Animated.spring(swipeTranslateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const navigateToImage = (index: number) => {
    setCurrentIndex(index);
    resetImageState();
  };

  const resetImageState = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(swipeTranslateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClose = () => {
    resetImageState();
    onClose();
  };

  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      resetImageState();
    }
  }, [visible, initialIndex]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.counter}>
              {currentIndex + 1} of {images.length}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Image Container */}
          <View style={styles.imageContainer}>
            {/* Gesture-enabled image display */}
            <PinchGestureHandler
              ref={pinchRef}
              onGestureEvent={onPinchGestureEvent}
              onHandlerStateChange={onPinchHandlerStateChange}
              simultaneousHandlers={[panRef]}
            >
              <Animated.View style={styles.imageWrapper}>
                <PanGestureHandler
                  ref={panRef}
                  onGestureEvent={onPanGestureEvent}
                  onHandlerStateChange={onPanHandlerStateChange}
                  simultaneousHandlers={[pinchRef]}
                  minPointers={1}
                  maxPointers={1}
                >
                  <Animated.View
                    style={[
                      styles.imageAnimated,
                      {
                        transform: [
                          { scale: scale },
                          { translateX: translateX },
                          { translateY: translateY },
                        ],
                      },
                    ]}
                  >
                    <ExpoImage
                      source={{ uri: images[currentIndex] }}
                      style={styles.image}
                      contentFit="contain"
                      transition={200}
                    />
                  </Animated.View>
                </PanGestureHandler>
              </Animated.View>
            </PinchGestureHandler>
          </View>

          {/* Navigation Dots */}
          {images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dot,
                    index === currentIndex && styles.activeDot,
                  ]}
                  onPress={() => navigateToImage(index)}
                />
              ))}
            </View>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              {currentIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.leftNav]}
                  onPress={() => navigateToImage(currentIndex - 1)}
                >
                  <Ionicons name="chevron-back" size={30} color="#fff" />
                </TouchableOpacity>
              )}
              {currentIndex < images.length - 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.rightNav]}
                  onPress={() => navigateToImage(currentIndex + 1)}
                >
                  <Ionicons name="chevron-forward" size={30} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Gesture Hint */}
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              Pinch to zoom • Swipe to navigate
            </Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  counter: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  placeholder: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageWrapper: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: "center",
    alignItems: "center",
  },
  imageAnimated: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  pinchContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  swipeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  debugInfo: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: "#fff",
    fontSize: 10,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 20,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  leftNav: {
    left: 20,
  },
  rightNav: {
    right: 20,
  },
  hintContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
});
