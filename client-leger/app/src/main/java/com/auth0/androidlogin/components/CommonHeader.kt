package com.auth0.androidlogin.components

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.AttributeSet
import android.util.Log
import android.view.LayoutInflater
import android.view.MenuInflater
import android.view.View
import android.widget.ImageButton
import android.widget.PopupMenu
import android.widget.RelativeLayout
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.lifecycle.lifecycleScope
import com.auth0.androidlogin.FriendsActivity
import com.auth0.androidlogin.R
import com.auth0.androidlogin.utils.AuthUtils
import com.bumptech.glide.Glide
import com.bumptech.glide.request.RequestOptions
import com.services.AccountService
import com.services.FriendService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
private val coroutineScope = CoroutineScope(Dispatchers.Main)

class CommonHeader @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0
) : RelativeLayout(context, attrs, defStyleAttr) {

    private val userProfileImage: ImageButton
    private val userProfileInfo: TextView
    private val settingsButton: ImageButton
    private val chatButton: ImageButton
    private val friendsButton: ImageButton
    private val moneyButton: ImageButton
    private val moneyTextView: TextView
    private var requestBadge: TextView
    private lateinit var accountService: AccountService

    // private val editUsernameButton: ImageButton

    // Listener Interface
    interface CommonHeaderListener {

        fun onSettingsButtonClick()
        fun onProfileMenuItemClick(itemId: Int)
        fun onFriendsButtonClick()
        //fun onEditUsernameClick()
        fun onMoneyButtonClick()
//        fun onChatButtonClick()
        fun onFriendButtonClick()
    }

    private var listener: CommonHeaderListener? = null

    private val prefsListener = SharedPreferences.OnSharedPreferenceChangeListener { prefs, key ->
        when (key) {
            AuthUtils.KEY_USER_PROFILE_PICTURE_RES_ID,
            AuthUtils.KEY_USER_PROFILE_PICTURE_URL,
            AuthUtils.KEY_USER_PROFILE_PICTURE_BASE64 -> {
                Log.d("CommonHeader", "Avatar preference changed: $key")
                updateProfilePicture()
            }
            AuthUtils.KEY_COOKIES_BALANCE -> {
                Log.d("CommonHeader", "Cookie balance changed: $key")
                val newBalance = prefs.getInt(AuthUtils.KEY_COOKIES_BALANCE, 0)
                setMoneyBalance(newBalance)
            }
            AuthUtils.KEY_USER_NAME -> {
                Log.d("CommonHeader", "Username preference changed: $key")
                val newUsername = prefs.getString(AuthUtils.KEY_USER_NAME, "Utilisateur")
                setUsername(newUsername)
            }
            AuthUtils.KEY_FRIEND_REQUEST_COUNT -> {
                Log.d("CommonHeader", "Friend request count changed: $key")
                val newRequestCount = prefs.getInt(AuthUtils.KEY_FRIEND_REQUEST_COUNT, 0)
                setRequestCount(newRequestCount)
            }
        }
    }

    fun setListener(listener: CommonHeaderListener) {
        this.listener = listener
    }

    init {
        // Inflate the common header layout
        inflate(context, R.layout.common_header, this)

        // Bind the views
        userProfileImage = findViewById(R.id.imageview_user)
        userProfileInfo = findViewById(R.id.textview_user_profile)
        settingsButton = findViewById(R.id.settingsButton)
        chatButton = findViewById(R.id.chatButton)
        friendsButton = findViewById(R.id.friendsButton)
        moneyButton = findViewById(R.id.moneyButton)
        moneyTextView = findViewById(R.id.money_value)
        requestBadge = findViewById(R.id.requestBadge)
        userProfileImage.setOnClickListener { view ->
            showProfileMenu(view)
        }

        // Set up settings button click
        settingsButton.setOnClickListener {
            listener?.onSettingsButtonClick()
        }

//        editUsernameButton.setOnClickListener {
//            listener?.onEditUsernameClick()
//        }

        moneyButton.setOnClickListener {
            listener?.onMoneyButtonClick()
        }

        friendsButton.setOnClickListener(){
            listener?.onFriendButtonClick()
        }

        updateProfilePicture()
        updateMoneyBalance()
        updateRequestCount()

        val sharedPrefs = AuthUtils.getSharedPreferences(context)
        sharedPrefs.registerOnSharedPreferenceChangeListener(prefsListener)

        setUsername(AuthUtils.getUserName(context))
    }

    private fun showProfileMenu(view: android.view.View) {
        val popup = PopupMenu(context, view)
        val inflater: MenuInflater = popup.menuInflater
        inflater.inflate(R.menu.profile_menu, popup.menu)
        popup.setOnMenuItemClickListener { item ->
            listener?.onProfileMenuItemClick(item.itemId)
            true
        }
        popup.show()
    }

    private fun setUsername(username: String?) {
        userProfileInfo.text = username
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        val sharedPrefs = AuthUtils.getSharedPreferences(context)
        sharedPrefs.unregisterOnSharedPreferenceChangeListener(prefsListener)
        Log.d("CommonHeader", "Unregistered SharedPreferences listener.")
    }

    private fun setUserProfilePicture(base64Image: String) {

        if (base64Image.isNotEmpty()) {
            val base64String = if (base64Image.startsWith("data:image")) {
                base64Image.substringAfter(",")
            } else {
                base64Image
            }
            val decodedBytes = android.util.Base64.decode(base64String, android.util.Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            Glide.with(context)
                .load(bitmap)
                .apply(
                    RequestOptions.circleCropTransform()
                        .placeholder(R.drawable.image_not_found)
                        .error(R.drawable.image_not_found)
                )
                .into(userProfileImage)
            Log.d("CommonHeader", "Set profile picture from base64.")
        } else {
            Glide.with(context)
                .load(R.drawable.image_not_found)
                .apply(RequestOptions.circleCropTransform())
                .into(userProfileImage)
            Log.d("CommonHeader", "Set profile picture to default image.")
        }
    }

    fun updateProfilePicture() {
        val base64Image = AuthUtils.getUserProfilePictureBase64(context) ?: ""
        if (base64Image.isNotEmpty()) {
            setUserProfilePicture(base64Image)
        } else {
            val imageResId = AuthUtils.getUserProfilePictureResourceId(context) ?: 0
            if (imageResId != 0) {
                setUserProfilePicture(imageResId)
            } else {
                setUserProfilePicture(0) // Afficher l'image par défaut
            }
        }
    }

    fun setUserProfilePicture(imageResId: Int?) {
        if (imageResId != null && imageResId != 0)  {
            if (context is Activity && !(context as Activity).isDestroyed) {
                Glide.with(context)
                    .load(imageResId)
                    .apply(RequestOptions.circleCropTransform())
                    .placeholder(R.drawable.image_not_found) // Optional placeholder
                    .error(R.drawable.image_not_found) // Optional error image
                    .into(userProfileImage)
            }
        } else {
            if (context is Activity && !(context as Activity).isDestroyed) {
                Glide.with(context)
                    .load(R.drawable.image_not_found)
                    .apply(RequestOptions.circleCropTransform())
                    .into(userProfileImage)
            }
        }
    }

    // Function to set the welcome text
    fun setWelcomeText(userName: String) {
        userProfileInfo.text = userName
    }


    fun setMoneyBalance(balance: Int) {
        moneyTextView.text = "$balance"
        AuthUtils.storeCookieBalance(context, balance)
    }

    fun setChatButtonIcon(resourceId: Int) {
        chatButton.setImageResource(resourceId)
    }

    private fun updateMoneyBalance() {
        val sharedPrefs = AuthUtils.getSharedPreferences(context)
        val currentBalance = sharedPrefs.getInt(AuthUtils.KEY_COOKIES_BALANCE, 0)
        setMoneyBalance(currentBalance)
    }

    fun setRequestCount(count: Int) {
        requestBadge.text = count.toString()
        requestBadge.visibility = if (count > 0) View.VISIBLE else View.GONE
        AuthUtils.storeFriendRequestCount(context, count)
    }
    private fun updateRequestCount() {
        val sharedPrefs = AuthUtils.getSharedPreferences(context)
        val currentRequestCount = sharedPrefs.getInt(AuthUtils.KEY_FRIEND_REQUEST_COUNT, 0)
        setRequestCount(currentRequestCount)
    }

}
