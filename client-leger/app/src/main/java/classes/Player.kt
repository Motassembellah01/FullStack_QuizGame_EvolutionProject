package classes

import com.auth0.androidlogin.models.IGame
import com.auth0.androidlogin.models.IPlayer

class Player(
    name: String,
    isActive: Boolean,
    score: Float,
    nBonusObtained: Int,
    chatBlocked: Boolean,
    prize: Int = 0
) : IPlayer(name, isActive, score, nBonusObtained, chatBlocked, prize) {

    companion object {
        fun parsePlayers(players: MutableList<IPlayer>): MutableList<IPlayer> {
            val playerList = players.map { player -> this.parsePlayer(player) }
            return ArrayList<IPlayer>(playerList)
        }

        fun parsePlayer(player: IPlayer): Player {
            return Player(player.name, player.isActive, player.score, player.nBonusObtained, player.chatBlocked, player.prize)
        }
    }
}
