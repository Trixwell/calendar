export function buildWeekdayNames(intlTag: string): string[] {
    const fmt = new Intl.DateTimeFormat(intlTag, {weekday: 'short'});
    return Array.from({length: 7}, (_, i) => {
        const name = fmt.format(new Date(2024, 0, 1 + i, 12));
        return name.charAt(0).toLocaleUpperCase(intlTag) + name.slice(1);
    });
}
