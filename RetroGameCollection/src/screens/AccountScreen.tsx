import React, {useState, useRef, useEffect} from 'react';
import {LogOut, Pencil, Camera, Check} from 'lucide-react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  Share,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../hooks/useAuth';
import {
  useProfile,
  useUpdateUsername,
  useUploadAvatar,
  useReferralCount,
} from '../api/profile';
import {useProStatus} from '../hooks/useProStatus';
import {restorePurchases, getSubscriptionDetails} from '../lib/purchases';
import type {SubscriptionDetails} from '../lib/purchases';
import {Toast} from '../components/common/AppToast';
import ScreenLogo from '../components/common/ScreenLogo';
import GradientText from '../components/common/GradientText';
import {Fonts} from '../constants/fonts';
import type {RootStackParamList} from '../navigation/AppNavigator';

function Card({children}: {children: React.ReactNode}) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#0d2525', '#0a1a35', '#06091e']}
        locations={[0, 0.60, 1]}
        start={{x: 1, y: 1}}
        end={{x: 0, y: 0}}
        style={styles.cardGradient}
      />
      {children}
    </View>
  );
}

function InitialsAvatar({name, size}: {name: string; size: number}) {
  const initials = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.avatarCircle, {width: size, height: size, borderRadius: size / 2}]}>
      <Text style={[styles.avatarInitials, {fontSize: size * 0.4}]}>{initials}</Text>
    </View>
  );
}

export default function AccountScreen() {
  const {session, signOut} = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {data: profile, isLoading: profileLoading} = useProfile();
  const {data: referralCount} = useReferralCount();
  const {isPro, refresh: refreshProStatus} = useProStatus();
  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);

  useEffect(() => {
    if (isPro) {
      getSubscriptionDetails().then(setSubDetails);
    }
  }, [isPro]);
  const updateUsername = useUpdateUsername();
  const uploadAvatar = useUploadAvatar();

  const email = session?.user?.email ?? '';

  const [isEditing, setIsEditing] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const inputRef = useRef<TextInput>(null);

  function startEditing() {
    setDraftUsername(profile?.username ?? '');
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraftUsername('');
  }

  async function saveProfile() {
    if (draftUsername.trim() === (profile?.username ?? '')) {
      setIsEditing(false);
      return;
    }
    await updateUsername.mutateAsync(draftUsername.trim());
    setIsEditing(false);
  }

  async function handleAvatarPress() {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 512,
      maxHeight: 512,
    });
    if (result.assets?.[0]?.uri) {
      await uploadAvatar.mutateAsync(result.assets[0].uri);
    }
  }

  async function handleRestore() {
    try {
      const isNowPro = await restorePurchases();
      if (isNowPro) {
        refreshProStatus();
        Toast.show({type: 'success', text1: 'Purchases restored!'});
      } else {
        Toast.show({type: 'error', text1: 'Nothing to restore', text2: 'No active Pro subscription found'});
      }
    } catch {
      Toast.show({type: 'error', text1: 'Restore failed', text2: 'Please try again'});
    }
  }

  async function handleShare() {
    const code = profile?.referral_code ?? '';
    await Share.share({
      message: `Join me on RetroGameCollection! Use my code ${code} when you sign up 🎮`,
    });
  }

  const displayName = profile?.username || email.split('@')[0] || 'Collector';
  const avatarSize = 64;
  const isAvatarUploading = uploadAvatar.isPending;
  const isSaving = updateUsername.isPending;

  if (profileLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.pageHeader}>
        <ScreenLogo />
        <Text style={styles.pageTitle}>Account</Text>
      </View>

      {/* ── Profile card ── */}
      <Card>
        <View style={styles.profileRow}>
          <TouchableOpacity
            onPress={isEditing ? handleAvatarPress : undefined}
            disabled={!isEditing || isAvatarUploading}
            activeOpacity={isEditing ? 0.7 : 1}
            style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
              <Image
                source={{uri: profile.avatar_url}}
                style={[styles.avatarImg, {width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2}]}
              />
            ) : (
              <InitialsAvatar name={displayName} size={avatarSize} />
            )}
            {isEditing && (
              <View style={[styles.avatarOverlay, {borderRadius: avatarSize / 2}]}>
                {isAvatarUploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Camera size={22} color="#ffffff" />
                )}
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            {isEditing ? (
              <TextInput
                ref={inputRef}
                style={styles.usernameInput}
                value={draftUsername}
                onChangeText={setDraftUsername}
                placeholder="Username"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            ) : (
              <Text style={styles.username}>{displayName}</Text>
            )}
            <Text style={styles.email} numberOfLines={1}>{email}</Text>
          </View>

          {!isEditing && (
            <TouchableOpacity
              onPress={startEditing}
              style={styles.editBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Pencil size={16} color="rgba(99, 160, 255, 0.85)" />
            </TouchableOpacity>
          )}
        </View>

        {isEditing && (
          <View style={styles.editActions}>
            <Pressable
              style={({pressed}) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
              onPress={cancelEditing}
              disabled={isSaving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({pressed}) => [
                styles.saveBtn,
                isSaving && styles.saveBtnDisabled,
                pressed && !isSaving && styles.shareBtnPressed,
              ]}
              onPress={saveProfile}
              disabled={isSaving}>
              <LinearGradient
                colors={['#FF1B8D', '#A855F7', '#5B45DC']}
                locations={[0, 0.65, 1]}
                start={{x: 0.3, y: 0}}
                end={{x: 0.4, y: 1}}
                style={styles.shareBtnGradient}
              />
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </Pressable>
          </View>
        )}
      </Card>

      {/* ── Refer a friend ── */}
      <Text style={styles.sectionLabel}>Refer a friend</Text>
      <Card>
        {profile?.referral_code ? (
          <>
            <Text style={styles.referSubtitle}>
              You and your friend each get a bonus console (6 instead of 5) when they sign up with your code.
            </Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Your code</Text>
              <GradientText style={styles.codeValue}>{profile.referral_code}</GradientText>
            </View>
            {referralCount != null && referralCount > 0 && (
              <Text style={styles.referCount}>
                {referralCount} {referralCount === 1 ? 'friend' : 'friends'} joined with your code
              </Text>
            )}
            <Pressable
              style={({pressed}) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
              onPress={handleShare}>
              <LinearGradient
                colors={['#FF1B8D', '#A855F7', '#5B45DC']}
                locations={[0, 0.65, 1]}
                start={{x: 0.3, y: 0}}
                end={{x: 0.4, y: 1}}
                style={styles.shareBtnGradient}
              />
              <Text style={styles.shareBtnText}>Share Invite</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.referSubtitle}>Referral code generating…</Text>
        )}
      </Card>

      {/* ── Subscription ── */}
      <Text style={styles.sectionLabel}>Subscription</Text>
      <Card>
        {isPro ? (
          <>
            <View style={styles.proRow}>
              <Check size={16} color="#4ade80" />
              <Text style={styles.proLabel}>RGC Pro — Active</Text>
            </View>
            {subDetails && (
              <Text style={styles.subDetailText}>
                {subDetails.plan === 'lifetime'
                  ? 'Lifetime access'
                  : subDetails.plan === 'annual'
                    ? `Annual${subDetails.expiresAt ? ` · renews ${subDetails.expiresAt.toLocaleDateString()}` : ''}`
                    : `Monthly${subDetails.expiresAt ? ` · renews ${subDetails.expiresAt.toLocaleDateString()}` : ''}`}
              </Text>
            )}
          </>
        ) : (
          <Pressable
            style={({pressed}) => [styles.shareBtn, {marginBottom: 12}, pressed && styles.shareBtnPressed]}
            onPress={() => navigation.navigate('Paywall', {reason: 'upgrade'})}>
            <LinearGradient
              colors={['#FF1B8D', '#A855F7', '#5B45DC']}
              locations={[0, 0.65, 1]}
              start={{x: 0.3, y: 0}}
              end={{x: 0.4, y: 1}}
              style={styles.shareBtnGradient}
            />
            <Text style={styles.shareBtnText}>Upgrade to Pro →</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleRestore}
          style={[styles.restoreRow, {alignItems: isPro ? 'flex-start' : 'center'}]}>
          {({pressed}) => (
            <Text style={[styles.restoreLink, pressed && styles.linkUnderline]}>Restore Purchases</Text>
          )}
        </Pressable>
      </Card>

      {/* ── App ── */}
      <Text style={styles.sectionLabel}>App</Text>
      <Card>
        <Pressable style={styles.signOutRow} onPress={() => signOut()}>
          {({pressed}) => (
            <>
              <LogOut size={18} color={pressed ? '#f87171' : '#ef4444'} style={{marginRight: 8}} />
              <Text style={[styles.signOutText, {color: pressed ? '#f87171' : '#ef4444'}]}>Sign Out</Text>
            </>
          )}
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pageHeader: {
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  pageTitle: {
    fontSize: 21,
    lineHeight: 40,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#ffffff',
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    overflow: 'hidden',
    padding: 16,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: '700',
  },
  avatarImg: {
    backgroundColor: '#1e293b',
  },
  avatarOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  username: {
    fontSize: 17,
    fontFamily: Fonts.display,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#ffffff',
  },
  usernameInput: {
    fontSize: 15,
    color: '#f1f5f9',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  email: {
    fontSize: 13,
    color: '#94a3b8',
  },
  editBtn: {
    padding: 4,
  },

  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnPressed: {
    opacity: 0.85,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  saveBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  referSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 14,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  codeLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(99, 160, 255, 0.95)',
    letterSpacing: 3,
  },
  referCount: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 12,
  },
  shareBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shareBtnGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shareBtnPressed: {
    opacity: 0.85,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  proLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ade80',
  },
  restoreRow: {
    marginTop: 12,
  },
  restoreLink: {
    fontSize: 13,
    color: '#3B82F6',
  },
  linkUnderline: {
    textDecorationLine: 'underline',
  },
  subDetailText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 0,
  },

  signOutRow: {
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
});
