import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCounselorProfile } from "@/lib/counselors";
import { auth, db } from "@/lib/firebase";

type ScheduleParams = {
  name?: string | string[];
  specialty?: string | string[];
};

type TimeBlock = {
  id: string;
  start: string;
  end: string;
};

type DaySchedule = {
  blocks: TimeBlock[];
  sessionDuration: number; // in minutes
  bufferTime: number; // in minutes
};

type FeedbackTone = "success" | "error";

const WEEKDAY_IDS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const MONTH_LABELS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
] as const;

const DURATION_OPTIONS = [30, 45, 60];
const BUFFER_OPTIONS = [0, 5, 10, 15];



const createBlock = (): TimeBlock => ({
  id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  start: "08:00 AM",
  end: "12:00 PM",
});

const buildDefaultSchedule = (): DaySchedule => ({
  blocks: [createBlock()],
  sessionDuration: 30,
  bufferTime: 10,
});

const cloneSchedule = (sched: DaySchedule): DaySchedule => ({
  blocks: sched.blocks.map((b) => ({ ...b })),
  sessionDuration: sched.sessionDuration,
  bufferTime: sched.bufferTime,
});

const cloneSchedulesByDate = (schedules: Record<string, DaySchedule>) => {
  const result: Record<string, DaySchedule> = {};
  for (const dateKey of Object.keys(schedules)) {
    result[dateKey] = cloneSchedule(schedules[dateKey]);
  }
  return result;
};

// Parsing helper to support backward compatibility
function parseDaySchedule(data: any): DaySchedule {
  if (!data) {
    return buildDefaultSchedule();
  }

  if (data.blocks && Array.isArray(data.blocks)) {
    return {
      blocks: data.blocks,
      sessionDuration: typeof data.sessionDuration === "number" ? data.sessionDuration : 30,
      bufferTime: typeof data.bufferTime === "number" ? data.bufferTime : 10,
    };
  }

  // Backward compatibility migration for old DayTemplate schema
  const blocks: TimeBlock[] = [];
  const periods = ["morning", "afternoon", "evening"] as const;
  let allSlots: any[] = [];
  for (const p of periods) {
    if (data[p] && Array.isArray(data[p])) {
      allSlots = [...allSlots, ...data[p]];
    }
  }

  if (allSlots.length > 0) {
    allSlots.forEach((slot, index) => {
      if (slot.isAvailable && slot.startTime && slot.endTime) {
        blocks.push({
          id: `block-migrated-${index}`,
          start: slot.startTime,
          end: slot.endTime,
        });
      }
    });
  }

  if (blocks.length === 0) {
    blocks.push(createBlock());
  }

  return {
    blocks,
    sessionDuration: 30,
    bufferTime: 10,
  };
}

export function parseTimeToMinutes(timeStr: string): number | null {
  const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();

  if (ampm === "PM" && hours < 12) {
    hours += 12;
  } else if (ampm === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? "PM" : "AM";

  if (hours > 12) {
    hours -= 12;
  } else if (hours === 0) {
    hours = 12;
  }

  const hStr = String(hours);
  const mStr = String(minutes).padStart(2, "0");

  return `${hStr}:${mStr} ${ampm}`;
}

export function parseTimeToDate(timeStr: string): Date {
  const date = new Date();
  const mins = parseTimeToMinutes(timeStr);
  if (mins !== null) {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    date.setHours(hours, minutes, 0, 0);
  } else {
    date.setHours(8, 0, 0, 0);
  }
  return date;
}

export function formatDateToTimeString(date: Date): string {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  return formatMinutesToTime(totalMinutes);
}

export function generateTimeSlots(
  startStr: string,
  endStr: string,
  durationMinutes: number,
  bufferMinutes: number
): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];

  const startTotal = parseTimeToMinutes(startStr);
  const endTotal = parseTimeToMinutes(endStr);

  if (startTotal === null || endTotal === null || startTotal >= endTotal) {
    return [];
  }

  let currentStart = startTotal;
  while (currentStart + durationMinutes <= endTotal) {
    const currentEnd = currentStart + durationMinutes;
    slots.push({
      startTime: formatMinutesToTime(currentStart),
      endTime: formatMinutesToTime(currentEnd),
    });
    currentStart = currentEnd + bufferMinutes;
  }

  return slots;
}

function findOverlappingBlocks(blocks: TimeBlock[]): string | null {
  const sorted = blocks
    .map((b) => ({
      start: parseTimeToMinutes(b.start),
      end: parseTimeToMinutes(b.end),
      label: `${b.start} - ${b.end}`,
    }))
    .filter((b) => b.start !== null && b.end !== null)
    .sort((a, b) => a.start! - b.start!);

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (curr.start! < prev.end!) {
      return `${curr.label} overlaps with ${prev.label}`;
    }
  }
  return null;
}



function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CounselorScheduleScreen() {
  const params = useLocalSearchParams<ScheduleParams>();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<(typeof WEEKDAY_IDS)[number]>(() => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
    const mapping: (typeof WEEKDAY_IDS)[number][] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return mapping[day];
  });

  const [defaultSchedule] = useState<DaySchedule>(buildDefaultSchedule());
  const [schedulesByDate, setSchedulesByDate] = useState<Record<string, DaySchedule>>({});

  const [savedDefaultSchedule, setSavedDefaultSchedule] = useState<DaySchedule>(buildDefaultSchedule());
  const [savedSchedulesByDate, setSavedSchedulesByDate] = useState<Record<string, DaySchedule>>({});

  const [isSyncing, setIsSyncing] = useState(true);

  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    tone: FeedbackTone;
  }>({
    visible: false,
    title: "",
    message: "",
    tone: "success",
  });

  const [timePickerConfig, setTimePickerConfig] = useState<{
    visible: boolean;
    blockId: string;
    field: "start" | "end";
    selectedValue: string;
  }>({
    visible: false,
    blockId: "",
    field: "start",
    selectedValue: "08:00 AM",
  });

  const [pickerDate, setPickerDate] = useState<Date>(() => new Date());

  const openTimePicker = (blockId: string, field: "start" | "end", currentValue: string) => {
    const parsedDate = parseTimeToDate(currentValue);
    setPickerDate(parsedDate);
    setTimePickerConfig({
      visible: true,
      blockId,
      field,
      selectedValue: currentValue,
    });
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      // On Android, dismiss visible picker state
      setTimePickerConfig((prev) => ({ ...prev, visible: false }));
      if (event.type === "set" && selectedDate) {
        const newTimeStr = formatDateToTimeString(selectedDate);
        const { blockId, field } = timePickerConfig;
        updateBlockTime(blockId, { [field]: newTimeStr });
        void Haptics.selectionAsync();
      }
    } else {
      // On iOS, update pickerDate state while user is scrolling
      if (selectedDate) {
        setPickerDate(selectedDate);
      }
    }
  };

  const confirmIosTime = () => {
    const newTimeStr = formatDateToTimeString(pickerDate);
    const { blockId, field } = timePickerConfig;
    updateBlockTime(blockId, { [field]: newTimeStr });
    setTimePickerConfig((prev) => ({ ...prev, visible: false }));
    void Haptics.selectionAsync();
  };

  const counselorName = Array.isArray(params.name)
    ? params.name[0]
    : params.name || "Mr. Tharusha Theekshana";
  const specialty = Array.isArray(params.specialty)
    ? params.specialty[0]
    : params.specialty || "Cognitive Behavioral Therapy";

  useEffect(() => {
    const user = auth?.currentUser;
    if (!user) {
      router.replace("/counselor-login");
      return;
    }

    getCounselorProfile(user.uid)
      .then((profile) => {
        if (profile && (profile as any).schedules) {
          const rawScheds = (profile as any).schedules;
          const parsedScheds: Record<string, DaySchedule> = {};
          
          Object.keys(rawScheds).forEach((dateKey) => {
            parsedScheds[dateKey] = parseDaySchedule(rawScheds[dateKey]);
          });

          setSchedulesByDate(parsedScheds);
          setSavedSchedulesByDate(cloneSchedulesByDate(parsedScheds));
        }
      })
      .catch((err) => {
        console.error("Error fetching schedules:", err);
      })
      .finally(() => {
        setIsSyncing(false);
      });
  }, []);

  const displayedDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() + weekOffset * 7);

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);

      const dayOfWeek = date.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
      const dayId = dayOfWeek === 0 ? "sun" : WEEKDAY_IDS[dayOfWeek - 1];
      const label = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

      return {
        id: dayId,
        label,
        isoDate: formatIsoDate(date),
        date: String(date.getDate()).padStart(2, "0"),
        month: MONTH_LABELS[date.getMonth()],
        fullDate: date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        isPast: false,
      };
    });
  }, [weekOffset]);

  useEffect(() => {
    if (displayedDays.length > 0) {
      const exists = displayedDays.some((day) => day.id === selectedDay);
      if (!exists) {
        setTimeout(() => {
          setSelectedDay(displayedDays[0].id);
        }, 0);
      }
    }
  }, [displayedDays, selectedDay]);

  const selectedDayEntry =
    displayedDays.find((day) => day.id === selectedDay) ?? displayedDays[0] ?? { isoDate: "", fullDate: "" };
  const selectedDateKey = selectedDayEntry.isoDate;

  const selectedSchedule =
    schedulesByDate[selectedDateKey] ?? cloneSchedule(defaultSchedule);

  // Sliced slots calculated on-the-fly for real-time preview
  const previewSlots = useMemo(() => {
    const list: { startTime: string; endTime: string }[] = [];
    selectedSchedule.blocks.forEach((block) => {
      const blockSlots = generateTimeSlots(
        block.start,
        block.end,
        selectedSchedule.sessionDuration,
        selectedSchedule.bufferTime
      );
      list.push(...blockSlots);
    });
    return list;
  }, [selectedSchedule]);

  const hasUnsavedChanges = useMemo(() => {
    return (
      JSON.stringify(defaultSchedule) !== JSON.stringify(savedDefaultSchedule) ||
      JSON.stringify(schedulesByDate) !== JSON.stringify(savedSchedulesByDate)
    );
  }, [defaultSchedule, savedDefaultSchedule, schedulesByDate, savedSchedulesByDate]);

  const setSelectedDateSchedule = (nextSchedule: DaySchedule) => {
    setSchedulesByDate((current) => ({
      ...current,
      [selectedDateKey]: nextSchedule,
    }));
  };

  const updateBlockTime = (blockId: string, patch: Partial<TimeBlock>) => {
    const nextSchedule = cloneSchedule(selectedSchedule);
    nextSchedule.blocks = nextSchedule.blocks.map((b) =>
      b.id === blockId ? { ...b, ...patch } : b
    );
    setSelectedDateSchedule(nextSchedule);
  };

  const addTimeBlock = () => {
    const nextSchedule = cloneSchedule(selectedSchedule);
    nextSchedule.blocks.push(createBlock());
    setSelectedDateSchedule(nextSchedule);
    void Haptics.selectionAsync();
  };

  const removeTimeBlock = (blockId: string) => {
    const nextSchedule = cloneSchedule(selectedSchedule);
    if (nextSchedule.blocks.length > 1) {
      nextSchedule.blocks = nextSchedule.blocks.filter((b) => b.id !== blockId);
      setSelectedDateSchedule(nextSchedule);
      void Haptics.selectionAsync();
    } else {
      Alert.alert("Cannot Remove", "You must have at least one time block defined.");
    }
  };

  const setDuration = (mins: number) => {
    const nextSchedule = cloneSchedule(selectedSchedule);
    nextSchedule.sessionDuration = mins;
    setSelectedDateSchedule(nextSchedule);
    void Haptics.selectionAsync();
  };

  const setBuffer = (mins: number) => {
    const nextSchedule = cloneSchedule(selectedSchedule);
    nextSchedule.bufferTime = mins;
    setSelectedDateSchedule(nextSchedule);
    void Haptics.selectionAsync();
  };

  const goOverview = () => {
    router.replace({
      pathname: "/(counselor-tabs)/overview",
      params: { name: counselorName, specialty },
    });
  };

  const handleSave = () => {
    // 1. Validation checks
    for (const block of selectedSchedule.blocks) {
      const startMins = parseTimeToMinutes(block.start);
      const endMins = parseTimeToMinutes(block.end);

      if (startMins === null || endMins === null) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFeedbackModal({
          visible: true,
          title: "Invalid time format",
          message: "Please choose times in a valid format (e.g., 08:00 AM, 05:30 PM).",
          tone: "error",
        });
        return;
      }

      if (startMins >= endMins) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFeedbackModal({
          visible: true,
          title: "Invalid range",
          message: `Block start time (${block.start}) must be before end time (${block.end}).`,
          tone: "error",
        });
        return;
      }
    }

    // 2. Overlap checks
    const overlapMsg = findOverlappingBlocks(selectedSchedule.blocks);
    if (overlapMsg) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedbackModal({
        visible: true,
        title: "Overlapping blocks",
        message: `${overlapMsg}. Please adjust the times so blocks do not conflict.`,
        tone: "error",
      });
      return;
    }

    // 3. Save to database
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSavedDefaultSchedule(cloneSchedule(defaultSchedule));
    setSavedSchedulesByDate(cloneSchedulesByDate(schedulesByDate));

    const user = auth?.currentUser;
    if (user && db) {
      setDoc(
        doc(db, "counselors", user.uid),
        {
          schedules: schedulesByDate,
        },
        { merge: true }
      ).catch((err) => {
        console.error("Error saving counselor schedules to Firestore:", err);
      });
    }

    setFeedbackModal({
      visible: true,
      title: "Availability saved",
      message: `Your schedule for ${selectedDayEntry.fullDate} has been updated. Sliced into ${previewSlots.length} slot(s).`,
      tone: "success",
    });
  };

  const shiftWeek = (offset: number) => {
    setWeekOffset((curr) => curr + offset);
    void Haptics.selectionAsync();
  };

  if (isSyncing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color="#2F88E8" />
          <Text style={{ marginTop: 12, fontFamily: "Inter", color: "#6D7686", fontWeight: "600" }}>
            Loading schedules...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.85}
            onPress={goOverview}
          >
            <Feather name="chevron-left" size={28} color="#1B2536" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SET AVAILABILITY</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.headerDivider} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Selecting Day Section */}
          <View style={styles.dayHeader}>
            <View>
              <Text style={styles.dayHeaderText}>CHOOSE DATE</Text>
              <Text style={styles.dayHeaderHint}>
                Choose a date and define your working hours
              </Text>
            </View>
            <View style={styles.weekActions}>
              <TouchableOpacity
                style={[styles.weekButton, weekOffset <= 0 && { opacity: 0.4 }]}
                activeOpacity={0.85}
                onPress={() => weekOffset > 0 && shiftWeek(-1)}
                disabled={weekOffset <= 0}
              >
                <Feather name="chevron-left" size={18} color={weekOffset <= 0 ? "#8E9AA8" : "#2F88E8"} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.weekButton, { marginLeft: 6 }]}
                activeOpacity={0.85}
                onPress={() => shiftWeek(1)}
              >
                <Feather name="chevron-right" size={18} color="#2F88E8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Week Calendar Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarRow}
          >
            {displayedDays.map((day) => {
              const isSelected = day.id === selectedDay;
              const isDisabled = day.isPast;
              return (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.calendarPill,
                    isSelected && styles.calendarPillActive,
                    isDisabled && { opacity: 0.35, backgroundColor: "#EBF3FC", borderColor: "#D2DFED" },
                  ]}
                  activeOpacity={isDisabled ? 1 : 0.9}
                  disabled={isDisabled}
                  onPress={() => {
                    if (!isDisabled) {
                      setSelectedDay(day.id);
                      void Haptics.selectionAsync();
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.calendarPillLabel,
                      isSelected && styles.calendarPillLabelActive,
                      isDisabled && { color: "#8E9AA8" },
                    ]}
                  >
                    {day.label}
                  </Text>
                  <Text
                    style={[
                      styles.calendarPillDate,
                      isSelected && styles.calendarPillDateActive,
                      isDisabled && { color: "#6D7686" },
                    ]}
                  >
                    {day.date}
                  </Text>
                  <Text
                    style={[
                      styles.calendarPillMonth,
                      isSelected && styles.calendarPillMonthActive,
                      isDisabled && { color: "#8E9AA8" },
                    ]}
                  >
                    {day.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Feather name="info" size={22} color="#2F88E8" />
            <Text style={styles.infoText}>
              Set your work blocks. The system will automatically slice them into fixed-duration consultation slots for members to book.
            </Text>
          </View>

          {/* Configuration Settings */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>SLOT CONFIGURATION</Text>
            <Text style={styles.sectionHint}>Define session length and buffer between sessions</Text>

            <View style={styles.configCard}>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Session Duration</Text>
                <View style={styles.pillsRow}>
                  {DURATION_OPTIONS.map((dur) => {
                    const isSelected = selectedSchedule.sessionDuration === dur;
                    return (
                      <TouchableOpacity
                        key={dur}
                        style={[styles.pill, isSelected && styles.pillActive]}
                        activeOpacity={0.85}
                        onPress={() => setDuration(dur)}
                      >
                        <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                          {dur} min
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.configRow, { marginTop: 16 }]}>
                <Text style={styles.configLabel}>Buffer Time</Text>
                <View style={styles.pillsRow}>
                  {BUFFER_OPTIONS.map((buf) => {
                    const isSelected = selectedSchedule.bufferTime === buf;
                    return (
                      <TouchableOpacity
                        key={buf}
                        style={[styles.pill, isSelected && styles.pillActive]}
                        activeOpacity={0.85}
                        onPress={() => setBuffer(buf)}
                      >
                        <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                          {buf} min
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Time Blocks */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>AVAILABILITY BLOCKS</Text>
                <Text style={styles.sectionHint}>Add work intervals for this day</Text>
              </View>
              <TouchableOpacity
                style={styles.addBlockButton}
                activeOpacity={0.88}
                onPress={addTimeBlock}
              >
                <Feather name="plus" size={14} color="#2F88E8" />
                <Text style={styles.addBlockButtonText}>Add Block</Text>
              </TouchableOpacity>
            </View>

            {selectedSchedule.blocks.map((block, index) => (
              <View key={block.id} style={styles.blockCard}>
                <View style={styles.blockCardHeader}>
                  <Text style={styles.blockCardTitle}>Block #{index + 1}</Text>
                  {selectedSchedule.blocks.length > 1 ? (
                    <TouchableOpacity
                      style={styles.removeBlockButton}
                      activeOpacity={0.88}
                      onPress={() => removeTimeBlock(block.id)}
                    >
                      <Feather name="trash-2" size={14} color="#D84C4C" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.blockTimeRow}>
                  <View style={styles.timeFieldWrap}>
                    <Text style={styles.timeFieldLabel}>Start Time</Text>
                    <TouchableOpacity
                      style={styles.timeInputShell}
                      activeOpacity={0.75}
                      onPress={() => openTimePicker(block.id, "start", block.start)}
                    >
                      <Feather name="clock" size={16} color="#2F88E8" />
                      <Text style={styles.timeText}>{block.start}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timeFieldWrap}>
                    <Text style={styles.timeFieldLabel}>End Time</Text>
                    <TouchableOpacity
                      style={styles.timeInputShell}
                      activeOpacity={0.75}
                      onPress={() => openTimePicker(block.id, "end", block.end)}
                    >
                      <Feather name="clock" size={16} color="#2F88E8" />
                      <Text style={styles.timeText}>{block.end}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Sliced Slots Preview */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>SLOTS PREVIEW</Text>
            <Text style={styles.sectionHint}>Real-time generation of bookable slots</Text>

            <View style={styles.previewContainer}>
              {previewSlots.length === 0 ? (
                <Text style={styles.emptyPreviewText}>
                  Choose valid time blocks to view generated slots.
                </Text>
              ) : (
                <View style={styles.slotsGrid}>
                  {previewSlots.map((slot, idx) => (
                    <View key={idx} style={styles.previewBadge}>
                      <Feather name="calendar" size={11} color="#6B7280" style={{ marginRight: 4 }} />
                      <Text style={styles.previewBadgeText}>
                        {slot.startTime} - {slot.endTime}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Save Bar */}
        <View style={styles.bottomPanel}>
          <View style={styles.capacityWrap}>
            <Text style={styles.capacityLabel}>TOTAL SLOTS</Text>
            <Text style={styles.capacityValue}>
              {previewSlots.length} Bookable Session(s)
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, !hasUnsavedChanges && { opacity: 0.85 }]}
            activeOpacity={0.88}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Availability</Text>
          </TouchableOpacity>
        </View>

        {/* Time Picker Component */}
        {Platform.OS === "android" && timePickerConfig.visible && (
          <DateTimePicker
            value={pickerDate}
            mode="time"
            is24Hour={false}
            display="clock"
            onChange={handleTimeChange}
          />
        )}

        {Platform.OS === "ios" && (
          <Modal
            visible={timePickerConfig.visible}
            transparent
            animationType="slide"
            onRequestClose={() => setTimePickerConfig((prev) => ({ ...prev, visible: false }))}
          >
            <View style={styles.pickerOverlay}>
              <Pressable
                style={styles.pickerBackdrop}
                onPress={() => setTimePickerConfig((prev) => ({ ...prev, visible: false }))}
              />
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>
                    CHOOSE {timePickerConfig.field.toUpperCase()} TIME
                  </Text>
                  <TouchableOpacity
                    style={styles.pickerCloseButton}
                    onPress={() => setTimePickerConfig((prev) => ({ ...prev, visible: false }))}
                  >
                    <Feather name="x" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.pickerClockWrapper}>
                  <DateTimePicker
                    value={pickerDate}
                    mode="time"
                    display="spinner"
                    is24Hour={false}
                    onChange={handleTimeChange}
                    style={styles.iosDatePicker}
                  />
                </View>

                <TouchableOpacity
                  style={styles.pickerConfirmButton}
                  activeOpacity={0.85}
                  onPress={confirmIosTime}
                >
                  <Text style={styles.pickerConfirmButtonText}>Confirm Time</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Feedback Popup Modal */}
        <Modal
          visible={feedbackModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
            />
            <View style={styles.confirmSheet}>
              <View
                style={[
                  styles.confirmIconWrap,
                  feedbackModal.tone === "error" && styles.confirmIconWrapError,
                ]}
              >
                <Feather
                  name={feedbackModal.tone === "error" ? "alert-circle" : "check-circle"}
                  size={28}
                  color={feedbackModal.tone === "error" ? "#D84C4C" : "#2F88E8"}
                />
              </View>
              <Text style={styles.confirmTitle}>{feedbackModal.title}</Text>
              <Text style={styles.confirmText}>{feedbackModal.message}</Text>
              <TouchableOpacity
                style={[
                  styles.confirmPrimaryButton,
                  feedbackModal.tone === "error" && styles.confirmPrimaryButtonError,
                ]}
                activeOpacity={0.85}
                onPress={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
              >
                <Text style={styles.confirmPrimaryText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 20,
    color: "#1B2536",
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  headerSpacer: {
    width: 38,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#E4E8ED",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 140,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayHeaderText: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    color: "#6D7686",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dayHeaderHint: {
    marginTop: 2,
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 15,
    color: "#8E9AA8",
    fontWeight: "500",
  },
  weekActions: {
    flexDirection: "row",
  },
  weekButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D2DFED",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },
  calendarPill: {
    width: 76,
    height: 94,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  calendarPillActive: {
    borderColor: "#2F88E8",
    backgroundColor: "#2F88E8",
    shadowColor: "#2F88E8",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  calendarPillLabel: {
    fontFamily: "Inter",
    fontSize: 10,
    lineHeight: 13,
    color: "#7E8A9A",
    fontWeight: "700",
  },
  calendarPillLabelActive: {
    color: "#D0E7FF",
  },
  calendarPillDate: {
    marginTop: 5,
    fontFamily: "Inter",
    fontSize: 20,
    lineHeight: 24,
    color: "#1F2937",
    fontWeight: "800",
  },
  calendarPillDateActive: {
    color: "#FFFFFF",
  },
  calendarPillMonth: {
    marginTop: 4,
    fontFamily: "Inter",
    fontSize: 9,
    lineHeight: 12,
    color: "#7E8A9A",
    fontWeight: "700",
  },
  calendarPillMonthActive: {
    color: "#D0E7FF",
  },
  infoCard: {
    flexDirection: "row",
    borderRadius: 16,
    backgroundColor: "#EBF5FF",
    borderWidth: 1,
    borderColor: "#CFE6FD",
    padding: 14,
    gap: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 16,
    color: "#2C63AC",
    fontWeight: "600",
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 17,
    color: "#1E2530",
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  sectionHint: {
    marginTop: 1,
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 15,
    color: "#7E8A9A",
    fontWeight: "500",
  },
  configCard: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  configRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  configLabel: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#334155",
    fontWeight: "700",
    marginRight: 6,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  pillActive: {
    borderColor: "#2F88E8",
    backgroundColor: "#EBF5FF",
  },
  pillText: {
    fontFamily: "Inter",
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  pillTextActive: {
    color: "#2F88E8",
    fontWeight: "700",
  },
  addBlockButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EBF5FF",
  },
  addBlockButtonText: {
    fontFamily: "Inter",
    fontSize: 11,
    color: "#2F88E8",
    fontWeight: "700",
  },
  blockCard: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  blockCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  blockCardTitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "800",
  },
  removeBlockButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  blockTimeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeFieldWrap: {
    flex: 1,
    gap: 4,
  },
  timeFieldLabel: {
    fontFamily: "Inter",
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },
  timeInputShell: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeInput: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
  },
  previewContainer: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 14,
  },
  emptyPreviewText: {
    fontFamily: "Inter",
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 12,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewBadgeText: {
    fontFamily: "Inter",
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
  },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#DEE2E9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  capacityWrap: {
    gap: 2,
  },
  capacityLabel: {
    fontFamily: "Inter",
    fontSize: 10,
    color: "#64748B",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  capacityValue: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "800",
  },
  saveButton: {
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2F88E8",
  },
  saveButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalBackdrop: {
    flex: 1,
  },
  confirmSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: "center",
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EBF5FF",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmIconWrapError: {
    backgroundColor: "#FEF2F2",
  },
  confirmTitle: {
    marginTop: 16,
    fontFamily: "Inter",
    fontSize: 20,
    color: "#0F172A",
    fontWeight: "800",
    textAlign: "center",
  },
  confirmText: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "500",
  },
  confirmPrimaryButton: {
    marginTop: 22,
    width: "100%",
    height: 46,
    borderRadius: 12,
    backgroundColor: "#2F88E8",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmPrimaryButtonError: {
    backgroundColor: "#EF4444",
  },
  confirmPrimaryText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  timeText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  pickerBackdrop: {
    flex: 1,
  },
  pickerSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
    maxHeight: "65%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  pickerTitle: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
    color: "#1E2530",
    letterSpacing: 0.5,
  },
  pickerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerClockWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  iosDatePicker: {
    width: "100%",
    height: 200,
  },
  pickerConfirmButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2F88E8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  pickerConfirmButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
