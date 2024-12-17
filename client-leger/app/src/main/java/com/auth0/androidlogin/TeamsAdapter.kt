package com.auth0.androidlogin.adapters

import MatchService
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import classes.Team
import com.auth0.androidlogin.adapters.PlayersAdapter
import com.auth0.androidlogin.databinding.ItemTeamBinding
import com.auth0.androidlogin.models.IPlayer
import com.auth0.androidlogin.utils.AuthUtils
import com.services.AccountService

class TeamsAdapter(
    private val teams: MutableList<Team>,
    private val onQuitTeamClick: ((Team) -> Unit)? = null,
    private val accountService: AccountService
) : RecyclerView.Adapter<TeamsAdapter.TeamViewHolder>() {

    private val matchService: MatchService = MatchService
    private var onJoinTeamClick: ((Team) -> Unit)? = null

    inner class TeamViewHolder(private val binding: ItemTeamBinding) : RecyclerView.ViewHolder(binding.root) {

        fun bind(team: Team) {
            // Set the team name, e.g., "Team Alpha"
            binding.teamNameTextView.text = team.name
            // Initialize the PlayersAdapter with the team's players
            val teamPlayers = mutableListOf<IPlayer>()
            val player1 = matchService.match!!.players.find{player -> player.name == team.players.getOrNull(0)}
            if (player1 != null) teamPlayers.add(player1)
            val player2 = matchService.match!!.players.find{player -> player.name == team.players.getOrNull(1)}
            if (player2 != null) teamPlayers.add(player2)
            val playersAdapter = PlayersAdapter(
                players = teamPlayers,
                isOrganizer = false, // Adjust based on your logic
                onBanClick = null, // Handle banning if necessary
                accountService = accountService
            )
            binding.teamPlayersRecyclerView.layoutManager = LinearLayoutManager(binding.root.context)
            binding.teamPlayersRecyclerView.adapter = playersAdapter

            // Retrieve the current user's name using the provided context
            val currentUserName = AuthUtils.getUserName(binding.root.context)

            val isInAnyTeam = teams.any { it.players.any { player -> player == currentUserName} }

            binding.quitTeamButton.visibility = if (team.players.any { player -> player == currentUserName}) View.VISIBLE else View.GONE
            binding.joinTeamButton.visibility = if (!isInAnyTeam && team.players.size < 2) View.VISIBLE else View.GONE

            binding.quitTeamButton.setOnClickListener {
                onQuitTeamClick?.invoke(team)
            }

            binding.joinTeamButton.setOnClickListener {
                onJoinTeamClick?.invoke(team)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TeamViewHolder {
        val binding = ItemTeamBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return TeamViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TeamViewHolder, position: Int) {
        holder.bind(teams[position])
    }

    override fun getItemCount(): Int = teams.size

    fun updateTeams(newTeams: List<Team>) {
        teams.clear()
        teams.addAll(newTeams)
        notifyDataSetChanged()
    }

    fun setOnJoinTeamClickListener(listener: (Team) -> Unit) {
        onJoinTeamClick = listener
    }
}
