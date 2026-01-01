import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedPressableCard } from "../../../components/AnimatedPressableCard";
import { ActionButtons } from "../../../components/ActionButtons";
import { ActionTile } from "../../../components/ActionButtons";
import { Tenant } from "@/services/api/tenantsApi";
import { Theme } from "../../../theme";

interface TenantHeaderProps {
  tenant: Tenant;
  onEdit: () => void;
  showEdit?: boolean;
  onCall: (phone: string) => void;
  onWhatsApp: (phone: string) => void;
  onEmail: (email: string) => void;
  onAddPayment: () => void;
  onAddAdvance: () => void;
  onAddRefund: () => void;
  onAddCurrentBill?: () => void;
  canAddPayment?: boolean;
  canAddAdvance?: boolean;
  canAddRefund?: boolean;
}

export const TenantHeader: React.FC<TenantHeaderProps> = ({
  tenant,
  onEdit,
  showEdit = true,
  onCall,
  onWhatsApp,
  onEmail,
  onAddPayment,
  onAddAdvance,
  onAddRefund,
  onAddCurrentBill,
  canAddPayment = true,
  canAddAdvance = true,
  canAddRefund = true,
}) => {
  const tenantImage =
    tenant.images && tenant.images.length > 0 ? tenant.images[0] : null;

  return (
    <View style={styles.card}>
      {/* Edit button */}
      <View style={styles.editButton}>
        <ActionButtons
          onEdit={onEdit}
          showEdit={true}
          disableEdit={!showEdit}
          blockPressWhenDisabled={true}
          showView={false}
          showDelete={false}
          containerStyle={{ backgroundColor: "transparent", padding: 0 }}
        />
      </View>

      {/* Profile Image */}
      <View style={styles.avatarWrapper}>
        {tenantImage ? (
          <Image
            source={{ uri: tenantImage }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.avatarFallback}>
            {tenant.name?.charAt(0)?.toUpperCase()}
          </Text>
        )}
      </View>

      {/* Name */}
      <Text style={styles.name}>{tenant.name}</Text>

      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          tenant.status === "ACTIVE"
            ? styles.statusActive
            : styles.statusInactive,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            tenant.status === "ACTIVE"
              ? { color: "#16A34A" }
              : { color: "#DC2626" },
          ]}
        >
          {tenant.status}
        </Text>
      </View>

      {/* Contact Buttons */}
      <View style={styles.contactRow}>
        {!!tenant.phone_no && (
          <AnimatedPressableCard
            onPress={() => onCall(tenant.phone_no || '')}
            scaleValue={0.95}
            duration={100}
            style={styles.contactButton}
          >
            <Ionicons name="call" size={16} color="#333" />
            <Text style={styles.contactText}>Call</Text>
          </AnimatedPressableCard>
        )}

        {!!tenant.whatsapp_number && (
          <AnimatedPressableCard
            onPress={() => onWhatsApp(tenant.whatsapp_number || '')}
            scaleValue={0.95}
            duration={100}
            style={styles.contactButton}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#333" />
            <Text style={styles.contactText}>WhatsApp</Text>
          </AnimatedPressableCard>
        )}
      </View>

      {/* Email */}
      {!!tenant.email && (
        <AnimatedPressableCard
          onPress={() => onEmail(tenant.email || '')}
          scaleValue={0.95}
          duration={100}
          style={{ width: "100%" }}
        >
          <View style={styles.emailButton}>
            <Ionicons name="mail" size={16} color="#333" />
            <Text style={styles.contactText}>Email</Text>
          </View>
        </AnimatedPressableCard>
      )}

      {/* Action Buttons */}
      <View style={styles.actionGrid}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <ActionTile title="Add Rent" icon="wallet" onPress={onAddPayment} disabled={!canAddPayment} />
          <ActionTile title="Add Advance" icon="trending-up" onPress={onAddAdvance} disabled={!canAddAdvance} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ActionTile title="Add Refund" icon="trending-down" onPress={onAddRefund} disabled={!canAddRefund} />
          {!!onAddCurrentBill ? (
            <ActionTile title="Add Bill" icon="document-text" onPress={onAddCurrentBill} />
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 22,
    borderRadius: 18,
    backgroundColor: Theme.colors.card.background,
    shadowColor: Theme.colors.card.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
    position: "relative",
  },

  editButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },

  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Theme.colors.background.tertiary,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Theme.colors.border,
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  avatarFallback: {
    fontSize: 40,
    fontWeight: "700",
    color: Theme.colors.text.secondary,
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.text.primary,
    marginBottom: 6,
  },

  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
  },

  statusActive: {
    backgroundColor: Theme.withOpacity(Theme.colors.secondary, 0.12),
    borderColor: Theme.withOpacity(Theme.colors.secondary, 0.35),
  },

  statusInactive: {
    backgroundColor: Theme.withOpacity(Theme.colors.danger, 0.12),
    borderColor: Theme.withOpacity(Theme.colors.danger, 0.35),
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  contactRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 16,
  },

  contactButton: {
    flex: 1,
    backgroundColor: Theme.colors.background.secondary,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  emailButton: {
    backgroundColor: Theme.colors.background.secondary,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  contactText: {
    marginLeft: 6,
    color: Theme.colors.text.primary,
    fontSize: 13,
    fontWeight: "600",
  },

  actionGrid: {
    width: "100%",
    flexDirection: "column",
  },
});
