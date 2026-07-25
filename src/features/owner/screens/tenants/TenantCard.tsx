import React from "react";
import { View, Text, Image, Animated, useWindowDimensions } from "react-native";
import { Card } from "../../../../components/Card";
import { AnimatedPressableCard } from "../../../../components/AnimatedPressableCard";
import { Theme } from "../../../../theme";
import { Ionicons } from "@expo/vector-icons";
import { Tenant } from "../../api";
import { TourStep } from "../../../../context/OnboardingTourContext";

interface TenantCardProps {
  tenant: Tenant;
  index: number;
  onPress: (tenantId: number) => void;
  tourStep?: TourStep;
  advanceTour?: () => void;
  tenantPulse: Animated.Value;
}

export const TenantCard: React.FC<TenantCardProps> = ({
  tenant,
  index,
  onPress,
  tourStep,
  advanceTour,
  tenantPulse,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 380;
  const isTablet = screenWidth >= 768;

  const avatarSize = isTablet ? 52 : isSmallScreen ? 40 : 44;
  const nameFontSize = isTablet ? 17 : isSmallScreen ? 14 : 15;
  const infoFontSize = isTablet ? 13 : isSmallScreen ? 11 : 12;
  const badgeFontSize = isTablet ? 12 : isSmallScreen ? 10 : 11;
  const badgeGap = isTablet ? 9 : 7;
  const cardPadding = isTablet ? 16 : isSmallScreen ? 10 : 12;

  const tenantImage =
    tenant.images && Array.isArray(tenant.images) && tenant.images.length > 0
      ? tenant.images[0]
      : null;

  const isRentPaid = tenant.is_rent_paid || false;
  const isRentPartial = tenant.is_rent_partial || false;
  const rentDueAmount = tenant.rent_due_amount || 0;
  const isAdvancePaid = tenant.is_advance_paid || false;
  const hasRefundPayments =
    tenant.refund_payments &&
    Array.isArray(tenant.refund_payments) &&
    tenant.refund_payments.length > 0;
  const unpaidMonths = (tenant as any).unpaid_months || [];
  const hasOutstandingAmount = rentDueAmount > 0;
  const hasPendingRent =
    (tenant.pending_due_amount || 0) > 0 ||
    (Array.isArray(unpaidMonths) && unpaidMonths.length > 0);

  const statusColor =
    tenant.status === "ACTIVE"
      ? "#10B981"
      : tenant.status === "CHECKED_OUT"
      ? "#F59E0B"
      : "#EF4444";

  const isTourTarget = tourStep === "tap_tenant" && index === 0;

  const handlePress = () => {
    if (isTourTarget && advanceTour) advanceTour();
    onPress(tenant.s_no);
  };

  return (
    <AnimatedPressableCard
      onPress={handlePress}
      scaleValue={0.97}
      duration={120}
      style={{ marginBottom: 10 }}
    >
      <Card
        style={{
          padding: cardPadding,
          borderLeftWidth: hasOutstandingAmount ? 3 : 0,
          borderLeftColor: isRentPartial ? "#F97316" : "#F59E0B",
        }}
      >
        {/* Row 1: Avatar + Name/Room/Rent + Status */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* Avatar */}
          <View
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: Theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {tenantImage ? (
              <Image
                source={{ uri: tenantImage }}
                style={{ width: avatarSize, height: avatarSize }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ color: "#fff", fontSize: avatarSize * 0.4, fontWeight: "bold" }}>
                {tenant.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Name + Room/Bed/Rent */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontSize: nameFontSize,
                fontWeight: "700",
                color: Theme.colors.text.primary,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {tenant.name}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: isSmallScreen ? 8 : 10,
                marginTop: 3,
                flexWrap: "wrap",
              }}
            >
              {tenant.rooms && (
                <Text
                  style={{
                    fontSize: infoFontSize,
                    color: Theme.colors.text.secondary,
                    fontWeight: "500",
                  }}
                  numberOfLines={1}
                >
                  🏠 {tenant.rooms.room_no}
                </Text>
              )}
              {tenant.beds && (
                <Text
                  style={{
                    fontSize: infoFontSize,
                    color: Theme.colors.text.secondary,
                    fontWeight: "500",
                  }}
                  numberOfLines={1}
                >
                  🛏️ {tenant.beds.bed_no}
                </Text>
              )}
              {tenant.rooms?.rent_price && (
                <Text
                  style={{
                    fontSize: infoFontSize,
                    color: Theme.colors.primary,
                    fontWeight: "600",
                  }}
                  numberOfLines={1}
                >
                  ₹{tenant.rooms.rent_price}/mo
                </Text>
              )}
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={{
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: `${statusColor}20`,
            }}
          >
            <Text
              style={{
                fontSize: badgeFontSize,
                fontWeight: "700",
                color: statusColor,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {tenant.status}
            </Text>
          </View>
        </View>

        {/* Row 2: Payment Badges */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: badgeGap,
            marginTop: 12,
          }}
        >
          {isRentPaid && (
            <Badge color="#10B981" text="✅ Rent Paid" fontSize={badgeFontSize} />
          )}
          {isAdvancePaid && (
            <Badge color="#10B981" text="✅ Advance Paid" fontSize={badgeFontSize} />
          )}
          {hasRefundPayments && (
            <Badge color={Theme.colors.warning} text="💰 Refund Paid" fontSize={badgeFontSize} />
          )}
          {isRentPartial && (
            <Badge color="#F97316" text="⏳ Partial Payment" fontSize={badgeFontSize} />
          )}
          {hasPendingRent && (
            <Badge color="#F59E0B" text="📅 Pending Rent" fontSize={badgeFontSize} />
          )}
          {hasOutstandingAmount && (
            <Badge color="#EF4444" text={`₹${rentDueAmount} Due`} fontSize={badgeFontSize} />
          )}
          {!isAdvancePaid && (
            <Badge color="#F59E0B" text="💰 No Advance" fontSize={badgeFontSize} />
          )}
        </View>

        {/* Row 3: Check-in Date */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Text
            style={{
              fontSize: infoFontSize,
              color: Theme.colors.text.tertiary,
            }}
            numberOfLines={1}
          >
            📅 Check-in: {new Date(tenant.check_in_date).toLocaleDateString()}
          </Text>
        </View>

        {/* Tour hint overlay */}
        {isTourTarget && (
          <View
            style={{
              position: "absolute",
              top: -28,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#1E3A8A",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons name="finger-print" size={11} color="#fff" />
              <Text
                style={{ fontSize: 10, fontWeight: "800", color: "#fff" }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                Tap to open tenant
              </Text>
            </View>
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 5,
                borderRightWidth: 5,
                borderTopWidth: 6,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#1E3A8A",
              }}
            />
          </View>
        )}
      </Card>
    </AnimatedPressableCard>
  );
};

const Badge: React.FC<{ color: string; text: string; fontSize: number }> = ({ color, text, fontSize }) => (
  <View
    style={{
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: color,
    }}
  >
    <Text
      style={{
        fontSize,
        fontWeight: "700",
        color: "#fff",
      }}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.85}
    >
      {text}
    </Text>
  </View>
);
