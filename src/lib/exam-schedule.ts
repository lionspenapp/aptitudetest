export type ExamShieldMode =
  | "active"
  | "sleep_lockout"
  | "morning_warmup"
  | "flash_glance"
  | "working_memory_shield"
  | "exam_complete";

export function getSleepLockoutTime(examTimestamp: Date): Date {
  const lockout = new Date(examTimestamp);
  lockout.setDate(lockout.getDate() - 1);
  lockout.setHours(21, 0, 0, 0);
  return lockout;
}

export function getWorkingMemoryShieldTime(examTimestamp: Date): Date {
  const shield = new Date(examTimestamp);
  shield.setMinutes(shield.getMinutes() - 30);
  return shield;
}

export function getExamMorningStart(examTimestamp: Date): Date {
  const morning = new Date(examTimestamp);
  morning.setHours(6, 0, 0, 0);
  return morning;
}

export function getCurrentExamMode(
  examTimestamp: Date,
  now: Date = new Date(),
  options?: {
    warmUpComplete?: boolean;
    flashGlanceComplete?: boolean;
  }
): ExamShieldMode {
  if (now >= examTimestamp) return "exam_complete";

  const sleepLockout = getSleepLockoutTime(examTimestamp);
  const workingMemoryShield = getWorkingMemoryShieldTime(examTimestamp);
  const examMorning = getExamMorningStart(examTimestamp);

  if (now >= workingMemoryShield && now < examTimestamp) {
    return "working_memory_shield";
  }

  if (
    now >= examMorning &&
    now < workingMemoryShield &&
    options?.warmUpComplete &&
    !options?.flashGlanceComplete
  ) {
    return "flash_glance";
  }

  if (
    now >= examMorning &&
    now < workingMemoryShield &&
    !options?.warmUpComplete
  ) {
    return "morning_warmup";
  }

  if (now >= sleepLockout && now < examMorning) {
    return "sleep_lockout";
  }

  return "active";
}

export function formatExamCountdown(examTimestamp: Date, now: Date = new Date()): string {
  const diff = examTimestamp.getTime() - now.getTime();
  if (diff <= 0) return "Exam time";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m until exam`;
}
