package classes

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.auth0.androidlogin.R
import com.auth0.androidlogin.models.MatchHistory
import interfaces.MatchHistoryEvent

class MatchHistoryAdapter : RecyclerView.Adapter<MatchHistoryAdapter.PlayedGamesViewHolder>() {

    private var playedGamesList: List<MatchHistory> = listOf()

    // Update the data
    fun setData(newData: List<MatchHistory>) {
        playedGamesList = newData
        notifyDataSetChanged()
    }

    // ViewHolder Class
    class PlayedGamesViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val gameNameTextView: TextView = itemView.findViewById(R.id.gameNameTextView)
        val startTimeTextView: TextView = itemView.findViewById(R.id.startTimeTextView)
        val statusImageView: ImageView = itemView.findViewById(R.id.statusImageView)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlayedGamesViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_match_history, parent, false)
        return PlayedGamesViewHolder(view)
    }

    override fun onBindViewHolder(holder: PlayedGamesViewHolder, position: Int) {
        val match = playedGamesList[position]
        holder.gameNameTextView.text = match.gameName
        holder.startTimeTextView.text = formatStartTime(match.datePlayed)
        // Set status image based on Win or Lose
        if (match.won) {
            holder.statusImageView.setImageResource(R.drawable.ic_win) // Replace with your win icon
            holder.gameNameTextView.setTextColor(holder.itemView.context.getColor(R.color.darkGreen))

        } else {
            holder.statusImageView.setImageResource(R.drawable.ic_lose) // Replace with your lose icon
            holder.gameNameTextView.setTextColor(holder.itemView.context.getColor(R.color.red))

        }
    }

    override fun getItemCount(): Int {
        return playedGamesList.size
    }

    // Helper function to format start time
    private fun formatStartTime(datePlayed: String): String {
        // Simple formatting; consider using SimpleDateFormat or other date libraries
        return datePlayed.replace("T", " ")
    }
}
