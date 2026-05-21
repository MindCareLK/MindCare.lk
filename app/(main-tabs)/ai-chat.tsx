import { Feather, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Message = {
  id: string;
  sender: "assistant" | "user";
  text: string;
  time: string;
};

type QuestionOption = {
  label: string;
  value: number;
};

type AssessmentQuestion = {
  id: string;
  prompt: string;
  options: QuestionOption[];
};

const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: "q1",
    prompt: "ඔබට නිතරම අනවශ්‍ය බියක් හෝ කාංසාවක් දැනෙනවාද?",
    options: [
      { label: "කිසිසේත්ම නැත", value: 0 },
      { label: "සමහර දිනවල", value: 1 },
      { label: "නිතරම වගේ", value: 2 },
    ],
  },
  {
    id: "q2",
    prompt: "රාත්‍රී කාලයේදී ඔබට නින්ද යාමේ අපහසුතාවයක් පවතිනවාද?",
    options: [
      { label: "කිසිසේත්ම නැත", value: 0 },
      { label: "සමහර දිනවල", value: 1 },
      { label: "නිතරම වගේ", value: 2 },
    ],
  },
];

const formatCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
  const paddedMinutes = minutes.toString().padStart(2, "0");
  return `${normalizedHours}:${paddedMinutes} ${ampm}`;
};

const calculateAssessmentTier = (score: number) => {
  if (score <= 1) {
    return {
      tier: "Mild Stress / Healthy baseline.",
      strategy:
        "Focus on wellness tips, lifestyle balance, and peaceful listening.",
    };
  }

  if (score <= 3) {
    return {
      tier: "Moderate anxiety/depression indicators.",
      strategy:
        "Be deeply comforting and highly empathetic. Validate their pain carefully using gentle language.",
    };
  }

  return {
    tier: "Severe psychological distress.",
    strategy:
      "Be extraordinarily warm, but subtly prioritize guiding them to contact a professional human clinical psychologist or doctor in Sri Lanka.",
  };
};

const createSystemInstruction = (tier: string, strategy: string) => {
  return `You are an expert, deeply empathetic, and professional mental health counsellor.

CRITICAL BEHAVIORAL LAWS:
1. You MUST speak and reply exclusively in the Sinhala language (සිංහල) using comforting, gentle words.
2. The patient's initial screening results indicate a mental tier of: ${tier}
3. You must adapt your clinical approach to this directive: ${strategy}
4. Never reveal or say the raw numeric quiz score or mention words like 'tier' or 'level' to the user. Just silently change your tone.
5. Allow the user to speak for as long as they want. Keep your text fragments warm but conversational.
`;
};

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "සුබ දවසක්! මට ඔබගේ මානසික සුවතා පිළිබඳව ස්ථිරව කතා කිරීමට උදව් කරනවා. කරුණාකර පළමුව කෙටි ඇගයීම සම්පූර්ණ කරන්න.",
      time: formatCurrentTime(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAssessmentComplete, setIsAssessmentComplete] = useState(false);
  const [assessmentTier, setAssessmentTier] = useState(
    "Mild Stress / Healthy baseline.",
  );
  const [assessmentStrategy, setAssessmentStrategy] = useState(
    "Focus on wellness tips, lifestyle balance, and peaceful listening.",
  );
  const [isSending, setIsSending] = useState(false);

  const currentQuestion = assessmentQuestions[currentQuestionIndex];

  const systemInstruction = useMemo(
    () => createSystemInstruction(assessmentTier, assessmentStrategy),
    [assessmentTier, assessmentStrategy],
  );

  // FIXED: Standardize model path to production identifier string
  const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const GEMINI_MODEL = "gemini-2.5-flash";

  // FIXED: Standardized chat configuration mapping logic
  // FIXED: Explicitly maps target variables to standard production pipelines
  async function sendToGemini(
    currentInput: string,
    historyMessages: Message[],
    systemInstruction: string,
  ) {
    try {
      // FIX: Changed /v1/ to /v1beta/ on the CORRECT domain host
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      // Convert flat logs into structured multi-turn conversation frames
      const chatContents = historyMessages
        .filter(
          (m) => m.id !== "welcome" && !m.id.startsWith("assistant-start"),
        )
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        }));

      // Append your active user message
      chatContents.push({
        role: "user",
        parts: [{ text: currentInput }],
      });

      const body = {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: chatContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Server responded with ${res.status}:`, errorText);
        throw new Error(`Gemini API error status code: ${res.status}`);
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || null;
    } catch (e) {
      console.warn("Gemini request failed:", e);
      return null;
    }
  }

  const handleAssessmentAnswer = (value: number) => {
    const nextScore = assessmentScore + value;

    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setAssessmentScore(nextScore);
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    const { tier, strategy } = calculateAssessmentTier(nextScore);
    setAssessmentScore(nextScore);
    setAssessmentTier(tier);
    setAssessmentStrategy(strategy);
    setIsAssessmentComplete(true);

    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-start-${Date.now()}`,
        sender: "assistant",
        text: "ඔබගේම මානසික සුවතා ප්‍රායෝගික අවස්ථාවට මම දැන් උපකාර කරන්න සුදානම්. කරුණාකර ඔබේ අදහස් මට නිදහස්ව කියන්න.",
        time: formatCurrentTime(),
      },
    ]);
  };

  const handleSend = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isSending) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmedInput,
      time: formatCurrentTime(),
    };

    // Keep backup copy of old screen trace context arrays
    const dynamicHistoryBackup = [...messages];

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsSending(true);

    // FIXED: Passed real history context lists alongside input strings
    const geminiReply = await sendToGemini(
      trimmedInput,
      dynamicHistoryBackup,
      systemInstruction,
    );

    const fallbackText =
      "කණගාටුයි, මට පණිවිඩය සැකසීමේදී ගැටලුවක් ඇති වුණා. කරුණාකර නැවත උත්සාහ කරන්න.";

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      sender: "assistant",
      text: geminiReply || fallbackText,
      time: formatCurrentTime(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsSending(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#F2F5F8" translucent={false} />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerLabel}>MINDCARE ASSISTANT</Text>
            <Text style={styles.subHeader}>
              Smart emotional support, tailored to your needs.
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
              <Feather name="star" size={16} color="#4A5665" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
              <Feather name="phone" size={16} color="#4A5665" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.alertBar}>
          <View style={styles.alertLeft}>
            <Feather name="alert-circle" size={12} color="#D0677C" />
            <Text style={styles.alertText}>HIGH SUPPORT ACTIVE</Text>
          </View>
          <TouchableOpacity style={styles.sosButton} activeOpacity={0.85}>
            <Text style={styles.sosText}>SOS Mode</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helperBubble}>
          <Text style={styles.helperText}>
            මට ඔබගේ හැඟීම් වලට ආරක්‍ෂාකාරී, වෘත්තීය, සහ සැහැල්ලු ප්‍රතිචාර ලබා
            දීමට වග බලා ගන්න.
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {!isAssessmentComplete && (
              <View style={styles.assessmentCard}>
                <Text style={styles.sectionTitle}>මානසික සුවතා ඇගයීම</Text>
                <Text style={styles.questionText}>
                  {currentQuestion.prompt}
                </Text>
                <View style={styles.optionsRow}>
                  {currentQuestion.options.map((option) => (
                    <TouchableOpacity
                      key={option.label}
                      style={styles.optionButton}
                      activeOpacity={0.85}
                      onPress={() => handleAssessmentAnswer(option.value)}
                    >
                      <Text style={styles.optionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.progressText}>
                  ප්‍රශ්නය {currentQuestionIndex + 1} /{" "}
                  {assessmentQuestions.length}
                </Text>
              </View>
            )}

            {isAssessmentComplete && (
              <>
                {messages.map((message) => (
                  <View
                    key={message.id}
                    style={
                      message.sender === "assistant"
                        ? styles.messageRowLeft
                        : styles.messageRowRight
                    }
                  >
                    {message.sender === "assistant" && (
                      <View style={styles.avatarDot} />
                    )}
                    <View
                      style={
                        message.sender === "assistant"
                          ? styles.botBubble
                          : styles.userBubble
                      }
                    >
                      <Text
                        style={
                          message.sender === "assistant"
                            ? styles.botText
                            : styles.userText
                        }
                      >
                        {message.text}
                      </Text>
                    </View>
                    <Text
                      style={
                        message.sender === "assistant"
                          ? styles.timeText
                          : styles.timeRight
                      }
                    >
                      {message.time}
                    </Text>
                  </View>
                ))}

                
              </>
            )}
          </ScrollView>
          <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={styles.quickChip}
                    activeOpacity={0.85}
                    onPress={() =>
                      setInputText("මට හුස්ම ගැනීමේ උපදෙස් දෙන්න.")
                    }
                  >
                    <Text style={styles.quickChipText}>Deep Breath</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickChip}
                    activeOpacity={0.85}
                    onPress={() =>
                      setInputText("මානසික පීඩනය අඩු කරන්න උපදෙස් ලබා දෙන්න.")
                    }
                  >
                    <Text style={styles.quickChipText}>Anxiety Tip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickChip}
                    activeOpacity={0.85}
                    onPress={() =>
                      setInputText("මගේ මානසික අත්දැකීම ලොග් කරන්න.")
                    }
                  >
                    <Text style={styles.quickChipText}>Log Mood</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickChip}
                    activeOpacity={0.85}
                    onPress={() =>
                      setInputText(
                        "මට සහය ලබා ගත හැකි වෛද්‍ය වෘත්තිය විස්තර කරන්න.",
                      )
                    }
                  >
                    <Text style={styles.quickChipText}>Find Help</Text>
                  </TouchableOpacity>
                </View>

          {isAssessmentComplete && (
            <View style={styles.inputBar}>
              <TouchableOpacity style={styles.clipButton} activeOpacity={0.85}>
                <Feather name="paperclip" size={18} color="#687382" />
              </TouchableOpacity>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="ඔබට අවශ්‍ය දේ මෙහි ලියන්න..."
                  placeholderTextColor="#8C96A3"
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
                <Feather name="mic" size={15} color="#98A2AE" />
              </View>
              <TouchableOpacity
                style={styles.sendButton}
                activeOpacity={0.88}
                onPress={handleSend}
              >
                <Ionicons
                  name="paper-plane-outline"
                  size={17}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2F5F8",
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLabel: {
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    color: "#2F3744",
  },
  subHeader: {
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 14,
    color: "#677489",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F4F7FB",
    justifyContent: "center",
    alignItems: "center",
  },
  alertBar: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0CCD6",
    backgroundColor: "#FAEEF2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  alertText: {
    fontFamily: "Inter",
    fontSize: 10,
    lineHeight: 12,
    color: "#D0677C",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sosButton: {
    backgroundColor: "#E47A8C",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sosText: {
    fontFamily: "Inter",
    fontSize: 10,
    lineHeight: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  helperBubble: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D9DFE8",
    backgroundColor: "#F6F8FB",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  helperText: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    color: "#5F6C7B",
  },
  assessmentCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D7DEE7",
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#2F3744",
  },
  questionText: {
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#4A5665",
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  optionButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7DEE7",
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: "30%",
  },
  optionText: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    color: "#455A6D",
    fontWeight: "700",
  },
  progressText: {
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 14,
    color: "#8A95A3",
    marginTop: 4,
  },
  messageRowLeft: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  messageRowRight: {
    alignSelf: "flex-end",
    marginTop: 12,
    maxWidth: "85%",
  },
  avatarDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#D8E6FF",
    borderWidth: 1,
    borderColor: "#C8D8F5",
  },
  botBubble: {
    borderRadius: 16,
    backgroundColor: "#EAF1FB",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  botText: {
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#3B5F88",
  },
  userBubble: {
    borderRadius: 16,
    backgroundColor: "#2F88E8",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userText: {
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#FFFFFF",
  },
  timeText: {
    marginTop: 4,
    marginLeft: 4,
    fontFamily: "Inter",
    fontSize: 9,
    lineHeight: 11,
    color: "#9AA3AF",
    fontWeight: "600",
  },
  timeRight: {
    marginTop: 4,
    textAlign: "right",
    marginRight: 4,
    fontFamily: "Inter",
    fontSize: 9,
    lineHeight: 11,
    color: "#9AA3AF",
    fontWeight: "600",
  },
  quickActions: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7DEE7",
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickChipText: {
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 14,
    color: "#5E6877",
    fontWeight: "700",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 2,
    backgroundColor: "transparent",
  },
  clipButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F4F7FB",
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrap: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D5DCE5",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 18,
    color: "#46505D",
    paddingVertical: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2F88E8",
    justifyContent: "center",
    alignItems: "center",
  },
});
