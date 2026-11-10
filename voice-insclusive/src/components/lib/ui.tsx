import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { C } from './theme';

export const Btn = ({ label, onPress, kind = 'primary', style, disabled }: { label: string; onPress: () => void; kind?: 'primary' | 'accent' | 'soft'; style?: ViewStyle; disabled?: boolean }) => (
  <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.btn, kind === 'primary' && { backgroundColor: C.primary }, kind === 'accent' && { backgroundColor: C.secondaryC }, kind === 'soft' && { backgroundColor: C.primaryFixed }, pressed && { opacity: 0.85 }, disabled && { opacity: 0.4 }, style]}>
    <Text style={[s.btnT, kind === 'accent' && { color: C.onSecondaryC }, kind === 'soft' && { color: C.onPrimaryFixed }]}>{label}</Text>
  </Pressable>
);
export const Card = ({ children, style }: any) => <View style={[s.card, style]}>{children}</View>;
export const H = ({ children }: any) => <Text accessibilityRole="header" style={s.h}>{children}</Text>;
export const Chip = ({ label, on, onPress }: any) => (
  <Pressable accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={onPress} style={[s.chip, on && { backgroundColor: C.primary }]}>
    <Text style={[s.chipT, on && { color: '#fff' }]}>{label}</Text>
  </Pressable>
);
const s = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 16 },
  card: { backgroundColor: C.card, borderRadius: 12, padding: 16, gap: 10 },
  h: { fontSize: 20, fontWeight: '600', color: C.text },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 8, backgroundColor: C.container, justifyContent: 'center', marginRight: 8 },
  chipT: { color: C.muted, fontWeight: '700' },
});
