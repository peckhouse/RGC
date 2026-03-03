import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, Modal, StyleSheet, Text, View} from 'react-native';

type ToastType = 'success' | 'error' | 'info';

interface ShowParams {
  type?: ToastType;
  text1: string;
  text2?: string;
  visibilityTime?: number;
}

// Module-level ref — same imperative pattern as react-native-toast-message
let _show: ((params: ShowParams) => void) | null = null;

export const Toast = {
  show: (params: ShowParams) => _show?.(params),
};

const SCREEN_WIDTH = Dimensions.get('window').width;

// Tab bar height (60) + desired gap above it (16)
const BOTTOM_OFFSET = 76;

export function AppToast() {
  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const [toast, setToast] = useState<ShowParams | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const slideOut = useCallback(() => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [translateX]);

  useEffect(() => {
    _show = (params: ShowParams) => {
      clearTimeout(timerRef.current);
      translateX.setValue(-SCREEN_WIDTH);
      setToast(params);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 10,
        tension: 80,
      }).start();
      timerRef.current = setTimeout(slideOut, params.visibilityTime ?? 2500);
    };
    return () => {
      _show = null;
      clearTimeout(timerRef.current);
    };
  }, [translateX, slideOut]);

  if (!toast) {
    return null;
  }

  const borderColor =
    (toast.type ?? 'success') === 'success'
      ? '#22c55e'
      : (toast.type ?? 'success') === 'error'
        ? '#ef4444'
        : '#6366f1';

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.container,
          {bottom: BOTTOM_OFFSET, transform: [{translateX}]},
        ]}>
        <View style={[styles.toast, {borderLeftColor: borderColor}]}>
          <View style={styles.content}>
            <Text style={styles.text1}>{toast.text1}</Text>
            {toast.text2 ? (
              <Text style={styles.text2}>{toast.text2}</Text>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    paddingLeft: '5%',
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderLeftWidth: 5,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  text1: {color: '#f1f5f9', fontSize: 14, fontWeight: '600'},
  text2: {color: '#94a3b8', fontSize: 12, marginTop: 2},
});
