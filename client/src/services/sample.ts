import { calendarDays, type ContributionYear } from "../../../shared/github";
export function sampleCity(): ContributionYear {
  const year = new Date().getFullYear() - 1;
  let seed = 1984;
  const days = calendarDays(year).map((day) => {
    seed = (seed * 16807) % 2147483647;
    const random = seed / 2147483647;
    const contributions =
      random < 0.26 || (day.weekday === 0 && random < 0.6)
        ? 0
        : Math.max(
            1,
            Math.floor(
              random ** 3 * 26 * (0.55 + 0.45 * Math.sin(day.week * 0.3) ** 2),
            ),
          );
    return { ...day, contributions };
  });
  return {
    username: "Sample city",
    year,
    days,
    totalContributions: days.reduce((sum, day) => sum + day.contributions, 0),
  };
}
