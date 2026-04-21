import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScheduleParams = {
  name?: string | string[];
  specialty?: string | string[];
};

type PeriodId = "morning" | "afternoon" | "evening";

type TimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

type DayTemplate = Record<PeriodId, TimeSlot[]>;

type FeedbackTone = "success" | "error";

const WEEKDAY_IDS = ["mon", "tue", "wed", "thu", "fri"] as const;
const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI"] as const;
const MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

const PERIOD_META: Record<
  PeriodId,
  { title: string; hint: string; color: string; start: string; end: string }
> = {
  morning: {
    title: "Morning",
    hint: "Add one or more morning slots",
    color: "#F0B06B",
    start: "08:00 AM",
    end: "09:00 AM",
  },
  afternoon: {
    title: "Afternoon",
    hint: "Add one or more afternoon slots",
    color: "#2F88E8",
    start: "01:00 PM",
    end: "02:00 PM",
  },
  evening: {
    title: "Evening",
    hint: "Add one or more evening slots",
    color: "#B884F8",
    start: "06:00 PM",
    end: "07:00 PM",
  },
};

const createSlot = (period: PeriodId): TimeSlot => ({
  id: `${period}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  startTime: PERIOD_META[period].start,
  endTime: PERIOD_META[period].end,
  isAvailable: true,
});

const buildDefaultTemplate = (): DayTemplate => ({
  morning: [createSlot("morning")],
  afternoon: [createSlot("afternoon")],
  evening: [createSlot("evening")],
});

const cloneTemplate = (template: DayTemplate): DayTemplate => ({
  morning: template.morning.map((slot) => ({ ...slot })),
  afternoon: template.afternoon.map((slot) => ({ ...slot })),
  evening: template.evening.map((slot) => ({ ...slot })),
});

const getCurrentWeekMonday = (): Date => {
  const today = new Date();
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  const dayOfWeek = monday.getDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;
  monday.setDate(monday.getDate() - daysFromMonday);
  return monday;
};

const formatIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toSingleValue = (value: string | string[] | undefined): string =>
  typeof value === "string"
    ? value
    : Array.isArray(value)
      ? (value[0] ?? "")
      : "";

const parseTimeToMinutes = (value: string) => {
  const normalized = value.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

  if (!match) {
    return null;
  }

  const [, hoursText, minutesText, meridiem] = match;
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  const normalizedHours = hours % 12;
  const meridiemOffset = meridiem === "PM" ? 12 * 60 : 0;
  return normalizedHours * 60 + minutes + meridiemOffset;
};

const buildSlotLabel = (period: PeriodId, index: number) =>
  `${PERIOD_META[period].title} Slot ${index + 1}`;

const findOverlapConflict = (
  template: DayTemplate,
  targetPeriod: PeriodId,
  targetSlotId: string,
) => {
  const targetSlots = template[targetPeriod];
  const targetIndex = targetSlots.findIndex((slot) => slot.id === targetSlotId);

  if (targetIndex === -1) {
    return null;
  }

  const targetSlot = targetSlots[targetIndex];
  if (!targetSlot.isAvailable) {
    return null;
  }

  const targetStart = parseTimeToMinutes(targetSlot.startTime);
  const targetEnd = parseTimeToMinutes(targetSlot.endTime);

  if (targetStart === null || targetEnd === null || targetStart >= targetEnd) {
    return null;
  }

  for (const period of ["morning", "afternoon", "evening"] as const) {
    for (const [index, slot] of template[period].entries()) {
      if (period === targetPeriod && slot.id === targetSlotId) {
        continue;
      }

      if (!slot.isAvailable) {
        continue;
      }

      const slotStart = parseTimeToMinutes(slot.startTime);
      const slotEnd = parseTimeToMinutes(slot.endTime);

      if (slotStart === null || slotEnd === null || slotStart >= slotEnd) {
        continue;
      }

      if (targetStart < slotEnd && slotStart < targetEnd) {
        return {
          currentLabel: buildSlotLabel(targetPeriod, targetIndex),
          conflictLabel: buildSlotLabel(period, index),
        };
      }
    }
  }

  return null;
};

export default function CounselorScheduleScreen() {
  const params = useLocalSearchParams<ScheduleParams>();
  const counselorName = toSingleValue(params.name);
  const specialty = toSingleValue(params.specialty);
  const initialTemplate = buildDefaultTemplate();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<(typeof WEEKDAY_IDS)[number]>(
    WEEKDAY_IDS[0],
  );
  const [defaultTemplate] = useState<DayTemplate>(
    () => cloneTemplate(initialTemplate),
  );
  const [templatesByDate, setTemplatesByDate] = useState<Record<string, DayTemplate>>(
    {},
  );
  const [savedDefaultTemplate, setSavedDefaultTemplate] = useState<DayTemplate>(
    () => cloneTemplate(initialTemplate),
  );
  const [savedTemplatesByDate, setSavedTemplatesByDate] = useState<Record<string, DayTemplate>>(
    {},
  );
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

  const displayedDays = useMemo(() => {
    const monday = getCurrentWeekMonday();
    monday.setDate(monday.getDate() + weekOffset * 7);

    return WEEKDAY_IDS.map((id, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      return {
        id,
        label: WEEKDAY_LABELS[index],
        isoDate: formatIsoDate(date),
        date: String(date.getDate()).padStart(2, "0"),
        month: MONTH_LABELS[date.getMonth()],
        fullDate: date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      };
    });
  }, [weekOffset]);

  const selectedDayEntry =
    displayedDays.find((day) => day.id === selectedDay) ?? displayedDays[0];
  const selectedDateKey = selectedDayEntry.isoDate;
  const selectedTemplate =
    templatesByDate[selectedDateKey] ?? cloneTemplate(defaultTemplate);

  const openSlots = useMemo(
    () =>
      (["morning", "afternoon", "evening"] as const).reduce(
        (count, period) =>
          count +
          selectedTemplate[period].filter((slot) => slot.isAvailable).length,
        0,
      ),
    [selectedTemplate],
  );

  const hasUnsavedChanges = useMemo(
    () =>
      JSON.stringify(defaultTemplate) !== JSON.stringify(savedDefaultTemplate) ||
      JSON.stringify(templatesByDate) !== JSON.stringify(savedTemplatesByDate),
    [defaultTemplate, savedDefaultTemplate, templatesByDate, savedTemplatesByDate],
  );

  const setSelectedDateTemplate = (nextTemplate: DayTemplate) => {
    setTemplatesByDate((current) => ({
      ...current,
      [selectedDateKey]: nextTemplate,
    }));
  };

  const updateSelectedDateTemplate = (
    period: PeriodId,
    updater: (slots: TimeSlot[]) => TimeSlot[],
  ) => {
    const nextTemplate = cloneTemplate(selectedTemplate);
    nextTemplate[period] = updater(nextTemplate[period]);
    setSelectedDateTemplate(nextTemplate);
  };

  const applySlotChange = (
    period: PeriodId,
    slotId: string,
    patch: Partial<TimeSlot>,
  ) => {
    const nextTemplate = cloneTemplate(selectedTemplate);
    nextTemplate[period] = nextTemplate[period].map((slot) =>
      slot.id === slotId ? { ...slot, ...patch } : slot,
    );

    const overlapConflict = findOverlapConflict(nextTemplate, period, slotId);

    if (overlapConflict) {
      nextTemplate[period] = nextTemplate[period].map((slot) =>
        slot.id === slotId ? { ...slot, isAvailable: false } : slot,
      );

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedbackModal({
        visible: true,
        title: "Overlapping slot disabled",
        message: `${overlapConflict.currentLabel} overlaps with ${overlapConflict.conflictLabel}, so it was switched off automatically. Change the time to use it.`,
        tone: "error",
      });
    }

    setSelectedDateTemplate(nextTemplate);
  };

  const addSlot = (period: PeriodId) => {
    updateSelectedDateTemplate(period, (slots) => [...slots, createSlot(period)]);
    void Haptics.selectionAsync();
  };

  const removeSlot = (period: PeriodId, slotId: string) => {
    updateSelectedDateTemplate(period, (slots) =>
      slots.length > 1 ? slots.filter((slot) => slot.id !== slotId) : slots,
    );
    void Haptics.selectionAsync();
  };

  const goOverview = () => {
    router.replace({
      pathname: "/(counselor-tabs)/overview",
      params: { name: counselorName, specialty },
    });
  };

  const handleSave = () => {
    const activeSlots = (["morning", "afternoon", "evening"] as const)
      .flatMap((period) =>
        selectedTemplate[period].map((slot, index) => ({
          ...slot,
          period,
          label: `${PERIOD_META[period].title} Slot ${index + 1}`,
        })),
      )
      .filter((slot) => slot.isAvailable);

    for (const slot of activeSlots) {
      const startMinutes = parseTimeToMinutes(slot.startTime);
      const endMinutes = parseTimeToMinutes(slot.endTime);

      if (startMinutes === null || endMinutes === null) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFeedbackModal({
          visible: true,
          title: "Invalid time format",
          message: `${slot.label} needs a valid time like 09:00 AM.`,
          tone: "error",
        });
        return;
      }

      if (startMinutes >= endMinutes) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFeedbackModal({
          visible: true,
          title: "Invalid time range",
          message: `${slot.label} must end after it starts.`,
          tone: "error",
        });
        return;
      }
    }

    const sortedSlots = activeSlots
      .map((slot) => ({
        ...slot,
        startMinutes: parseTimeToMinutes(slot.startTime) ?? 0,
        endMinutes: parseTimeToMinutes(slot.endTime) ?? 0,
      }))
      .sort((left, right) => left.startMinutes - right.startMinutes);

    for (let index = 1; index < sortedSlots.length; index += 1) {
      const previousSlot = sortedSlots[index - 1];
      const currentSlot = sortedSlots[index];

      if (currentSlot.startMinutes < previousSlot.endMinutes) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFeedbackModal({
          visible: true,
          title: "Overlapping slots",
          message: `${previousSlot.label} overlaps with ${currentSlot.label}. Adjust the times so one session does not conflict with another.`,
          tone: "error",
        });
        return;
      }
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSavedDefaultTemplate(cloneTemplate(defaultTemplate));
    setSavedTemplatesByDate(cloneTemplatesByDate(templatesByDate));
    setFeedbackModal({
      visible: true,
      title: "Availability saved",
      message: `Your schedule for ${selectedDayEntry.fullDate} has been updated. ${openSlots} slot(s) are currently available.`,
      tone: "success",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
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
          <View style={styles.dayHeader}>
            <View>
              <Text style={styles.dayHeaderText}>SELECT DAY</Text>
              <Text style={styles.dayHeaderHint}>
                Choose a date and add as many slots as you need
              </Text>
            </View>
            <View style={styles.weekActions}>
              <TouchableOpacity
                style={styles.weekButton}
                activeOpacity={0.85}
                onPress={() => {
                  setWeekOffset((current) => current - 1);
                  setSelectedDay(WEEKDAY_IDS[0]);
                  void Haptics.selectionAsync();
                }}
              >
                <Feather name="chevron-left" size={16} color="#2F88E8" />
                <Text style={styles.weekButtonText}>Prev</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.weekButton}
                activeOpacity={0.85}
                onPress={() => {
                  setWeekOffset((current) => current + 1);
                  setSelectedDay(WEEKDAY_IDS[0]);
                  void Haptics.selectionAsync();
                }}
              >
                <Text style={styles.weekButtonText}>Next</Text>
                <Feather name="chevron-right" size={16} color="#2F88E8" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayRow}
          >
            {displayedDays.map((day) => {
              const isActive = day.id === selectedDay;

              return (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayCard, isActive && styles.dayCardActive]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedDay(day.id);
                    void Haptics.selectionAsync();
                  }}
                >
                  <Text
                    style={[styles.dayLabel, isActive && styles.dayLabelActive]}
                  >
                    {day.label}
                  </Text>
                  <Text
                    style={[styles.dayMonth, isActive && styles.dayMonthActive]}
                  >
                    {day.month}
                  </Text>
                  <Text
                    style={[styles.dayDate, isActive && styles.dayDateActive]}
                  >
                    {day.date}
                  </Text>
                  <Text
                    style={[
                      styles.dayFullDate,
                      isActive && styles.dayFullDateActive,
                    ]}
                  >
                    {day.fullDate}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.infoCard}>
            <Feather name="info" size={22} color="#2F88E8" />
            <Text style={styles.infoText}>
              Morning, afternoon, and evening stay as sections, but you can add
              multiple time slots under each one and decide whether each slot is
              available or off. Saved slots cannot overlap with each other.
            </Text>
          </View>

          {(["morning", "afternoon", "evening"] as const).map((period) => {
            const meta = PERIOD_META[period];
            const slots = selectedTemplate[period];

            return (
              <View key={period} style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleWrap}>
                    <View
                      style={[
                        styles.sectionDot,
                        { backgroundColor: meta.color },
                      ]}
                    />
                    <View>
                      <Text style={styles.sectionTitle}>{meta.title}</Text>
                      <Text style={styles.sectionHint}>{meta.hint}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.addSlotButton}
                    activeOpacity={0.88}
                    onPress={() => addSlot(period)}
                  >
                    <Feather name="plus" size={14} color="#2F88E8" />
                    <Text style={styles.addSlotButtonText}>Add Slot</Text>
                  </TouchableOpacity>
                </View>

                {slots.map((slot, index) => (
                  <View
                    key={slot.id}
                    style={[styles.slotCard, !slot.isAvailable && styles.slotCardOff]}
                  >
                    <View style={styles.slotCardHeader}>
                      <Text style={styles.slotCardTitle}>Slot {index + 1}</Text>
                      <View style={styles.slotHeaderActions}>
                        <TouchableOpacity
                          style={[
                            styles.slotToggle,
                            slot.isAvailable
                              ? styles.slotToggleOn
                              : styles.slotToggleOff,
                          ]}
                          activeOpacity={0.88}
                          onPress={() =>
                            applySlotChange(period, slot.id, {
                              isAvailable: !slot.isAvailable,
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.slotToggleText,
                              slot.isAvailable
                                ? styles.slotToggleTextOn
                                : styles.slotToggleTextOff,
                            ]}
                          >
                            {slot.isAvailable ? "Available" : "Off"}
                          </Text>
                        </TouchableOpacity>

                        {slots.length > 1 ? (
                          <TouchableOpacity
                            style={styles.removeSlotButton}
                            activeOpacity={0.88}
                            onPress={() => removeSlot(period, slot.id)}
                          >
                            <Feather name="trash-2" size={14} color="#D84C4C" />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.slotTimeRow}>
                      <View style={styles.timeFieldWrap}>
                        <Text style={styles.timeFieldLabel}>Start Time</Text>
                        <View style={styles.timeInputShell}>
                          <Feather name="clock" size={16} color="#7C8694" />
                          <TextInput
                            style={styles.timeInput}
                            value={slot.startTime}
                            onChangeText={(value) =>
                              applySlotChange(period, slot.id, {
                                startTime: value,
                              })
                            }
                            placeholder="08:00 AM"
                            placeholderTextColor="#A0A8B5"
                          />
                        </View>
                      </View>

                      <View style={styles.timeFieldWrap}>
                        <Text style={styles.timeFieldLabel}>End Time</Text>
                        <View style={styles.timeInputShell}>
                          <Feather name="clock" size={16} color="#7C8694" />
                          <TextInput
                            style={styles.timeInput}
                            value={slot.endTime}
                            onChangeText={(value) =>
                              applySlotChange(period, slot.id, {
                                endTime: value,
                              })
                            }
                            placeholder="09:00 AM"
                            placeholderTextColor="#A0A8B5"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.slotFooter}>
                      <Text style={styles.slotFooterLabel}>Current Range</Text>
                      <Text style={styles.slotFooterValue}>
                        {slot.startTime || "--"} - {slot.endTime || "--"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>

        {hasUnsavedChanges ? (
          <View style={styles.bottomPanel}>
            <View style={styles.capacityWrap}>
              <Text style={styles.capacityLabel}>TOTAL AVAILABILITY</Text>
              <Text style={styles.capacityValue}>{openSlots} Slots Open</Text>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.88}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Modal
          visible={feedbackModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setFeedbackModal((current) => ({ ...current, visible: false }))
          }
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() =>
                setFeedbackModal((current) => ({ ...current, visible: false }))
              }
            />
            <View style={styles.confirmSheet}>
              <View
                style={[
                  styles.confirmIconWrap,
                  feedbackModal.tone === "error" && styles.confirmIconWrapError,
                ]}
              >
                <Feather
                  name={feedbackModal.tone === "error" ? "alert-circle" : "check"}
                  size={24}
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
                activeOpacity={0.9}
                onPress={() =>
                  setFeedbackModal((current) => ({ ...current, visible: false }))
                }
              >
                <Text style={styles.confirmPrimaryText}>
                  {feedbackModal.tone === "error" ? "Fix Times" : "Done"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const cloneTemplatesByDate = (templates: Record<string, DayTemplate>) =>
  Object.fromEntries(
    Object.entries(templates).map(([date, template]) => [date, cloneTemplate(template)]),
  );

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
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIcon: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Inter",
    fontSize: 18,
    lineHeight: 22,
    color: "#111B2E",
    fontWeight: "800",
  },
  headerSpacer: {
    width: 32,
    height: 32,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#DEE2E9",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 164,
    gap: 14,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayHeaderText: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    color: "#727D8E",
    fontWeight: "800",
  },
  dayHeaderHint: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 17,
    color: "#8A93A3",
    fontWeight: "500",
    marginTop: 4,
    maxWidth: 190,
  },
  weekActions: {
    flexDirection: "row",
    gap: 8,
  },
  weekButton: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 12,
    backgroundColor: "#EAF3FE",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  weekButtonText: {
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 16,
    color: "#2F88E8",
    fontWeight: "700",
  },
  dayRow: {
    gap: 10,
    paddingRight: 10,
  },
  dayCard: {
    width: 108,
    minHeight: 152,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D7DDE7",
    backgroundColor: "#F7F9FB",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dayCardActive: {
    backgroundColor: "#2F88E8",
    borderColor: "#2F88E8",
    shadowColor: "#2F88E8",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dayLabel: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 18,
    color: "#6E7788",
    fontWeight: "800",
  },
  dayLabelActive: {
    color: "#FFFFFF",
  },
  dayMonth: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 15,
    color: "#8A93A3",
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  dayMonthActive: {
    color: "#DCEBFF",
  },
  dayDate: {
    fontFamily: "Inter",
    fontSize: 34,
    lineHeight: 40,
    color: "#111B2E",
    fontWeight: "800",
  },
  dayDateActive: {
    color: "#FFFFFF",
  },
  dayFullDate: {
    marginTop: 4,
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 15,
    color: "#758092",
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  dayFullDateActive: {
    color: "#DCEBFF",
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C9DEFA",
    backgroundColor: "#EAF3FF",
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 22,
    color: "#244CAD",
    fontWeight: "500",
  },
  sectionWrap: {
    gap: 10,
  },
  sectionHeader: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },
  sectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionTitle: {
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 20,
    color: "#1A2231",
    fontWeight: "800",
  },
  sectionHint: {
    marginTop: 2,
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 17,
    color: "#7A8494",
    fontWeight: "500",
  },
  addSlotButton: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    backgroundColor: "#EAF3FE",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  addSlotButtonText: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 15,
    color: "#2F88E8",
    fontWeight: "800",
  },
  slotCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CFE0F8",
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 14,
  },
  slotCardOff: {
    borderColor: "#E2E6ED",
    backgroundColor: "#F6F8FB",
  },
  slotCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotCardTitle: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 19,
    color: "#1A2231",
    fontWeight: "800",
  },
  slotHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slotToggle: {
    minWidth: 88,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  slotToggleOn: {
    backgroundColor: "#E7F1FE",
  },
  slotToggleOff: {
    backgroundColor: "#ECEFF4",
  },
  slotToggleText: {
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
  },
  slotToggleTextOn: {
    color: "#2F88E8",
  },
  slotToggleTextOff: {
    color: "#8A93A3",
  },
  removeSlotButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FDEEEE",
    justifyContent: "center",
    alignItems: "center",
  },
  slotTimeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeFieldWrap: {
    flex: 1,
    gap: 6,
  },
  timeFieldLabel: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    color: "#7A8494",
    fontWeight: "700",
  },
  timeInputShell: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D9E1EB",
    backgroundColor: "#FBFCFE",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeInput: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    color: "#1A2231",
    fontWeight: "600",
  },
  slotFooter: {
    borderRadius: 14,
    backgroundColor: "#F4F7FB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  slotFooterLabel: {
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 14,
    color: "#8A93A3",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  slotFooterValue: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 20,
    color: "#1A2231",
    fontWeight: "800",
  },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 62,
    borderTopWidth: 1,
    borderTopColor: "#DEE2E9",
    backgroundColor: "#F4F6F8",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  capacityWrap: {
    gap: 4,
  },
  capacityLabel: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    color: "#6D7686",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  capacityValue: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    color: "#151D2C",
    fontWeight: "800",
  },
  saveButton: {
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2F88E8",
    shadowColor: "#2F88E8",
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  saveButtonText: {
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 20,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.28)",
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
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#EAF3FE",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmIconWrapError: {
    backgroundColor: "#FDEEEE",
  },
  confirmTitle: {
    marginTop: 16,
    fontFamily: "Inter",
    fontSize: 22,
    lineHeight: 27,
    color: "#172133",
    fontWeight: "800",
    textAlign: "center",
  },
  confirmText: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 20,
    color: "#728096",
    fontWeight: "500",
  },
  confirmPrimaryButton: {
    marginTop: 22,
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2F88E8",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmPrimaryButtonError: {
    backgroundColor: "#D84C4C",
  },
  confirmPrimaryText: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 19,
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
