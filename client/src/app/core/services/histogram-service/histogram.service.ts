import { Injectable } from '@angular/core';
import { CHART_COLOR, HISTOGRAM_TEXTS, QUESTION_TYPE, SocketsOnEvents } from '@app/core/constants/constants';
import { ChoiceCount } from '@app/core/interfaces/choice-count';
import { PlayerAnswers } from '@app/core/interfaces/player-answers';
import { QuestionChartData } from '@app/core/interfaces/questions-chart-data';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { Chart } from 'chart.js/auto';

/**
 * This class allows to handle the business logic for the histogram through all the components
 * where he is used.
 */
@Injectable({
    providedIn: 'root',
})
export class HistogramService {
    isShowingQuestionResults: boolean = false;
    isShowingMatchResults: boolean = false;
    currentChartIndex: number = 0;
    questionsChartData: QuestionChartData[] = [];
    chart: Chart;
    playersAnswered: string[] = [];
    playersWithFinalAnswers: string[] = [];
    quittedPlayers: string[] = [];
    choicesCount: ChoiceCount[] = [];
    chartData: number[] = [];
    labelList: string[];
    chartColor: string = '';
    xLineText: string = '';
    questionsStats: Map<string, number[]> = new Map();

    constructor(public matchPlayerService: MatchPlayerService) {}

    resetAttributes(): void {
        this.isShowingQuestionResults = false;
        this.isShowingMatchResults = false;
        this.currentChartIndex = 0;
        this.questionsChartData = [];
        this.chart = null as any;
        this.playersAnswered = [];
        this.playersWithFinalAnswers = [];
        this.quittedPlayers = [];
        this.choicesCount = [];
        this.chartData = [];
        this.labelList = [];
        this.chartColor = '';
        this.xLineText = '';
        this.questionsStats = new Map();
    }

    getCurrentQuestionAnswers(): PlayerAnswers[] {
        return this.matchPlayerService.match.playerAnswers?.filter(
            (currentAnswers: PlayerAnswers) => currentAnswers.questionId === this.matchPlayerService.currentQuestion.id,
        );
    }

    countQcmSelectedChoices(): void {
        const currentQuestionAnswers: PlayerAnswers[] = this.getCurrentQuestionAnswers();
        currentQuestionAnswers.forEach((playerCurrentAnswers) => {
            const playerIndex = this.matchPlayerService.match.findPlayerIndexByName(playerCurrentAnswers.name);
            if (this.matchPlayerService.match.players[playerIndex].isActive) {
                this.choicesCount.forEach((choice) => {
                    const choiceIndex: number = playerCurrentAnswers.qcmAnswers?.findIndex(
                        (existingChoice) => existingChoice.text === choice.choice.text,
                    );
                    if (choiceIndex >= 0) {
                        choice.nSelected++;
                    }
                });
            }
        });
    }

    countQrlInteractions(): void {
        let nPlayersInteracted = 0;
        const currentQuestionAnswers: PlayerAnswers[] = this.getCurrentQuestionAnswers();
        currentQuestionAnswers?.forEach((playerCurrentAnswers) => {
            if (playerCurrentAnswers.isTypingQrl) nPlayersInteracted++;
        });
        this.chartData = [nPlayersInteracted, this.matchPlayerService.match.players.length - nPlayersInteracted];
    }

    initializeMatchChartChoices(): string[] {
        this.choicesCount = [];
        if (this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qcm) {
            return this.matchPlayerService.currentQuestion.choices.map((choice, index) => {
                const symbol = choice.isCorrect ? '✔' : '✘';
                this.choicesCount.push({ choice, nSelected: 0 });
                return `Choix ${index + 1} ${symbol}`;
            });
        } else {
            this.chartData = [0, this.matchPlayerService.match.players.length];
            this.countQrlInteractions();
            return [HISTOGRAM_TEXTS.playersInteract, HISTOGRAM_TEXTS.playersDidNotInteract];
        }
    }

    initializeResultsChartData(): void {
        this.chartData = this.questionsChartData[this.currentChartIndex].chartData;
        this.labelList = this.questionsChartData[this.currentChartIndex].labelList;
        this.chartColor = this.questionsChartData[this.currentChartIndex].chartColor;
        this.xLineText = this.questionsChartData[this.currentChartIndex].xLineText;
    }

    setupChart(): void {
        if (this.isShowingQuestionResults && this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qrl) this.setupQrlChartInResultView();
        else if (this.isShowingMatchResults) this.initializeResultsChartData();
        else this.setUpMatchChart();
    }

    setupQrlChartInResultView(): void {
        this.labelList = ['0%', '50%', '100%'];
        this.chartData = [0, 0, 0];
        this.chartColor = CHART_COLOR.qrl;
        this.xLineText = HISTOGRAM_TEXTS.percentages;
        const playersQcmFactors: number[] | undefined = this.questionsStats.get(this.matchPlayerService.currentQuestion.id);
        playersQcmFactors?.map((factor) => this.chartData[factor * 2]++);
    }

    setUpMatchChart(): void {
        this.labelList = this.initializeMatchChartChoices();
        if (this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qcm) {
            this.chartColor = CHART_COLOR.qcm;
            this.xLineText = HISTOGRAM_TEXTS.answersChoices;
            this.countQcmSelectedChoices();
            this.chartData = this.choicesCount.map((choice) => {
                return choice.nSelected;
            });
        } else {
            this.chartColor = CHART_COLOR.qrl;
            this.xLineText = HISTOGRAM_TEXTS.playersInteraction;
            this.countQrlInteractions();
        }
    }

    createChart(): void {
        this.setupChart();
        this.chart = new Chart('statistic-chart', {
            type: 'bar',
            data: {
                labels: this.labelList,
                datasets: [
                    {
                        label: HISTOGRAM_TEXTS.playersNumber,
                        data: this.chartData,
                        backgroundColor: this.chartColor,
                    },
                ],
            },
            options: {
                scales: {
                    x: { title: { display: true, text: this.xLineText } },
                    y: { title: { display: true, text: HISTOGRAM_TEXTS.players }, ticks: { stepSize: 1 } },
                },
            },
        });
    }

    updatePlayerAnswersList(answers: PlayerAnswers[]): void {
        const answerListLength = answers.length;
        if (answers && answers[answerListLength - 1] && answers[answerListLength - 1].qcmAnswers && answers[answerListLength - 1].qcmAnswers[0])
            this.playersAnswered.push(answers[answerListLength - 1].name);
        if (answers[answerListLength - 1]?.isFirstAttempt)
            this.playersAnswered.push(this.matchPlayerService.match.playerAnswers[answerListLength - 1].name);
    }

    /**
     * Setup web sockets event listeners
     */
    setupListeners(): void {
        this.matchPlayerService.socketService.on<PlayerAnswers[]>(SocketsOnEvents.AnswerUpdated, (answers: PlayerAnswers[]) => {
            this.matchPlayerService.match.playerAnswers = answers;
            this.updatePlayerAnswersList(answers);
            if (!this.isShowingQuestionResults) {
                if (this.chart) {
                    this.chart.destroy();
                }
                this.createChart();
            }
        });
    }
}
