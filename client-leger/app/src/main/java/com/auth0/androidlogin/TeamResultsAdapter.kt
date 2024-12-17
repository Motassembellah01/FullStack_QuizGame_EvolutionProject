package com.auth0.androidlogin.adapters

import MatchService
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import classes.Team
import com.auth0.androidlogin.R
import com.auth0.androidlogin.databinding.ItemTeamResultBinding
import com.auth0.androidlogin.models.ITeam

class TeamResultsAdapter : RecyclerView.Adapter<TeamResultsAdapter.TeamViewHolder>() {

    private var teams: List<Team> = listOf()
    private var winnerPosition: Int? = null
    private val matchService: MatchService = MatchService

    inner class TeamViewHolder(private val binding: ItemTeamResultBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(team: Team, position: Int) {
            binding.teamNameTextView.text = team.name
            val player1 = matchService.match!!.players.find{player -> player.name == team.players.getOrNull(0)}
            val player2 = matchService.match!!.players.find{player -> player.name == team.players.getOrNull(1)}
            binding.player1TextView.text = "${team.players.getOrNull(0)} (${player1?.score})"
            binding.player2TextView.text = "${team.players.getOrNull(1)} (${player2?.score})"

            if (player1 != null && player2 != null) {
                binding.teamBonusesTextView.text = "${player1.nBonusObtained + player2.nBonusObtained}"
                team.teamScore = player1.score + player2.score
            }
            else if (player1 != null) {
                binding.teamBonusesTextView.text = "${player1.nBonusObtained}"
                team.teamScore = player1.score
            }
            else if (player2 != null) {
                binding.teamBonusesTextView.text = "${player2.nBonusObtained}"
                team.teamScore = player2.score
            }
            else {
                Log.d("TeamResultsAdapter", "Both players are null.")
            }

            binding.teamScoreTextView.text = "${team.teamScore}"

            // Show Winner Icon for the Top Team
            if (position == winnerPosition) {
                binding.teamWinnerIcon.visibility = View.VISIBLE
            } else {
                binding.teamWinnerIcon.visibility = View.GONE
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TeamViewHolder {
        val binding = ItemTeamResultBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return TeamViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TeamViewHolder, position: Int) {
        holder.bind(teams[position], position)
    }

    override fun getItemCount(): Int = teams.size

    fun submitList(teamList: List<Team>) {
        teams = teamList
        notifyDataSetChanged()
    }

    fun setWinnerPosition(position: Int) {
        winnerPosition = position
        notifyItemChanged(position)
    }
}
