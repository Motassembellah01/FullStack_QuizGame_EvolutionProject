package classes;
import com.auth0.androidlogin.models.IChoice
import com.auth0.androidlogin.models.IQuestion;

class Question(
    id: String,
    type: String,
    text: String,
    points: Int,
    choices: List<Choice>,
    timeAllowed: Int,
    tolerance: Float,
    lowerBound: Float,
    upperBound: Float,
    image: String?,
) : IQuestion(id, type, text, points, choices, timeAllowed, tolerance, lowerBound, upperBound, image) {

    companion object {
        fun parseQuestion(question: IQuestion) : Question {
            val parsedChoice = question.choices.map { iChoice -> Choice(iChoice.text, iChoice.isCorrect) }
            return Question(question.id, question.type, question.text, question.points, parsedChoice,
                            question.timeAllowed, question.tolerance, question.lowerBound, question.upperBound, question.image)
        }
    }

    fun getRightChoicesNumber(): Int {
        var nRightChoices = 0
        for (choice in this.choices) {
            if (choice.isCorrect) nRightChoices++
        }
        return nRightChoices
    }
}
