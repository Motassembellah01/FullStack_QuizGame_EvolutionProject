package classes

import MatchService.getString
import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.auth0.androidlogin.R
import com.auth0.androidlogin.models.Matches

class MatchAdapter(
    private val context: Context,
    private val matches: List<Matches>,
    private val isCurrentMatches: Boolean,
    private val onMatchClick: ((String, Boolean) -> Unit)?
) : RecyclerView.Adapter<MatchAdapter.MatchViewHolder>() {

    inner class MatchViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val accessCodeTextView: TextView = itemView.findViewById(R.id.accessCodeTextView)
        val quizNameTextView: TextView = itemView.findViewById(R.id.quizNameTextView)
        val playersCountTextView: TextView = itemView.findViewById(R.id.playersCountTextView)
        val lockIcon: ImageView = itemView.findViewById(R.id.lockIcon) // Référence à l'icône

        // Références aux nouvelles vues pour le prix
        val feeTextView: TextView = itemView.findViewById(R.id.feeTextView)
        val dollarSign: TextView = itemView.findViewById(R.id.dollarSign)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MatchViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_match, parent, false)
        return MatchViewHolder(view)
    }

    override fun onBindViewHolder(holder: MatchViewHolder, position: Int) {
        val match = matches[position]
        if (match.isFriendMatch) {
            holder.accessCodeTextView.text = "${match.accessCode} ${context.getString(R.string.friendsMatch)} ${match.managerName}"
        } else {
            holder.accessCodeTextView.text = "${match.accessCode} - Public"
        }
        holder.quizNameTextView.text = "${match.quizName}"
        holder.playersCountTextView.text = "${match.playersCount}"

        if (isCurrentMatches) {
            if (match.isAccessible) {
                // Accessible matches in green
                holder.itemView.setBackgroundColor(
                    ContextCompat.getColor(holder.itemView.context, R.color.t_green)
                )
                holder.itemView.isClickable = true
                holder.itemView.isEnabled = true
                holder.lockIcon.setImageResource(R.drawable.unlocked)
            } else {
                holder.itemView.setBackgroundColor(
                    if (match.hasStarted) {
                        ContextCompat.getColor(holder.itemView.context, R.color.t_red)
                    } else {
                        ContextCompat.getColor(holder.itemView.context, R.color.t_grey)
                    }
                )
                holder.itemView.isClickable = true // Permettre le clic pour afficher les questions
                holder.itemView.isEnabled = true
                holder.lockIcon.setImageResource(R.drawable.locked)
            }
        } else {
            // Started games in red
            holder.itemView.setBackgroundColor(
                ContextCompat.getColor(holder.itemView.context, R.color.t_red)
            )
            holder.itemView.isClickable = false
            holder.itemView.isEnabled = false
            holder.lockIcon.setImageResource(R.drawable.locked)
        }

        if (match.isPricedMatch) {
            holder.dollarSign.visibility = View.VISIBLE
            holder.feeTextView.visibility = View.VISIBLE
            holder.feeTextView.text = match.priceMatch.toString()
        } else {
            holder.dollarSign.visibility = View.GONE
            holder.feeTextView.visibility = View.GONE
        }

        holder.itemView.setOnClickListener {
            onMatchClick?.invoke(match.accessCode, match.isAccessible)
        }
    }

    override fun getItemCount(): Int = matches.size

}
