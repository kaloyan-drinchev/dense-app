import React from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { Feather as Icon } from "@expo/vector-icons";

import { styles } from "./styles";
import { useAboutUsLogic } from "./logic";
import { teamMembers, missionValues } from "./about-us-data";
import { renderTextWithHighlight } from "./text-utils";

export default function AboutUsScreen() {
  const { handleBack, handleContactPress, handleLegalPress } =
    useAboutUsLogic();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Icon name="zap" size={64} color={colors.primary} />
          </View>
          <Text style={styles.appName}>DENSE</Text>
          <Text style={styles.tagline}>
            {renderTextWithHighlight(
              "Revolutionary fitness training powered by AI, \n Driven by the Lazarov method.",
              styles.tagline
            )}
          </Text>
        </View>

        {/* Our Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.bodyText}>
            {renderTextWithHighlight(
              "DENSE was born from a simple belief: everyone deserves access to personalized, effective fitness training. Our team combines decades of experience in fitness, technology, and sports science to create the ultimate workout companion.",
              styles.bodyText
            )}
          </Text>
          <Text style={styles.bodyText}>
            {renderTextWithHighlight(
              "We've built this app to bring you the power of AI-driven program generation, ensuring every workout is tailored specifically to your goals, preferences, and progress.",
              styles.bodyText
            )}
          </Text>
        </View>

        {/* Team Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meet the Team</Text>

          {teamMembers.map((member, index) => (
            <View key={index} style={styles.teamMember}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitials}>{member.initials}</Text>
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberNameWithIcon}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Icon
                    name={member.icon as any}
                    size={20}
                    color={member.iconColor}
                    style={styles.goldMedalIcon}
                  />
                </View>
                <Text style={styles.memberRole}>{member.role}</Text>
                <Text style={styles.memberDescription}>
                  {member.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Mission & Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.bodyText}>
            To democratize elite fitness training through AI technology, making
            personalized, effective workouts accessible to everyone, anywhere,
            anytime.
          </Text>

          <View style={styles.valuesList}>
            {missionValues.map((value, index) => (
              <View key={index} style={styles.valueItem}>
                <Icon
                  name={value.icon as any}
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.valueText}>
                  <Text style={styles.valueTitle}>{value.title}</Text>
                  {"\n"}
                  {value.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <Text style={styles.bodyText}>
            We'd love to hear from you! Whether you have questions, feedback, or
            just want to say hello, don't hesitate to reach out.
          </Text>

          <View style={styles.contactContainer}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactPress("email")}
            >
              <Icon name="mail" size={20} color={colors.primary} />
              <Text style={styles.contactText}>Mail the CEO</Text>
              <Icon name="external-link" size={16} color={colors.lightGray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactPress("website")}
            >
              <Icon name="globe" size={20} color={colors.primary} />
              <Text style={styles.contactText}>Check our website</Text>
              <Icon name="external-link" size={16} color={colors.lightGray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactPress("instagram")}
            >
              <Icon name="instagram" size={20} color={colors.primary} />
              <Text style={styles.contactText}>Lazarov Twins</Text>
              <Icon name="external-link" size={16} color={colors.lightGray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Privacy</Text>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleLegalPress("privacyPolicy")}
          >
            <Icon name="shield" size={20} color={colors.primary} />
            <Text style={styles.contactText}>Privacy Policy</Text>
            <Icon name="external-link" size={16} color={colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleLegalPress("termsOfService")}
          >
            <Icon name="file-text" size={20} color={colors.primary} />
            <Text style={styles.contactText}>Terms of Service</Text>
            <Icon name="external-link" size={16} color={colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleLegalPress("support")}
          >
            <Icon name="help-circle" size={20} color={colors.primary} />
            <Text style={styles.contactText}>Support & Help</Text>
            <Icon name="external-link" size={16} color={colors.lightGray} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for the fitness community
          </Text>
          <Text style={styles.footerCopyright}>
            © 2025 DENSE. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
