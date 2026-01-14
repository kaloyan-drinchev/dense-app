import { Link, Stack, usePathname, useSegments } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";

export default function NotFoundScreen() {
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    console.log("🚨🚨🚨 NOT FOUND SCREEN RENDERED 🚨🚨🚨");
    console.log("📍 Current pathname:", pathname);
    console.log("📍 Current segments:", segments);
    console.log("📍 Full segments array:", JSON.stringify(segments));

    // Get stack trace to see how we got here
    const stack = new Error().stack;
    console.log("📍 Stack trace:", stack);

    // Log all available route info
    console.log("📍 Route debugging info:", {
      pathname,
      segments,
      segmentsLength: segments.length,
      timestamp: new Date().toISOString(),
    });
  }, [pathname, segments]);

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Text style={styles.linkText}>Path: {pathname}</Text>

        <Link href="/(tabs)/Home" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});
