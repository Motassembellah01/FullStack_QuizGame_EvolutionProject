import { Choice } from './choice';

/**
 * Interface to represent the choices of a question
 * and how many choices are selected.
 */
export interface ChoiceCount {
    choice: Choice;
    nSelected: number;
}
