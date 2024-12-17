package classes

import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.recyclerview.widget.RecyclerView
import com.auth0.androidlogin.R
import com.auth0.androidlogin.models.Avatar
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.RoundedCorners

class AvatarAdapter(
    private val avatars: List<Avatar>,
    private val onAvatarSelected: (Avatar) -> Unit
) : RecyclerView.Adapter<AvatarAdapter.AvatarViewHolder>() {

    private var selectedPosition: Int = RecyclerView.NO_POSITION

    inner class AvatarViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val avatarImageView: ImageView = itemView.findViewById(R.id.avatarImageView)
        val selectionOverlay: View = itemView.findViewById(R.id.selectionOverlay)

        init {
            itemView.setOnClickListener {
                val previousPosition = selectedPosition
                selectedPosition = adapterPosition
                notifyItemChanged(previousPosition)
                notifyItemChanged(selectedPosition)
                onAvatarSelected(avatars[adapterPosition])
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AvatarViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_avatar, parent, false)
        return AvatarViewHolder(view)
    }

    override fun onBindViewHolder(holder: AvatarViewHolder, position: Int) {
        val avatar = avatars[position]
        val cornerRadius = 30

        Glide.with(holder.itemView.context)
            .load(avatar.imageResId)
            .placeholder(R.drawable.image_not_found)
            .centerCrop()
            .transform(RoundedCorners(cornerRadius))
            .into(holder.avatarImageView)

        if (selectedPosition == position) {
            holder.selectionOverlay.visibility = View.VISIBLE
            holder.itemView.isSelected = true
        } else {
            holder.selectionOverlay.visibility = View.GONE
            holder.itemView.isSelected = false
        }
    }

    override fun getItemCount(): Int = avatars.size
}
