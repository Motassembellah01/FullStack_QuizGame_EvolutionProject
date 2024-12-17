package classes

import com.auth0.androidlogin.models.IMatch
import com.auth0.androidlogin.models.IObserver
import com.auth0.androidlogin.models.IPlayer
import com.auth0.androidlogin.models.IPlayerAnswers
import com.auth0.androidlogin.models.ITeam

class Match(
    game: Game,
    begin: String,
    end: String,
    bestScore: Int,
    accessCode: String,
    testing: Boolean,
    players:  MutableList<IPlayer>,
    observers: MutableList<IObserver>,
    managerName: String,
    managerId: String,
    isAccessible: Boolean,
    isFriendMatch: Boolean,
    bannedNames: MutableList<String>,
    playerAnswers: MutableList<IPlayerAnswers>,
    panicMode: Boolean,
    timer: Int,
    timing: Boolean,
    isTeamMatch: Boolean,
    isPricedMatch: Boolean,
    priceMatch: Number,
    nbPlayersJoined: Number = 0,
    teams: MutableList<Team>,
    currentQuestionIndex: Number
) : IMatch(game, begin, end, bestScore, accessCode, testing, players, observers, managerName, managerId, isAccessible, isFriendMatch,
    bannedNames, playerAnswers, panicMode, timer, timing, isTeamMatch, isPricedMatch, priceMatch, nbPlayersJoined, teams, currentQuestionIndex) {
    fun getSoloPlayers(): List<IPlayer> {
        return players.filter { player ->
            teams.none { team -> team.players.any{ it == player.name} }
        }
    }
    companion object {
        fun parseMatch(match: IMatch): Match {
            val game = Game.parseGame(match.game)
            val players = Player.parsePlayers(match.players)
            val playerAnswers = PlayerAnswers.parsePlayerAnswers(match.playerAnswers)
            val teams = Team.parseTeams(match.teams)
            val parsedMatch = Match(game, match.begin, match.end, match.bestScore, match.accessCode,
                match.testing, players, match.observers, match.managerName, match.managerId, match.isAccessible,
                match.isFriendMatch, match.bannedNames, playerAnswers, match.panicMode, match.timer,
                match.timing, match.isTeamMatch, match.isPricedMatch, match.priceMatch, match.nbPlayersJoined, teams, match.currentQuestionIndex)
            return parsedMatch
        }
    }
}
