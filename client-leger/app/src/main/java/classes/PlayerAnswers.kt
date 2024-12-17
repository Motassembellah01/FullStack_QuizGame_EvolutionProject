package classes

import com.auth0.androidlogin.models.IChoice
import com.auth0.androidlogin.models.IPlayerAnswers

class PlayerAnswers(
    name: String,
    lastAnswerTime: String,
    final: Boolean,
    questionId: String,
    obtainedPoints: Float,
    qcmAnswers: List<IChoice>?,
    qrlAnswer: String,
    isTypingQrl: Boolean,
    qreAnswer: Float,
    isFirstAttempt: Boolean? = null // Optional field
): IPlayerAnswers(name, lastAnswerTime, final, questionId, obtainedPoints,
                  qcmAnswers, qrlAnswer, isTypingQrl, qreAnswer, isFirstAttempt) {
    companion object {
        /**
         * Parse a list of IPlayerAnswers to PlayerAnswers objects
         */
        fun parsePlayerAnswers(playerAnswers: List<IPlayerAnswers>): MutableList<IPlayerAnswers> {
            val playerAnswerList = playerAnswers.map { playerAnswer -> this.parsePlayerAnswer(playerAnswer) }
            return ArrayList(playerAnswerList)
        }

        /**
         * Parse a single IPlayerAnswers to PlayerAnswers object
         */
        fun parsePlayerAnswer(playerAnswer: IPlayerAnswers): PlayerAnswers {
            // Assuming IChoice is the base type for choices, and you want to map them to the correct class
            val choiceList: List<Choice> = playerAnswer.qcmAnswers!!.map { choice -> Choice(choice.text, choice.isCorrect) }
            return PlayerAnswers(
                playerAnswer.name,
                playerAnswer.lastAnswerTime,
                playerAnswer.final,
                playerAnswer.questionId,
                playerAnswer.obtainedPoints,
                choiceList,
                playerAnswer.qrlAnswer,
                playerAnswer.isTypingQrl,
                playerAnswer.qreAnswer,
                playerAnswer.isFirstAttempt
            )
        }
    }
}
