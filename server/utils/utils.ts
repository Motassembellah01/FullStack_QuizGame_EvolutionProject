export class Utils {
    /**
     * Formats the given date to a consistent readable format.
     * @param date - The date to format (defaults to the current date).
     * @returns A formatted date string in the format 'MM/DD/YYYY, HH:mm:ss'.
     */
    static formatDateToReadable(date: Date = new Date()): string {
        return date.toLocaleString('en-US', {
            timeZone: 'America/Toronto',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }
}
