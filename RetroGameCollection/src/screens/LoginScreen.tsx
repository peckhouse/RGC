import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Mail, LockKeyhole, Eye, EyeOff, ArrowLeft} from 'lucide-react-native';
import {useAuth} from '../hooks/useAuth';
import {supabase} from '../lib/supabase';
import {Fonts} from '../constants/fonts';

// ─── Sign In Card ────────────────────────────────────────────────────────────

function SignInCard({onSwitch, onForgotPassword}: {onSwitch: () => void; onForgotPassword: () => void}) {
  const {signIn} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(buttonScale, {toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 0}).start();
  }
  function pressOut() {
    Animated.spring(buttonScale, {toValue: 1, useNativeDriver: true, speed: 30, bounciness: 5}).start();
  }

  async function handleSignIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const {error: e} = await signIn(email.trim(), password);
      if (e) setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.card, error && styles.cardError]}>
      <LinearGradient
        colors={['#0d2525', '#0a1a35', '#06091e']}
        locations={[0, 0.60, 1]}
        start={{x: 1, y: 1}}
        end={{x: 0, y: 0}}
        style={styles.cardGradient}
      />
      <Text style={styles.cardTitle}>Sign in</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.label}>Email</Text>
      <View style={[styles.inputWrapper, focused === 'email' && styles.inputWrapperFocused]}>
        <Mail size={18} color={focused === 'email' ? '#6366f1' : '#94a3b8'} style={styles.inputIcon} />
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
          onFocus={() => setFocused('email')}
          onBlur={() => setFocused(null)}
        />
      </View>

      <Text style={styles.label}>Password</Text>
      <View style={[styles.inputWrapper, focused === 'password' && styles.inputWrapperFocused]}>
        <LockKeyhole size={18} color={focused === 'password' ? '#6366f1' : '#94a3b8'} style={styles.inputIcon} />
        <TextInput
          style={styles.inputField}
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          placeholderTextColor="#64748b"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          editable={!loading}
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused(null)}
        />
        <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          {showPassword
            ? <EyeOff size={18} color="#64748b" />
            : <Eye size={18} color="#64748b" />}
        </TouchableOpacity>
      </View>

      <Pressable
        style={styles.forgotRow}
        onPress={onForgotPassword}
        disabled={loading}>
        {({pressed}) => (
          <Text style={[styles.forgotLink, pressed && styles.linkUnderline]}>Forgot password?</Text>
        )}
      </Pressable>

      <Animated.View style={{transform: [{scale: buttonScale}]}}>
        <Pressable
          onPress={handleSignIn}
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
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>
      </Animated.View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleText}>{"Don't have an account? "}</Text>
        <Pressable onPress={onSwitch} disabled={loading}>
          {({pressed}) => (
            <Text style={[styles.toggleLink, pressed && styles.linkUnderline]}>Sign up</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Sign Up Card ────────────────────────────────────────────────────────────

function SignUpCard({onSwitch}: {onSwitch: () => void}) {
  const {signUp} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(buttonScale, {toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 0}).start();
  }
  function pressOut() {
    Animated.spring(buttonScale, {toValue: 1, useNativeDriver: true, speed: 30, bounciness: 5}).start();
  }

  async function handleSignUp() {
    setError(null);
    setSuccessMsg(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await signUp(email.trim(), password);
      if (result.error) {
        setError(result.error.message);
      } else {
        if (referralCode.trim() && result.data?.user) {
          await supabase
            .from('profiles')
            .update({referred_by: referralCode.trim().toUpperCase()})
            .eq('id', result.data.user.id);
        }
        setSuccessMsg('Account created! Check your email to confirm your address, then sign in.');
        setEmail('');
        setPassword('');
        setReferralCode('');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.card, error && styles.cardError]}>
      <LinearGradient
        colors={['#0d2525', '#0a1a35', '#06091e']}
        locations={[0, 0.60, 1]}
        start={{x: 1, y: 1}}
        end={{x: 0, y: 0}}
        style={styles.cardGradient}
      />
      <Text style={styles.cardTitle}>Create account</Text>
      {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.label}>Email</Text>
      <View style={[styles.inputWrapper, focused === 'email' && styles.inputWrapperFocused]}>
        <Mail size={18} color={focused === 'email' ? '#6366f1' : '#94a3b8'} style={styles.inputIcon} />
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
          onFocus={() => setFocused('email')}
          onBlur={() => setFocused(null)}
        />
      </View>

      <Text style={styles.label}>Password</Text>
      <View style={[styles.inputWrapper, focused === 'password' && styles.inputWrapperFocused]}>
        <LockKeyhole size={18} color={focused === 'password' ? '#6366f1' : '#94a3b8'} style={styles.inputIcon} />
        <TextInput
          style={styles.inputField}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          placeholderTextColor="#64748b"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          editable={!loading}
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused(null)}
        />
        <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          {showPassword
            ? <EyeOff size={18} color="#64748b" />
            : <Eye size={18} color="#64748b" />}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Referral Code (optional)</Text>
      <TextInput
        style={styles.input}
        value={referralCode}
        onChangeText={setReferralCode}
        placeholder="e.g. ABCD12"
        placeholderTextColor="#64748b"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        editable={!loading}
      />

      <Animated.View style={{transform: [{scale: buttonScale}]}}>
        <Pressable
          onPress={handleSignUp}
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
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </Pressable>
      </Animated.View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleText}>{'Already have an account? '}</Text>
        <Pressable onPress={onSwitch} disabled={loading}>
          {({pressed}) => (
            <Text style={[styles.toggleLink, pressed && styles.linkUnderline]}>Sign in</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Forgot Password Card ─────────────────────────────────────────────────────

function ForgotPasswordCard({onBack}: {onBack: () => void}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
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
      if (e) setError(e.message);
      else setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
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
        <Text style={styles.successText}>
          Check your inbox! A reset link has been sent to {email.trim()}.
        </Text>
      ) : (
        <>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
            <Mail size={18} color={emailFocused ? '#6366f1' : '#94a3b8'} style={styles.inputIcon} />
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
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
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

      <Pressable onPress={onBack} style={styles.toggleRow}>
        {({pressed}) => (
          <>
            <ArrowLeft size={13} color="#3B82F6" style={styles.backIcon} />
            <Text style={[styles.toggleLink, pressed && styles.linkUnderline]}>Back to sign in</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'forgotPassword'>('signIn');
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const easeIn = Easing.out(Easing.ease);
  const easeOut = Easing.inOut(Easing.ease);

  function switchMode(next: 'signIn' | 'signUp' | 'forgotPassword') {
    const isPasswordAnimation = next === 'forgotPassword' || mode === 'forgotPassword';

    if (isPasswordAnimation) {

      if (next === 'forgotPassword') {
        Animated.parallel([
          Animated.timing(opacity, {toValue: 0, duration: 180, easing: easeOut, useNativeDriver: true}),
          Animated.timing(scale, {toValue: 0.95, duration: 180, easing: easeOut, useNativeDriver: true}),
        ]).start(() => {
          setMode(next);
          translateX.setValue(16);
          scale.setValue(1);
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(opacity, {toValue: 1, duration: 220, easing: easeIn, useNativeDriver: true}),
              Animated.timing(translateX, {toValue: 0, duration: 220, easing: easeIn, useNativeDriver: true}),
            ]).start();
          }, 160);
        });
      }
      else {
        Animated.parallel([
          Animated.timing(opacity, {toValue: 0, duration: 220, easing: easeIn, useNativeDriver: true}),
          Animated.timing(translateX, {toValue: 16, duration: 220, easing: easeIn, useNativeDriver: true}),
        ]).start(() => {
          setMode(next);
          translateX.setValue(1);
          scale.setValue(0.95);
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(opacity, {toValue: 1, duration: 180, easing: easeOut, useNativeDriver: true}),
              Animated.timing(translateX, {toValue: 0, duration: 180, easing: easeOut, useNativeDriver: true}),
              Animated.timing(scale, {toValue: 1, duration: 180, easing: easeOut, useNativeDriver: true}),
            ]).start();
          }, 160);
        });
      }
    } else {
      if (next === 'signUp') {
        Animated.parallel([
          Animated.timing(opacity, {toValue: 0, duration: 180, easing: easeOut, useNativeDriver: true}),
          Animated.timing(scale, {toValue: 0.95, duration: 180, easing: easeOut, useNativeDriver: true}),
        ]).start(() => {
          setMode(next);
          translateY.setValue(16);
          scale.setValue(1);
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(opacity, {toValue: 1, duration: 220, easing: easeIn, useNativeDriver: true}),
              Animated.timing(translateY, {toValue: 0, duration: 220, easing: easeIn, useNativeDriver: true}),
            ]).start();
          }, 160);
        });
      } else {
        Animated.parallel([
          Animated.timing(opacity, {toValue: 0, duration: 220, easing: easeIn, useNativeDriver: true}),
          Animated.timing(translateY, {toValue: 16, duration: 220, easing: easeIn, useNativeDriver: true}),
        ]).start(() => {
          setMode(next);
          translateY.setValue(1);
          scale.setValue(0.95);
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(opacity, {toValue: 1, duration: 180, easing: easeOut, useNativeDriver: true}),
              Animated.timing(translateY, {toValue: 0, duration: 180, easing: easeOut, useNativeDriver: true}),
              Animated.timing(scale, {toValue: 1, duration: 180, easing: easeOut, useNativeDriver: true}),
            ]).start();
          }, 220);
        });
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'height' : undefined}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/rgc-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Your entire collection,{'\n'}Everywhere you go.</Text>
      </View>

      <Animated.View style={[styles.cardContainer, {opacity, transform: [{translateX}, {translateY}, {scale}]}]}>
        {mode === 'signIn' ? (
          <SignInCard
            onSwitch={() => switchMode('signUp')}
            onForgotPassword={() => switchMode('forgotPassword')}
          />
        ) : mode === 'signUp' ? (
          <SignUpCard onSwitch={() => switchMode('signIn')} />
        ) : (
          <ForgotPasswordCard onBack={() => switchMode('signIn')} />
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  cardContainer: {
    paddingHorizontal: 24,
  },
  logo: {
    width: 252,
    height: 112,
    marginTop: 8,
  },
  subtitle: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 30,
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
  cardSpacer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#f1f5f9',
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  inputWrapperFocused: {
    borderColor: '#6366f1',
  },
  inputIcon: {
    marginRight: 10,
  },
  eyeBtn: {
    paddingLeft: 8,
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
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -8,
    paddingVertical: 6,
    marginBottom: 16,
  },
  forgotLink: {
    fontSize: 13,
    color: '#3B82F6',
  },
  cardDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 24,
    marginTop: -20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  toggleText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  toggleLink: {
    fontSize: 13,
    color: '#3B82F6',
  },
  linkUnderline: {
    textDecorationLine: 'underline',
  },
  backIcon: {
    marginRight: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  successText: {
    color: '#4ade80',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
});
