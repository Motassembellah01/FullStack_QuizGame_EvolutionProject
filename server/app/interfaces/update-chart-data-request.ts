/**
 * Interface to represent required chart data for each question in a match
 */
interface QuestionChartData {
    labelList: string[];
    chartData: number[];
    chartColor: string;
    xLineText: string;
}

/**
 * Interface used in the update of the questions chart
 */
export interface UpdateChartDataRequest {
    matchAccessCode: string;
    questionChartData: QuestionChartData;
}
