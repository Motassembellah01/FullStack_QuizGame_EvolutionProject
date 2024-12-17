// GameAdapter.kt
package classes

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.auth0.androidlogin.databinding.ItemGameBinding
import com.auth0.androidlogin.models.IGame

class GameAdapter(
    private val games: MutableList<IGame>,
    private val onItemClick: (IGame) -> Unit
) : RecyclerView.Adapter<GameAdapter.GameViewHolder>() {

    inner class GameViewHolder(private val binding: ItemGameBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(game: IGame) {
            binding.tvGameTitle.text = game.title
            binding.tvGameDescription.text = game.description

            binding.root.setOnClickListener {
                onItemClick(game)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GameViewHolder {
        val binding = ItemGameBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return GameViewHolder(binding)
    }

    override fun onBindViewHolder(holder: GameViewHolder, position: Int) {
        holder.bind(games[position])
    }

    override fun getItemCount(): Int = games.size

    fun addGames(newGames: List<IGame>) {
        val startPosition = games.size
        games.addAll(newGames)
        notifyItemRangeInserted(startPosition, newGames.size)
    }
}
