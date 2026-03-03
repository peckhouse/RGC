import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Pressable,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {supabase} from '../lib/supabase';
import {Fonts} from '../constants/fonts';
import type {AuthStackParamList} from '../navigation/AppNavigator';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(buttonScale, {toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 0}).start();
  }
  function pressOut() {
    Animated.spring(buttonScale, {toValue: 1, useNativeDriver: true, speed: 30, bounciness: 5}).start();
  }

  async function handleReset() {
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const {error: e} = await supabase.auth.resetPasswordForEmail(email.trim());
      if (e) {
        setError(e.message);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image
            source={require('../../assets/rgc-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Your entire collection,{'\n'}Everywhere you go.</Text>
        </View>

        <View style={[styles.card, error && styles.cardError]}>
          <LinearGradient
            colors={['#0d2525', '#0a1a35', '#06091e']}
            locations={[0, 0.60, 1]}
            start={{x: 1, y: 1}}
            end={{x: 0, y: 0}}
            style={styles.cardGradient}
          />

          <Text style={styles.cardTitle}>Reset password</Text>
          <Text style={styles.cardDescription}>
            Enter your email and we'll send you a link to reset your password.
          </Text>

          {sent ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                Check your inbox! A reset link has been sent to {email.trim()}.
              </Text>
            </View>
          ) : (
            <>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputField}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <Animated.View style={{transform: [{scale: buttonScale}]}}>
                <Pressable
                  onPress={handleReset}
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                  disabled={loading}
                  style={[styles.buttonSolid, loading && styles.buttonDisabled]}>
                  <LinearGradient
                    colors={['#FF1B8D', '#A855F7', '#5B45DC']}
                    locations={[0, 0.65, 1]}
                    start={{x: 0.3, y: 0}}
                    end={{x: 0.4, y: 1}}
                    style={styles.buttonGradient}
                  />
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send reset link</Text>
                  )}
                </Pressable>
              </Animated.View>
            </>
          )}

          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>
              {'← '}
              <Text style={styles.backLink}>Back to sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 180,
    height: 80,
    marginBottom: 12,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 26,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    padding: 24,
    shadowColor: '#3B82F6',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  cardError: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    shadowColor: '#EF4444',
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#f1f5f9',
  },
  buttonSolid: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  backRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  backText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  backLink: {
    color: '#818cf8',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  successBox: {
    backgroundColor: '#052e16',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  successText: {
    color: '#86efac',
    fontSize: 14,
    lineHeight: 20,
  },
});
