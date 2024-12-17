package com.auth0.androidlogin.adapters

import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.auth0.androidlogin.R
import com.auth0.androidlogin.databinding.ItemSoloResultBinding
import classes.Player
import com.auth0.androidlogin.models.IPlayer

class SoloResultsAdapter : RecyclerView.Adapter<SoloResultsAdapter.PlayerViewHolder>() {

    private var players: List<IPlayer> = listOf()
    private var winnerPosition: Int? = null

    inner class PlayerViewHolder(private val binding: ItemSoloResultBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(player: IPlayer, position: Int) {
            binding.playerNameTextView.text = player.name
            binding.playerScoreTextView.text = "${player.score}"
            binding.playerBonusesTextView.text = "${player.nBonusObtained}"

            Log.d("SoloResAdapter", "Score : ${player.score}")
            // Show Winner Icon for the Top Player
            if (position == winnerPosition) {
                binding.winnerIcon.visibility = View.VISIBLE
            } else {
                binding.winnerIcon.visibility = View.GONE
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlayerViewHolder {
        val binding = ItemSoloResultBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return PlayerViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PlayerViewHolder, position: Int) {
        holder.bind(players[position], position)
    }

    override fun getItemCount(): Int = players.size

    fun submitList(playerList: List<IPlayer>) {
        players = playerList
        notifyDataSetChanged()
    }

    fun setWinnerPosition(position: Int) {
        winnerPosition = position
        notifyItemChanged(position)
    }
}
