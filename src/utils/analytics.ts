import { DailyStudyLog, LearningDomain, MacroDomainId } from '../types/learning';

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  studiedToday: boolean;
  totalActiveDays: number;
}

export interface MacroDomainMetric {
  categoryId: MacroDomainId;
  name: string;
  totalMinutes: number;
  totalHours: number;
  percentage: number;
  sessionCount: number;
  colorClass: string;
}

export interface DayActivity {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Lun", "Mar", etc.
  totalMinutes: number;
  totalHours: number;
  sessionCount: number;
  isToday: boolean;
  isFuture: boolean;
  domains: { name: string; minutes: number; macroDomainId: MacroDomainId }[];
}

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  monthLabel?: string;
  totalMinutes: number;
  sessionCount: number;
  level: 0 | 1 | 2 | 3 | 4;
  domains: { name: string; minutes: number }[];
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateISO(isoStr: string): Date {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Calculate streaks
export function calculateStreak(logs: DailyStudyLog[]): StreakInfo {
  if (logs.length === 0) {
    return { currentStreak: 0, bestStreak: 0, studiedToday: false, totalActiveDays: 0 };
  }

  const activeDatesSet = new Set<string>();
  logs.forEach((log) => {
    if (log.durationMinutes > 0) {
      activeDatesSet.add(log.date);
    }
  });

  const sortedDates = Array.from(activeDatesSet).sort((a, b) => b.localeCompare(a));
  const totalActiveDays = sortedDates.length;

  const todayStr = formatDateISO(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateISO(yesterday);

  const studiedToday = activeDatesSet.has(todayStr);

  let currentStreak = 0;
  let checkDate = new Date();
  if (!studiedToday) {
    if (activeDatesSet.has(yesterdayStr)) {
      checkDate = yesterday;
    } else {
      currentStreak = 0;
    }
  }

  if (studiedToday || activeDatesSet.has(yesterdayStr)) {
    while (true) {
      const dateStr = formatDateISO(checkDate);
      if (activeDatesSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate best streak historically
  let bestStreak = currentStreak;
  let runningStreak = 0;
  let previousDate: Date | null = null;

  const ascDates = Array.from(activeDatesSet).sort((a, b) => a.localeCompare(b));
  for (const dateStr of ascDates) {
    const curDate = parseDateISO(dateStr);
    if (!previousDate) {
      runningStreak = 1;
    } else {
      const diffTime = curDate.getTime() - previousDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
    }
    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }
    previousDate = curDate;
  }

  return {
    currentStreak,
    bestStreak,
    studiedToday,
    totalActiveDays,
  };
}

// Group logs by current week (Monday to Sunday)
export function getWeeklyData(logs: DailyStudyLog[], domainsMap: Map<string, LearningDomain>): DayActivity[] {
  const today = new Date();
  const currentDayOfWeek = (today.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - currentDayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const days: DayActivity[] = [];
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDateISO(d);
    const isToday = dateStr === formatDateISO(today);
    const isFuture = d > today && !isToday;

    const dayLogs = logs.filter((log) => log.date === dateStr);
    const totalMinutes = dayLogs.reduce((sum, l) => sum + l.durationMinutes, 0);

    const domainBreakdown: { name: string; minutes: number; macroDomainId: MacroDomainId }[] = dayLogs.map((l) => {
      const dom = domainsMap.get(l.subjectId);
      return {
        name: dom ? dom.name : 'Dominio General',
        minutes: l.durationMinutes,
        macroDomainId: dom ? dom.macroDomainId : 'custom',
      };
    });

    days.push({
      date: dateStr,
      dayLabel: dayNames[i],
      totalMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      sessionCount: dayLogs.length,
      isToday,
      isFuture,
      domains: domainBreakdown,
    });
  }

  return days;
}

// Macro-Domain distribution
export function getMacroDomainDistribution(
  logs: DailyStudyLog[],
  domainsMap: Map<string, LearningDomain>,
  macroDomainsList?: { id: string; shortLabel: string; name: string }[]
): MacroDomainMetric[] {
  const defaultNames: Record<string, string> = {
    formal_quantitative: 'Sistemas Físicos y Matemáticos',
    linguistic_communication: 'Culturas e Idiomas',
    technological_applied: 'Código y Tecnología',
    conceptual_normative_social: 'Sociedad y Entorno',
    custom: 'Personalizados',
  };

  const domainColors: Record<string, string> = {
    formal_quantitative: 'bg-violet-400',
    linguistic_communication: 'bg-sky-400',
    technological_applied: 'bg-emerald-400',
    conceptual_normative_social: 'bg-amber-400',
    custom: 'bg-rose-400',
  };

  const totals: Record<string, { minutes: number; sessions: number }> = {};
  let grandTotalMinutes = 0;

  logs.forEach((log) => {
    const dom = domainsMap.get(log.subjectId);
    const cat: string = dom ? dom.macroDomainId : 'custom';
    if (!totals[cat]) {
      totals[cat] = { minutes: 0, sessions: 0 };
    }
    totals[cat].minutes += log.durationMinutes;
    totals[cat].sessions += 1;
    grandTotalMinutes += log.durationMinutes;
  });

  const availableMacroList = macroDomainsList && macroDomainsList.length > 0
    ? macroDomainsList
    : [
        { id: 'formal_quantitative', shortLabel: 'Sistemas Físicos y Matemáticos', name: 'Sistemas Físicos y Matemáticos' },
        { id: 'linguistic_communication', shortLabel: 'Culturas e Idiomas', name: 'Culturas e Idiomas' },
        { id: 'technological_applied', shortLabel: 'Código y Tecnología', name: 'Código y Tecnología' },
        { id: 'conceptual_normative_social', shortLabel: 'Sociedad y Entorno', name: 'Sociedad y Entorno' },
        { id: 'custom', shortLabel: 'Personalizados', name: 'Personalizados' },
      ];

  return availableMacroList
    .map((macro) => {
      const entry = totals[macro.id] || { minutes: 0, sessions: 0 };
      const minutes = entry.minutes;
      const percentage = grandTotalMinutes > 0 ? Math.round((minutes / grandTotalMinutes) * 100) : 0;
      return {
        categoryId: macro.id,
        name: macro.shortLabel || defaultNames[macro.id] || macro.name,
        totalMinutes: minutes,
        totalHours: Number((minutes / 60).toFixed(1)),
        percentage,
        sessionCount: entry.sessions,
        colorClass: domainColors[macro.id] || 'bg-indigo-400',
      };
    })
    .filter((item) => item.totalMinutes > 0 || ['formal_quantitative', 'linguistic_communication', 'technological_applied', 'conceptual_normative_social'].includes(item.categoryId));
}

// Activity Heatmap Generator
export function getHeatmapGrid(logs: DailyStudyLog[], domainsMap: Map<string, LearningDomain>): HeatmapCell[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDayOfWeek = today.getDay(); // 0 is Sunday
  const daysUntilSunday = (7 - currentDayOfWeek) % 7;
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + daysUntilSunday);

  const numWeeks = 16;
  const totalDays = numWeeks * 7;
  
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  const logsByDate = new Map<string, DailyStudyLog[]>();
  logs.forEach((l) => {
    const existing = logsByDate.get(l.date) || [];
    existing.push(l);
    logsByDate.set(l.date, existing);
  });

  const weeks: HeatmapCell[][] = [];
  let currentPointer = new Date(startDate);
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let w = 0; w < numWeeks; w++) {
    const weekCells: HeatmapCell[] = [];
    let weekMonthLabel: string | undefined = undefined;

    for (let d = 0; d < 7; d++) {
      const dateStr = formatDateISO(currentPointer);
      const dayLogs = logsByDate.get(dateStr) || [];
      const totalMin = dayLogs.reduce((sum, log) => sum + log.durationMinutes, 0);

      if (currentPointer.getDate() === 1 || (w === 0 && d === 0)) {
        weekMonthLabel = monthNames[currentPointer.getMonth()];
      }

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (totalMin > 0 && totalMin <= 30) level = 1;
      else if (totalMin > 30 && totalMin <= 60) level = 2;
      else if (totalMin > 60 && totalMin <= 120) level = 3;
      else if (totalMin > 120) level = 4;

      const domains = dayLogs.map((l) => ({
        name: domainsMap.get(l.subjectId)?.name || 'Estudio',
        minutes: l.durationMinutes,
      }));

      weekCells.push({
        date: dateStr,
        dayOfWeek: currentPointer.getDay(),
        monthLabel: d === 0 ? weekMonthLabel : undefined,
        totalMinutes: totalMin,
        sessionCount: dayLogs.length,
        level,
        domains,
      });

      currentPointer.setDate(currentPointer.getDate() + 1);
    }
    weeks.push(weekCells);
  }

  return weeks;
}

// Domain statistics
export function getDomainStats(domain: LearningDomain, logs: DailyStudyLog[]) {
  const domLogs = logs.filter((l) => l.subjectId === domain.id);
  const totalMinutes = domLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
  const totalHours = Number((totalMinutes / 60).toFixed(1));
  const progressPercent = Math.min(100, Math.round((totalHours / (domain.targetHours || 1)) * 100));

  const completedMilestones = domain.milestones.filter((m) => m.completed).length;
  const totalMilestones = domain.milestones.length;
  const milestonePercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const comprehensionSum = domLogs.reduce((sum, l) => sum + l.comprehensionScore, 0);
  const avgComprehension = domLogs.length > 0 ? Number((comprehensionSum / domLogs.length).toFixed(1)) : 0;

  const lastLog = domLogs.sort((a, b) => b.date.localeCompare(a.date))[0];

  return {
    totalMinutes,
    totalHours,
    progressPercent,
    completedMilestones,
    totalMilestones,
    milestonePercent,
    avgComprehension,
    lastStudiedDate: lastLog ? lastLog.date : null,
    totalSessions: domLogs.length,
  };
}
