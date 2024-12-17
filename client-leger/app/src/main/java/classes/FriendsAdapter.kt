// classes/FriendsAdapter.kt
package classes

import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.widget.AppCompatButton
import androidx.appcompat.widget.AppCompatImageView
import androidx.core.content.ContextCompat
import androidx.core.content.res.ResourcesCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.auth0.androidlogin.R

// Définition des classes de données
sealed class FriendItem {
    abstract val userId: String
    abstract val username: String
    data class DiscoverPlayer(override val userId: String, override val username: String, var isPending: Boolean = false, var isBlocked: Boolean = false) : FriendItem()
    data class Friend(override val userId: String, override val username: String, var isBlocked: Boolean = false) : FriendItem()
    data class FriendRequest(val requestId: String, override val userId: String, override val username: String, var isBlocked: Boolean = false) : FriendItem()
}

// DiffUtil pour optimiser les mises à jour
class FriendDiffCallback : DiffUtil.ItemCallback<FriendItem>() {
    override fun areItemsTheSame(oldItem: FriendItem, newItem: FriendItem): Boolean {
        return when {
            oldItem is FriendItem.DiscoverPlayer && newItem is FriendItem.DiscoverPlayer ->
                oldItem.userId == newItem.userId
            oldItem is FriendItem.Friend && newItem is FriendItem.Friend ->
                oldItem.userId == newItem.userId
            oldItem is FriendItem.FriendRequest && newItem is FriendItem.FriendRequest ->
                oldItem.requestId == newItem.requestId
            else -> false
        }
    }

    override fun areContentsTheSame(oldItem: FriendItem, newItem: FriendItem): Boolean {
        return oldItem == newItem
    }
}

// Adapter utilisant ListAdapter et DiffUtil
class FriendsAdapter(
    private val onSendFriendRequest: (String) -> Unit,
    private val onAcceptRequest: (String) -> Unit,
    private val onRejectRequest: (String) -> Unit,
    private val onRemoveFriend: (String) -> Unit,
    private val onBlockUser: (String) -> Unit,
    private val avatarLoader: (String, ImageView) -> Unit
) : ListAdapter<FriendItem, RecyclerView.ViewHolder>(FriendDiffCallback()) {

    companion object {
        const val TYPE_ADD_FRIEND = 0
        const val TYPE_FRIEND = 1
        const val TYPE_REQUEST = 2
    }

    override fun getItemViewType(position: Int): Int {
        return when (getItem(position)) {
            is FriendItem.DiscoverPlayer -> TYPE_ADD_FRIEND
            is FriendItem.Friend -> TYPE_FRIEND
            is FriendItem.FriendRequest -> TYPE_REQUEST
            else -> throw IllegalStateException("Unknown item type at position $position")
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return when (viewType) {
            TYPE_ADD_FRIEND -> AddFriendViewHolder(
                inflater.inflate(R.layout.add_friend_item, parent, false)
            )
            TYPE_FRIEND -> FriendViewHolder(
                inflater.inflate(R.layout.friend_item, parent, false)
            )
            TYPE_REQUEST -> RequestViewHolder(
                inflater.inflate(R.layout.friend_request, parent, false)
            )
            else -> throw IllegalStateException("Unknown view type: $viewType")
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val item = getItem(position)) {
            is FriendItem.DiscoverPlayer -> (holder as AddFriendViewHolder).bind(
                item,
                onSendFriendRequest,
                onBlockUser,
                avatarLoader
            )
            is FriendItem.Friend -> (holder as FriendViewHolder).bind(
                item,
                onRemoveFriend,
                onBlockUser,
                avatarLoader
            )
            is FriendItem.FriendRequest -> (holder as RequestViewHolder).bind(
                item,
                onAcceptRequest,
                onRejectRequest,
                onBlockUser,
                avatarLoader
            )
        }
    }

    // Méthode pour mettre à jour les données de l'adapter
    fun updateData(newData: List<FriendItem>) {
        submitList(newData.toList()) // Utiliser toList() pour créer une copie immuable
        Log.d("FriendsAdapter", "updateData appelé avec ${newData.size} éléments")
    }

    // ViewHolder pour "Discover Community"
    class AddFriendViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val friendAvatarImageView: ImageView = itemView.findViewById(R.id.friendAvatar)
        private val friendNameTextView: TextView = itemView.findViewById(R.id.friendName)
        private val addFriendButton: AppCompatButton = itemView.findViewById(R.id.addFriendButton)
        private val blockButton: AppCompatImageView = itemView.findViewById(R.id.blockUser)

        fun bind(
            item: FriendItem.DiscoverPlayer,
            onSendFriendRequest: (String) -> Unit,
            onBlockUser: (String) -> Unit,
            avatarLoader: (String, ImageView) -> Unit
        ) {
            friendNameTextView.text = item.username
            avatarLoader(item.userId, friendAvatarImageView)

            blockButton.setOnClickListener {
                onBlockUser(item.userId)
            }

            Log.d("AddFriendViewHolder", "Binding player: ${item.username}, isPending: ${item.isPending}")

            if (item.isPending|| item.isBlocked) {
                addFriendButton.text = itemView.context.getString(R.string.requested)
                addFriendButton.backgroundTintList =
                    ContextCompat.getColorStateList(itemView.context, R.color.gold)
                val typeface = ResourcesCompat.getFont(itemView.context, R.font.quicksand_bold)
                addFriendButton.typeface = typeface

                addFriendButton.isEnabled = false
            } else {
                addFriendButton.text = itemView.context.getString(R.string.addFriend)
                addFriendButton.backgroundTintList =
                    ContextCompat.getColorStateList(itemView.context, R.color.lavender)
                val typeface = ResourcesCompat.getFont(itemView.context, R.font.quicksand_bold)
                addFriendButton.typeface = typeface
                addFriendButton.isEnabled = true
                addFriendButton.setOnClickListener {
                    onSendFriendRequest(item.userId)
                }
            }
        }
    }

    // ViewHolder pour l'onglet "Friends"
    class FriendViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val friendAvatarImageView: ImageView = itemView.findViewById(R.id.friendAvatar)
        private val friendNameTextView: TextView = itemView.findViewById(R.id.friendName)
        private val removeFriendButton: Button = itemView.findViewById(R.id.removeFriendButton)
        private val blockFriendButton:AppCompatImageView = itemView.findViewById(R.id.blockFriend)

        fun bind(
            item: FriendItem.Friend,
            onRemoveFriend: (String) -> Unit,
            onBlockUser: (String) -> Unit,
            avatarLoader: (String, ImageView) -> Unit
        ) {
            friendNameTextView.text = item.username
            avatarLoader(item.userId, friendAvatarImageView)

            removeFriendButton.setOnClickListener { onRemoveFriend(item.userId) }

            blockFriendButton.setOnClickListener {
                onBlockUser(item.userId)
            }
        }
    }

    // ViewHolder pour l'onglet "Friend Requests"
    class RequestViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val friendAvatarImageView: ImageView = itemView.findViewById(R.id.friendAvatar)
        private val friendNameTextView: TextView = itemView.findViewById(R.id.friendName)
        private val acceptButton: Button = itemView.findViewById(R.id.acceptFriendButton)
        private val rejectButton: Button = itemView.findViewById(R.id.declineFriendButton)
        private val blockUserButton: AppCompatImageView = itemView.findViewById(R.id.blockRequester)

        fun bind(
            item: FriendItem.FriendRequest,
            onAcceptRequest: (String) -> Unit,
            onRejectRequest: (String) -> Unit,
            onBlockUser: (String) -> Unit,
            avatarLoader: (String, ImageView) -> Unit
        ) {

            friendNameTextView.text = item.username
            avatarLoader(item.userId, friendAvatarImageView)

            acceptButton.setOnClickListener { onAcceptRequest(item.requestId) }
            rejectButton.setOnClickListener { onRejectRequest(item.requestId) }

            blockUserButton.setOnClickListener {
                onBlockUser(item.userId)
            }
        }
    }
}
