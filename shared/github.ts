export interface ContributionDay {
  date: string;
  weekday: number;
  week: number;
  contributions: number;
}
export interface ContributionYear {
  username: string;
  year: number;
  totalContributions: number;
  days: ContributionDay[];
}
export function calendarDays(year: number): ContributionDay[] {
  const start = new Date(Date.UTC(year, 0, 1));
  const days: ContributionDay[] = [];
  for (
    let date = new Date(start);
    date.getUTCFullYear() === year;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    days.push({
      date: date.toISOString().slice(0, 10),
      weekday: date.getUTCDay(),
      week: Math.floor((days.length + start.getUTCDay()) / 7),
      contributions: 0,
    });
  }
  return days;
}
