import React, {useState, useRef, useEffect} from 'react';
import {LogOut} from 'lucide-react-native';
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
import type {RootStackParamList} from '../navigation/AppNavigator';

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

  // Edit mode state
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
        Toast.show({type: 'success', text1: 'Purchases restored!', visibilityTime: 3000});
      } else {
        Toast.show({type: 'error', text1: 'Nothing to restore', text2: 'No active Pro subscription found', visibilityTime: 3000});
      }
    } catch {
      Toast.show({type: 'error', text1: 'Restore failed', text2: 'Please try again', visibilityTime: 3000});
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

      {/* ── Profile card ── */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          {/* Avatar */}
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
            {/* Edit overlay */}
            {isEditing && (
              <View style={[styles.avatarOverlay, {borderRadius: avatarSize / 2}]}>
                {isAvatarUploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.avatarOverlayIcon}>＋</Text>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Name + email */}
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

          {/* Edit / pencil icon (view mode only) */}
          {!isEditing && (
            <TouchableOpacity onPress={startEditing} style={styles.editBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Save / Cancel (edit mode only) */}
        {isEditing && (
          <View style={styles.editActions}>
            <Pressable
              style={({pressed}) => [styles.cancelBtn, pressed && {backgroundColor: '#1e293b'}]}
              onPress={cancelEditing}
              disabled={isSaving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({pressed}) => [styles.saveBtn, isSaving && styles.saveBtnDisabled, pressed && !isSaving && {backgroundColor: '#818cf8'}]}
              onPress={saveProfile}
              disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Refer a friend ── */}
      <Text style={styles.sectionLabel}>REFER A FRIEND</Text>
      <View style={styles.card}>
        {profile?.referral_code ? (
          <>
            <Text style={styles.referSubtitle}>Share your code and grow the community</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Your code</Text>
              <Text style={styles.codeValue}>{profile.referral_code}</Text>
            </View>
            {referralCount != null && referralCount > 0 && (
              <Text style={styles.referCount}>
                {referralCount} {referralCount === 1 ? 'friend' : 'friends'} joined with your code
              </Text>
            )}
            <Pressable style={({pressed}) => [styles.shareBtn, pressed && {backgroundColor: '#818cf8'}]} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share Invite</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.referSubtitle}>Referral code generating…</Text>
        )}
      </View>

      {/* ── Subscription ── */}
      <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
      <View style={styles.card}>
        {isPro ? (
          <>
            <Text style={[styles.referSubtitle, {color: '#4ade80', marginBottom: 4}]}>RGC Pro — Active ✓</Text>
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
            style={({pressed}) => [styles.shareBtn, {marginBottom: 12}, pressed && {backgroundColor: '#818cf8'}]}
            onPress={() => navigation.navigate('Paywall', {reason: 'upgrade'})}>
            <Text style={styles.shareBtnText}>Upgrade to Pro →</Text>
          </Pressable>
        )}
        <Pressable onPress={handleRestore} style={{marginTop: 12, alignItems: isPro ? 'flex-start' : 'center', paddingVertical: 4}}>
          {({pressed}) => (
            <Text style={[styles.restoreLink, {color: pressed ? '#818cf8' : '#6366f1'}]}>Restore Purchases</Text>
          )}
        </Pressable>
      </View>

      {/* ── App ── */}
      <Text style={styles.sectionLabel}>APP</Text>
      <View style={styles.card}>
        <Pressable style={styles.signOutRow} onPress={() => signOut()}>
          {({pressed}) => (
            <>
              <LogOut size={18} color={pressed ? '#f87171' : '#ef4444'} style={{marginRight: 8}} />
              <Text style={[styles.signOutText, {color: pressed ? '#f87171' : '#ef4444'}]}>Sign Out</Text>
            </>
          )}
        </Pressable>
      </View>

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

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
  },

  // Profile row
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlayIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  username: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  usernameInput: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f1f5f9',
    backgroundColor: '#0A0A0F',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  email: {
    fontSize: 13,
    color: '#64748b',
  },
  editBtn: {
    padding: 4,
  },
  editIcon: {
    fontSize: 16,
  },

  // Edit actions
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Referral
  referSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0A0F',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  codeLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 3,
  },
  referCount: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  shareBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  restoreLink: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 14,
  },
  subDetailText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 0,
  },

  // Sign out
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
