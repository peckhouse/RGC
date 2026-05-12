import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, StyleSheet, Text, View} from 'react-native';
import {CheckCircle2, XCircle, Info} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

type ToastType = 'success' | 'error' | 'info';

interface ShowParams {
  type?: ToastType;
  text1: string;
  text2?: string;
  visibilityTime?: number;
}

let _show: ((params: ShowParams) => void) | null = null;

export const Toast = {
  show: (params: ShowParams) => _show?.(params),
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOTTOM_OFFSET = 76;

const ACCENT: Record<ToastType, string> = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#3B82F6',
};

function ToastIcon({type, color}: {type: ToastType; color: string}) {
  if (type === 'success') return <CheckCircle2 size={20} color={color} />;
  if (type === 'error') return <XCircle size={20} color={color} />;
  return <Info size={20} color={color} />;
}

export function AppToast() {
  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const [toast, setToast] = useState<ShowParams | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const slideOut = useCallback(() => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [translateX]);

  useEffect(() => {
    _show = (params: ShowParams) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      translateX.setValue(-SCREEN_WIDTH);
      setToast(params);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 10,
        tension: 80,
      }).start();
      timerRef.current = setTimeout(slideOut, params.visibilityTime ?? 1500);
    };
    return () => {
      _show = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [translateX, slideOut]);

  if (!toast) return null;

  const type = toast.type ?? 'success';
  const accent = ACCENT[type];

  return (
    <View pointerEvents="box-none" style={[styles.container, {bottom: BOTTOM_OFFSET}]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.toastWrapper, {transform: [{translateX}]}]}>
        <View style={[styles.toast, {borderColor: accent}]}>
          <LinearGradient
            colors={['#0d2525', '#0a1a35', '#06091e']}
            locations={[0, 0.60, 1]}
            start={{x: 1, y: 1}}
            end={{x: 0, y: 0}}
            style={styles.gradient}
          />
          <ToastIcon type={type} color={accent} />
          <View style={styles.content}>
            <Text style={styles.text1}>{toast.text1}</Text>
            {toast.text2 ? <Text style={styles.text2}>{toast.text2}</Text> : null}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toastWrapper: {
    width: '100%',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  text1: {color: '#ffffff', fontSize: 14, fontWeight: '700'},
  text2: {color: '#cbd5e1', fontSize: 12, marginTop: 2},
});
