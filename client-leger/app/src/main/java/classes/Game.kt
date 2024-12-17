package classes
import com.auth0.androidlogin.models.IGame

class Game(
    id: String,
    title: String,
    isVisible: Boolean,
    description: String,
    duration: Int,
    questions: List<Question>,
    creator: String?,
    lastModification: String,
) : IGame(id, title, isVisible, description, duration, questions, creator, lastModification) {
    companion object {
        fun parseGames(games: ArrayList<IGame>): ArrayList<Game> {
            val gameList = games.map { game -> this.parseGame(game) }
            return ArrayList<Game>(gameList)
        }

        fun parseGame(game: IGame): Game {
            val parseQuestions = game.questions.map { iQuestion -> Question.parseQuestion(iQuestion) }
            return Game(game.id, game.title, game.isVisible, game.description, game.duration, ArrayList<Question>(parseQuestions),
                game.creator, game.lastModification)
        }
    }
}
