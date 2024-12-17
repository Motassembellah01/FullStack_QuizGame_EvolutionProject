/**
 * Interface to represent required chart data for each question in a match
 */
export interface QuestionChartData {
    labelList: string[];
    chartData: number[];
    chartColor: string;
    xLineText: string;
}
