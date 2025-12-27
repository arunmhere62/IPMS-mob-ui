import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Theme } from '../../theme';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import {
  type LegalAcceptanceContext,
  type RequiredLegalDocument,
  useAcceptLegalDocumentMutation,
} from '../../services/api/legalDocumentsApi';
import { useSignupMutation } from '../../services/api/authApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { navigationRef } from '../../navigation/navigationRef';

type LegalDocumentsScreenParams = {
  context: LegalAcceptanceContext;
  pending: RequiredLegalDocument[];
  signupData?: any;
};

interface LegalDocumentsScreenProps {
  navigation: any;
  route: { params: LegalDocumentsScreenParams };
}

export const LegalDocumentsScreen: React.FC<LegalDocumentsScreenProps> = ({ navigation, route }) => {
  const { context, pending, signupData } = route.params;

  const [acceptLegalDocument] = useAcceptLegalDocumentMutation();
  const [signup] = useSignupMutation();

  const [acceptedIds, setAcceptedIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const docs = useMemo(() => (Array.isArray(pending) ? pending : []), [pending]);

  const allAccepted = useMemo(() => {
    if (docs.length === 0) return true;
    return docs.every((d) => {
      const s_no = Number((d as any).s_no);
      if (!Number.isFinite(s_no) || s_no <= 0) return false;
      return acceptedIds.has(s_no);
    });
  }, [docs, acceptedIds]);

  const openDoc = async (doc: RequiredLegalDocument) => {
    const url = doc.url || doc.content_url;
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Unable to open document link');
    }
  };

  const handleAcceptAll = async () => {
    if (!docs.length) {
      return;
    }

    setSubmitting(true);
    try {
      let explicitUserId: number | undefined;

      // For SIGNUP flow, a user does not exist yet. Acceptance must be recorded
      // against a real user_id, so we first create the account and then accept.
      if (context === 'SIGNUP' && signupData) {
        const signupResult: any = await signup(signupData).unwrap();
        const rawUserId = signupResult?.userId ?? signupResult?.user_id ?? signupResult?.s_no;
        const parsedUserId = Number(rawUserId);
        if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
          throw new Error('Signup succeeded but user id was not returned');
        }
        explicitUserId = parsedUserId;
      }

      for (const doc of docs) {
        const s_no = Number((doc as any).s_no);
        if (!Number.isFinite(s_no) || s_no <= 0 || acceptedIds.has(s_no)) continue;

        await acceptLegalDocument({ s_no, acceptance_context: context, user_id: explicitUserId }).unwrap();
        setAcceptedIds((prev) => {
          const next = new Set(prev);
          next.add(s_no);
          return next;
        });
      }

      showSuccessAlert('Accepted successfully');

      if (context === 'SIGNUP' && signupData) {
        Alert.alert(
          'Success',
          'Account created successfully! Please wait for admin approval.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
        return;
      }

      const nav = navigationRef.current;
      if (nav && typeof nav.resetRoot === 'function') {
        nav.resetRoot({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else if (nav && typeof nav.reset === 'function') {
        nav.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        navigation.navigate('MainTabs');
      }
    } catch (e: any) {
      showErrorAlert(e, 'Failed to accept documents');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout contentBackgroundColor={'#F5F7FA'}>
      <ScreenHeader
        title={'Legal Documents'}
        subtitle={'Please review and accept to continue'}
        showBackButton={false}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Card>
          <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginBottom: 12 }}>
            You must accept the latest required legal documents before continuing.
          </Text>

          {docs.map((doc) => {
            const s_no = Number((doc as any).s_no);
            const key = Number.isFinite(s_no) && s_no > 0
              ? String(s_no)
              : `${String(doc.title || doc.name || 'doc')}-${String(doc.version || '')}`;
            const title = (doc.title || doc.name || `Document #${s_no}`).toString();
            const accepted = acceptedIds.has(s_no);
            const hasUrl = Boolean(doc.url || doc.content_url);

            return (
              <View
                key={key}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: Theme.withOpacity(Theme.colors.border, 0.35),
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.text.primary }}>
                      {title}
                    </Text>
                    {doc.version ? (
                      <Text style={{ marginTop: 2, fontSize: 12, color: Theme.colors.text.secondary }}>
                        Version: {doc.version}
                      </Text>
                    ) : null}
                    {hasUrl ? (
                      <TouchableOpacity onPress={() => openDoc(doc)} style={{ marginTop: 6 }}>
                        <Text style={{ color: Theme.colors.primary, fontWeight: '600' }}>View document</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: accepted ? '#059669' : Theme.colors.text.secondary,
                    }}>
                      {accepted ? 'Accepted' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={{ marginTop: 16 }}>
            <Button
              title={allAccepted ? 'Continue' : 'Accept & Continue'}
              onPress={handleAcceptAll}
              loading={submitting}
              disabled={submitting || docs.length === 0}
              variant="primary"
              size="md"
            />
          </View>
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
};
