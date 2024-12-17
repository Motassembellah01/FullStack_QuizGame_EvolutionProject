package classes

import com.auth0.androidlogin.models.ITeam
import com.auth0.androidlogin.models.IPlayer

/**
 * Represents a Team in the match.
 *
 * @property name The name of the team.
 * @property players The list of players in the team.
 * @property teamScore The score of the team.
 */
class Team(
    override val name: String,
    override val players: MutableList<String>,
    override var teamScore: Float = 0.0F,
) : ITeam {

    /**
     * Checks if a player with the given name is part of the team.
     *
     * @param playerName The name of the player to check.
     * @return `true` if the player is in the team, `false` otherwise.
     */
    fun containsPlayer(playerName: String?): Boolean {
        return players.any { player -> player == playerName }
    }

        /**
         * Converts a list of ITeam instances to a list of Team instances.
         *
         * @param teams The list of ITeam instances to convert.
         * @return An ArrayList of Team instances.
         */
        companion object {
            fun parseTeams(rawTeams: List<Team>): MutableList<Team> {
                val parsedTeams = mutableListOf<Team>()
                for (rawTeam in rawTeams) {
                    val team = Team(
                        name = rawTeam.name,
                        players = rawTeam.players.toMutableList(),
                        teamScore = rawTeam.teamScore,
                        // teamBonuses = rawTeam.teamBonuses
                    )
                    parsedTeams.add(team)
                }
                return parsedTeams
            }
        }
}
