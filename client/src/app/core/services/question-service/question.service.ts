/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Question } from '@app/core/classes/question/question';
import { CHAR_SETS, FACTORS, LENGTHS, POINTS, QUESTION_TYPE } from '@app/core/constants/constants';
import { Choice } from '@app/core/interfaces/choice';
import { AlertDialogComponent } from '@app/shared/alert-dialog/alert-dialog.component';

@Injectable({
    providedIn: 'root',
})
/**
 * Manages the question's list of a new game to create or a game that need to be modified
 */
export class QuestionService {
    questions: Question[] = [];
    errorMessages: string[] = [];

    constructor(private dialog: MatDialog) {}

    resetQuestions(): void {
        this.questions = [];
    }

    getQuestionByIndex(index: number): Question {
        return this.questions[index];
    }

    /**
     * Add a question to the question's list after validating it or displays errors if the question isn't valid
     * @param Question question to add
     * @returns if the question was added successfully to the question's list
     */
    addQuestion(question: Question): boolean {
        if (this.validateQuestion(question)) {
            question.id = this.generateId(LENGTHS.questionId);
            this.questions.push(question);
            return true;
        } else {
            this.displayErrors();
            return false;
        }
    }

    /**
     * Displays the errors that caused the non validation of a question
     */
    displayErrors(): void {
        if (this.errorMessages.length > 0) {
            this.dialog.open(AlertDialogComponent, {
                data: {
                    title: "ERROR_QUESTION.SAVE",
                    messages: this.errorMessages
                }
            });
        }
        this.errorMessages = [];
    }

    /**
     * Validates a question that needs to be updated or displays errors if the question isn't valid
     * @param Question question to validate
     * @returns if the question is valid
     */
    validateUpdatedQuestion(question: Question): boolean {
        if (this.validateQuestion(question)) return true;
        else {
            this.displayErrors();
            return false;
        }
    }

    /**
     * Cancels the modifications made on a question
     * @param previousQuestion question with the version of data to keep
     * @param index index of the question to keep in the questions list
     */
    cancelQuestionModification(previousQuestion: Question, index: number): void {
        if (this.questions.length > index) {
            this.questions[index] = previousQuestion;
        }
    }

    generateId(length: number): string {
        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * CHAR_SETS.id.length);
            result += CHAR_SETS.id.charAt(randomIndex);
        }

        return result;
    }

    /**
     * Validate that question's informations respects the specificities
     * @param question question to validate
     * @returns if the question is valid
     */
    validateQuestion(question: Question): boolean {
        if (this.validateQuestionsInputs(question)) {
            if (question.type === QUESTION_TYPE.qcm) {
                return this.validateQcmAnswers(question.choices);
            }
            if (question.type === QUESTION_TYPE.qrl) return true;
            if (question.type === QUESTION_TYPE.qre) return this.isQREValidationSuccessful(question);
        }
        return false;
    }

    /**
     * Validates all questions if the questions list
     * @returns if all the question are valid
     */
    validateAllQuestions(): boolean {
        if (this.questions.length === 0) return false;
        return this.questions.every((question) => this.validateQuestion(question));
    }

    validateQuestionsInputs(question: Question): boolean {
        const pointsAreValid = this.validatePoints(question.points);
        if (!pointsAreValid) this.errorMessages.push('ERROR_QUESTION.POINTS');

        const descriptionIsValid = this.validateTextField(question.text);
        if (!descriptionIsValid)
            this.errorMessages.push('ERROR_QUESTION.STATEMENT');
        const typeIsValid =
            question.type.toUpperCase() === QUESTION_TYPE.qcm ||
            question.type.toUpperCase() === QUESTION_TYPE.qrl ||
            question.type.toUpperCase() === QUESTION_TYPE.qre;
        if (!typeIsValid)
            this.errorMessages.push('ERROR_QUESTION.TYPE');

        return typeIsValid && descriptionIsValid && pointsAreValid;
    }

    validatePoints(points: number): boolean {
        return points !== undefined && points <= POINTS.max && points >= POINTS.min;
    }

    validateTextField(textfield: string): boolean {
        return typeof textfield === 'string' && textfield !== undefined && textfield.trim() !== '';
    }

    validateQcmAnswers(choices: Choice[]): boolean {
        if (choices !== undefined && Array.isArray(choices) && choices.length !== 0) {
            const allChoicesTextsAreValid = choices.every((choice) => this.validateTextField(choice.text));
            if (!allChoicesTextsAreValid) {
                this.errorMessages.push('ERROR_QUESTION.ALL_CHOICES');
            }
            const choicesTextsAreDifferent = this.validateChoicesTexts(choices);
            if (!choicesTextsAreDifferent) {
                this.errorMessages.push('ERROR_QUESTION.UNIQUE_CHOICE');
            }

            const hasAtLeastOneGoodChoice = this.hasGoodChoice(choices);
            if (!hasAtLeastOneGoodChoice) {
                this.errorMessages.push('ERROR_QUESTION.CORRECT_CHOICE');
            }
            const hasAtLeastOneBadChoice = this.hasBadChoice(choices);
            if (!hasAtLeastOneBadChoice) {
                this.errorMessages.push('ERROR_QUESTION.WRONG_CHOICE');
            }

            return allChoicesTextsAreValid && choicesTextsAreDifferent && hasAtLeastOneGoodChoice && hasAtLeastOneBadChoice;
        } else {
            this.errorMessages.push('ERROR_QUESTION.CHOICES');
            return false;
        }
    }

    hasGoodChoice(choices: Choice[]): boolean {
        return choices.some((choice) => choice.isCorrect);
    }

    hasBadChoice(choices: Choice[]): boolean {
        return choices.some((choice) => !choice.isCorrect);
    }

    validateChoicesTexts(choices: Choice[]): boolean {
        const uniqueChoicesTexts: string[] = [];
        choices.forEach((choice) => {
            if (!uniqueChoicesTexts.includes(choice.text)) uniqueChoicesTexts.push(choice.text);
        });
        return uniqueChoicesTexts.length === choices.length;
    }

    validateQREMargin(question: Question): boolean {
        if (question.lowerBound !== null && question.upperBound !== null && question.tolerance !== null) {
            if (question.lowerBound < question.upperBound) {
                const range = question.upperBound - question.lowerBound;
                const maxTolerance = range * FACTORS.tolerancePercentage;
                if (question.tolerance > maxTolerance) {
                    this.errorMessages.push('ERROR_QUESTION.TOLERANCE');
                    return false;
                }
                return true;
            }
        }
        return false;
    }

    validateQRELowerBound(question: Question): boolean {
        if (question.lowerBound !== null && question.correctAnswer !== null) {
            if (question.lowerBound <= question.correctAnswer) {
                return true;
            } else {
                this.errorMessages.push('ERROR_QUESTION.LOWER_BOUND');
            }
        }
        return false;
    }

    validateQREUpperBound(question: Question): boolean {
        if (question.upperBound !== null && question.correctAnswer !== null) {
            if (question.upperBound >= question.correctAnswer) {
                return true;
            } else {
                this.errorMessages.push('ERROR_QUESTION.UPPER_BOUND');
            }
        }
        return false;
    }

    validateQREInputs(question: Question): boolean {
        if (question.lowerBound !== null && question.upperBound !== null && question.correctAnswer !== null && question.tolerance !== null) {
            if (question.lowerBound < question.upperBound) {
                return true;
            } else {
                this.errorMessages.push('ERROR_QUESTION.LOWER_GREATER_THAN_UPPER');
                return false;
            }
        }
        this.errorMessages.push('ERROR_QUESTION.ALL_RESPONSES');
        return false;
    }

    isQREValidationSuccessful(question: Question): boolean {
        const isValid =
            this.validateQREInputs(question) &&
            this.validateQREMargin(question) &&
            this.validateQRELowerBound(question) &&
            this.validateQREUpperBound(question);
        return isValid;
    }
}
