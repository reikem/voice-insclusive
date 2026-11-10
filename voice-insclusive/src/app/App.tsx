import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider, useApp } from '@/components/state';
import { C } from '@/components/theme';
import { Editor, Grabar, Inclusion, Traducir } from '@/components/screens';

const TABS = [['Grabar', Grabar], ['Editor', Editor], ['Inclusión', Inclusion], ['Traducir', Traducir]] as const;
function Shell() {
    const { tab, setTab } = useApp(); const Screen = TABS[tab][1];
    const wide = useWindowDimensions().width >= 900; // escritorio / tablet horizontal: menú lateral
    const nav = (
        <View style={wide ? s.rail : s.nav} accessibilityRole="tablist">{TABS.map(([n], k) => (
            <Pressable key={n} accessibilityRole="tab" accessibilityState={{ selected: k === tab }} onPress={() => setTab(k)} style={[wide ? s.railTab : s.tab, wide && k === tab && { backgroundColor: C.primaryFixed }]}>
                <Text style={{ color: k === tab ? C.primary : C.muted, fontWeight: k === tab ? '700' : '400', fontSize: 16 }}>{n}</Text>
            </Pressable>))}</View>
    );
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }}>
            <StatusBar style="dark" />
            <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column' }}>
                {wide && nav}
                <View style={{ flex: 1 }}>
                    <Text accessibilityRole="header" style={s.title}>VoxInclusiva · {TABS[tab][0]}</Text>
                    <View style={{ flex: 1 }}><Screen /></View>
                </View>
                {!wide && nav}
            </View>
        </SafeAreaView>
    );
}
export default () => <SafeAreaProvider><Provider><Shell /></Provider></SafeAreaProvider>;
const s = StyleSheet.create({
    title: { fontSize: 22, fontWeight: '700', color: C.text, padding: 16, paddingBottom: 4, width: '100%', maxWidth: 760, alignSelf: 'center' },
    nav: { flexDirection: 'row', backgroundColor: C.card, margin: 8, borderRadius: 12 }, tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
    rail: { width: 200, backgroundColor: C.card, padding: 12, gap: 6 }, railTab: { minHeight: 48, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 14 },
});
