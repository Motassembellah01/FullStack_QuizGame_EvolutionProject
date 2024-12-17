package com.auth0.androidlogin.adapters

import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.RecyclerView
import com.auth0.androidlogin.R
import com.auth0.androidlogin.databinding.ItemPlayerBinding
import com.auth0.androidlogin.models.IPlayer
import com.auth0.androidlogin.utils.AuthUtils
import com.bumptech.glide.Glide
import com.bumptech.glide.request.RequestOptions
import com.services.AccountService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class PlayersAdapter(
    private var players: MutableList<IPlayer>,
    private val isOrganizer: Boolean,
    private val accountService: AccountService,
    private val onBanClick: ((IPlayer) -> Unit)? = null
) : RecyclerView.Adapter<PlayersAdapter.PlayerViewHolder>() {

    // Coroutine scope for asynchronous operations
    private val adapterScope = CoroutineScope(Dispatchers.Main + Job())

    // Cache to store avatar URLs or resource IDs based on userId
    private val avatarCache = mutableMapOf<String, AvatarData>()

    // Data class to hold avatar information
    private data class AvatarData(
        val resId: Int? = null,
        val base64: String? = null,
        val avatarUrl: String? = null
    )

    inner class PlayerViewHolder(private val binding: ItemPlayerBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(player: IPlayer) {
            binding.playerNameTextView.text = player.name

            val currentUserName = AuthUtils.getUserName(binding.root.context)
            val isCurrentUser = currentUserName == player.name

            if (isOrganizer) {
                binding.banIconImageView.visibility = View.VISIBLE
                binding.banIconImageView.setOnClickListener {
                    onBanClick?.invoke(player)
                }
            } else {
                binding.banIconImageView.visibility = View.GONE
            }

            loadAvatar(player, binding.profilePictureImageView, isCurrentUser)

        }

        private fun loadAvatar(player: IPlayer, imageView: ImageView, isCurrentUser: Boolean) {
            if (isCurrentUser) {
                // Load current user's avatar from local storage
                val (resId, base64) = AuthUtils.getUserProfilePicture(binding.root.context)
                when {
                    resId != null && resId != 0 -> {
                        Glide.with(binding.profilePictureImageView.context)
                            .load(resId)
                            .apply(
                                RequestOptions()
                                    .placeholder(R.drawable.image_not_found)
                                    .error(R.drawable.image_not_found)
                                    .circleCrop()
                            )
                            .into(imageView)
                    }
                    !base64.isNullOrEmpty() -> {
                        Glide.with(binding.profilePictureImageView.context)
                            .load(base64)
                            .apply(
                                RequestOptions()
                                    .placeholder(R.drawable.image_not_found)
                                    .error(R.drawable.image_not_found)
                                    .circleCrop()
                            )
                            .into(imageView)
                    }
                    else -> {
                        imageView.setImageResource(R.drawable.image_not_found)
                    }
                }
            } else {
                val userName = player.name
                val cachedAvatar = avatarCache[userName]
                when {
                    cachedAvatar != null -> {
                        // Avatar is cached, load it
                        when {
                            cachedAvatar.resId != null && cachedAvatar.resId != 0 -> {
                                Glide.with(binding.profilePictureImageView.context)
                                    .load(cachedAvatar.resId)
                                    .apply(
                                        RequestOptions()
                                            .placeholder(R.drawable.image_not_found)
                                            .error(R.drawable.image_not_found)
                                            .circleCrop()
                                    )
                                    .into(imageView)
                            }
                            !cachedAvatar.base64.isNullOrEmpty() -> {
                                Glide.with(binding.profilePictureImageView.context)
                                    .load(cachedAvatar.base64)
                                    .apply(
                                        RequestOptions()
                                            .placeholder(R.drawable.image_not_found)
                                            .error(R.drawable.image_not_found)
                                            .circleCrop()
                                    )
                                    .into(imageView)
                            }
                            !cachedAvatar.avatarUrl.isNullOrEmpty() -> {
                                Glide.with(binding.profilePictureImageView.context)
                                    .load(cachedAvatar.avatarUrl)
                                    .apply(
                                        RequestOptions()
                                            .placeholder(R.drawable.image_not_found)
                                            .error(R.drawable.image_not_found)
                                            .circleCrop()
                                    )
                                    .into(imageView)
                            }
                            else -> {
                                imageView.setImageResource(R.drawable.image_not_found)
                            }
                        }
                    }
                    else -> {
                        // Avatar not cached, fetch it asynchronously
                        imageView.setImageResource(R.drawable.image_not_found) // Set a placeholder

                        adapterScope.launch{
                            try {
                                val account = accountService.getAccountByUsername(userName)
                                val avatarUrl = account?.avatarUrl
                                Log.d("PlayersAdapter", "avatar url -----> $avatarUrl")

                                // avatarCache[userName] = AvatarData(avatarUrl = avatarUrl)

                                if (!avatarUrl.isNullOrEmpty()) {
                                    when {
                                        avatarUrl.startsWith("data:image") -> {
                                            Glide.with(binding.profilePictureImageView.context)
                                                .load(avatarUrl)
                                                .apply(
                                                    RequestOptions()
                                                        .placeholder(R.drawable.image_not_found)
                                                        .error(R.drawable.image_not_found)
                                                        .circleCrop()
                                                )
                                                .into(imageView)
                                        }
                                        else -> {
                                            val resIdFromUrl = accountService.getResourceIdFromImageUrl(avatarUrl)
                                            Log.d("PlayersAdapter", "avatar url resIdFromUrl -----> $resIdFromUrl")
                                            if (resIdFromUrl != null && resIdFromUrl != 0) {
                                                // Load from resource ID
                                                Glide.with(binding.profilePictureImageView.context)
                                                    .load(resIdFromUrl)
                                                    .apply(
                                                        RequestOptions()
                                                            .placeholder(R.drawable.image_not_found)
                                                            .error(R.drawable.image_not_found)
                                                            .circleCrop()
                                                    )
                                                    .into(imageView)
                                            } else {
                                                // Load from URL
                                                Glide.with(binding.profilePictureImageView.context)
                                                    .load(avatarUrl)
                                                    .apply(
                                                        RequestOptions()
                                                            .placeholder(R.drawable.image_not_found)
                                                            .error(R.drawable.image_not_found)
                                                            .circleCrop()
                                                    )
                                                    .into(imageView)
                                            }
                                        }
                                    }
                                } else {
                                    imageView.setImageResource(R.drawable.image_not_found)
                                }
                            } catch (e: Exception) {
                                Log.e("PlayersAdapter", "Failed to load avatar for userName: $userName, error: ${e.message}")
                                imageView.setImageResource(R.drawable.image_not_found)
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlayerViewHolder {
        val binding = ItemPlayerBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return PlayerViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PlayerViewHolder, position: Int) {
        holder.bind(players[position])
    }

    override fun getItemCount(): Int = players.size

    fun updatePlayers(newPlayers: List<IPlayer>) {
        players.clear()
        players.addAll(newPlayers)
        notifyDataSetChanged()
    }

    fun clear() {
        adapterScope.cancel()
    }
}
