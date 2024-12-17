package com.services

import constants.SERVER_URL
import android.app.AlertDialog
import android.content.Context
import android.text.Editable
import android.text.InputFilter
import android.text.InputType
import android.text.TextWatcher
import android.util.Log
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import com.auth0.androidlogin.R
import com.auth0.androidlogin.models.Account
import com.auth0.androidlogin.utils.AuthUtils
import okhttp3.OkHttpClient
import okhttp3.Request
import com.google.gson.Gson
import com.google.rpc.context.AttributeContext.Auth
import interfaces.dto.FriendRequestData
import com.google.type.Money
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException

class AccountService(private val context: Context) {
    interface UpdateAvatarCallback {
        fun onSuccess()
        fun onFailure(errorMessage: String)
    }
    interface UsernameUpdateListener {
        fun onUsernameUpdated(newUsername: String)
        fun onUsernameUpdateFailed(errorMessage: String)
    }

    private val client = OkHttpClient()
    private val serverUrlRoot = "$SERVER_URL/api" // Replace with actual server URL

    suspend fun getAccount(): Account? {
        val userId = AuthUtils.getUserId(context)
        val accessToken = AuthUtils.getAccessToken(context)

        Log.d("AccountService", "Requesting account for userId: $userId")
        Log.d("AccountService", "access Token: $accessToken")

        val request = Request.Builder()
            .url("$serverUrlRoot/accounts/$userId")
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            val response = client.newCall(request).execute()

            if (response.isSuccessful) {
                val responseBody = response.body?.string()
                Log.d("AccountService", "Response Body: $responseBody")
                return@withContext Gson().fromJson(responseBody, Account::class.java)
            } else {
                Log.e("AccountService", "Error: ${response.code} - ${response.message}")
                Log.e("AccountService", "Response Body: ${response.body?.string()}")
                null
            }
        }
    }

    suspend fun getAccountByUserId(userId: String): Account? {
        val accessToken = AuthUtils.getAccessToken(context)

        val request = Request.Builder()
            .url("$serverUrlRoot/accounts/$userId")
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            val response = client.newCall(request).execute()

            if (response.isSuccessful) {
                val responseBody = response.body?.string()
                Log.d("AccountService", "Response Body: $responseBody")
                return@withContext Gson().fromJson(responseBody, Account::class.java)
            } else {
                Log.e("AccountService", "Error: ${response.code} - ${response.message}")
                Log.e("AccountService", "Response Body: ${response.body?.string()}")
                null
            }
        }
    }

    suspend fun getPseudonymByUserId(userId: String): String? {
        val account = getAccountByUserId(userId)
        return account?.pseudonym
    }

    suspend fun getAvatarByUserId(userId: String): String? {
        val account = getAccountByUserId(userId)
        return account?.avatarUrl
    }


    suspend fun updateAvatar(avatarUrl: String): Boolean {
        val userId = AuthUtils.getUserId(context)
        val accessToken = AuthUtils.getAccessToken(context)

        if (userId.isNullOrEmpty() || accessToken.isNullOrEmpty()) {
            Log.e("AccountService", "User ID or Access Token is missing.")
            return false
        }

        val url = "$serverUrlRoot/accounts/$userId/avatar"

        // Create JSON payload
        val json = JSONObject()
        json.put("avatarUrl", avatarUrl)

        val requestBody = json.toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

        val request = Request.Builder()
            .url(url)
            .patch(requestBody)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            try {
                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    Log.d("AccountService", "Avatar updated successfully to $avatarUrl")
                    if (avatarUrl.startsWith("data:image")) {
                        AuthUtils.storeUserProfilePicture(context, avatarUrl)
                    } else {
                        val resId = getResourceIdFromImageUrl(avatarUrl)
                        AuthUtils.storeUserProfilePicture(context, resId, avatarUrl)
                    }
                    true
                } else {
                    Log.e("AccountService", "Failed to update avatar: ${response.code} - ${response.message}")
                    false
                }
            } catch (e: Exception) {
                Log.e("AccountService", "Exception while updating avatar: ${e.message}")
                false
            }
        }
    }

    fun getResourceIdFromImageUrl(imageUrl: String): Int {
        return when (imageUrl) {
            "m1.png" -> R.drawable.m1
            "m2.png" -> R.drawable.m2
            "m3.png" -> R.drawable.m3
            "w1.jpg" -> R.drawable.w1
            "akali.png" -> R.drawable.akali
            "ww.png" -> R.drawable.ww
            "yone.png" -> R.drawable.yone
            "ahri.png" -> R.drawable.ahri
            else -> R.drawable.image_not_found
        }
    }

    suspend fun getAccountTheme(): String?{
        val account = getAccount()
        return account?.themeVisual
    }

    suspend fun getAccountMoney(): Int?{
        val account = getAccount()
        return account?.money
    }

    suspend fun updateAccountMoney(money: Int): Boolean {
        val userId = AuthUtils.getUserId(context)
        val accessToken = AuthUtils.getAccessToken(context)

        val json = JSONObject()
        json.put("money", money)

        val requestBody = json.toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
        val moneyUrl = "$serverUrlRoot/accounts/$userId/money"

        val request = Request.Builder()
            .url(moneyUrl)
            .patch(requestBody)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                Log.d("AccountService", "Theme updated to $money successfully!")
                true
            } else {
                Log.e("AccountService", "Failed to update theme: ${response.code}")
                false
            }
        }
    }

    suspend fun getProfilePicture(): String?{
        val account = getAccount()
        val avatarUrl = account?.avatarUrl
        Log.d("AccountService", "avatar url --- $avatarUrl")
        return avatarUrl
    }


    suspend fun fetchAndStoreCurrentAvatar() {
        val avatarUrl = getProfilePicture()
        if (!avatarUrl.isNullOrEmpty()) {
            if (avatarUrl.startsWith("data:image")) {
                // Avatar personnalisé en base64
                AuthUtils.storeUserProfilePicture(context, avatarUrl)
                Log.d("AccountService", "Fetched avatarUrl (base64) from server and stored locally: $avatarUrl")
            } else {
                // Avatar prédéfini
                val resId = getResourceIdFromImageUrl(avatarUrl)
                AuthUtils.storeUserProfilePicture(context, resId, avatarUrl)
                Log.d("AccountService", "Fetched avatarUrl from server and stored locally: $avatarUrl")
            }
        } else {
            Log.d("AccountService", "No avatar URL found on server.")
            AuthUtils.storeUserProfilePicture(context, R.drawable.image_not_found, "")
        }
    }

    suspend fun updatePseudonym(newPseudonym: String): Boolean {
        val userId = AuthUtils.getUserId(context)
        val accessToken = AuthUtils.getAccessToken(context)

        if (userId.isNullOrEmpty() || accessToken.isNullOrEmpty()) {
            Log.e("AccountService", "User ID or Access Token is missing.")
            return false
        }

        val url = "$SERVER_URL/api/accounts/$userId/pseudonym"

        // Create JSON payload
        val json = JSONObject()
        json.put("newPseudonym", newPseudonym)

        val requestBody = json.toString().toRequestBody("application/json".toMediaTypeOrNull())

        val request = Request.Builder()
            .url(url)
            .patch(requestBody)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            try {
                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    Log.d("AccountService", "Pseudonym updated successfully to $newPseudonym")
                    // Mettre à jour le nom d'utilisateur dans SharedPreferences
                    AuthUtils.storeUserName(context, newPseudonym)
                    Log.d("AccountService", "NEW USER NAME --- $newPseudonym")
                    true
                } else {
                    Log.e("AccountService", "Failed to update pseudonym: ${response.code} - ${response.message}")
                    false
                }
            } catch (e: Exception) {
                Log.e("AccountService", "Exception while updating pseudonym: ${e.message}")
                false
            }
        }
    }

    suspend fun updateTheme(theme: String): Boolean {
        val userId = AuthUtils.getUserId(context)
        val accessToken = AuthUtils.getAccessToken(context)

        val themeUrl = "$serverUrlRoot/accounts/$userId/theme/$theme"
        val requestBody = "".toRequestBody("application/json".toMediaTypeOrNull())

        val request = Request.Builder()
            .url(themeUrl)
            .patch(requestBody)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                Log.d("AccountService", "Theme updated to $theme successfully!")
                true
            } else {
                Log.e("AccountService", "Failed to update theme: ${response.code}")
                false
            }
        }
    }

    suspend fun updateOwnedAvatars(ownedAvatars: List<String>): Boolean {
        val userId = AuthUtils.getUserId(context)
        val accessToken = AuthUtils.getAccessToken(context)

        val url = "$serverUrlRoot/accounts/$userId/ownedAvatars"
        // Create JSON payload
        val json = JSONObject()
        json.put("ownedAvatars", JSONArray(ownedAvatars))

        val requestBody = json.toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

        val request = Request.Builder()
            .url(url)
            .patch(requestBody)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            val response = client.newCall(request).execute()
            response.isSuccessful
        }
    }


    suspend fun updateOwnedThemes(ownedThemes: List<String>): Boolean {
        val userId = AuthUtils.getUserId(context)
        val accessToken = AuthUtils.getAccessToken(context)

        val url = "$serverUrlRoot/accounts/$userId/ownedThemes"
        // Create JSON payload
        val json = JSONObject()
        json.put("ownedThemes", JSONArray(ownedThemes))

        val requestBody = json.toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

        val request = Request.Builder()
            .url(url)
            .patch(requestBody)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            val response = client.newCall(request).execute()
            response.isSuccessful
        }
    }

    suspend fun getOwnedThemes(): List<String>? {
        val userId = AuthUtils.getUserId(context)
        val account = getAccountByUserId(userId!!)
        return account?.visualThemesOwned
    }

    suspend fun getOwnedAvatars(): List<String>? {
        val userId = AuthUtils.getUserId(context)
        val account = getAccountByUserId(userId!!)
        return account?.avatarsUrlOwned
    }

    suspend fun getAccountLanguage(): String? {
        val userId = AuthUtils.getUserId(context)
        val accessToken = AuthUtils.getAccessToken(context)
        val request = Request.Builder()
            .url("$serverUrlRoot/accounts/$userId")
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val responseBody = response.body?.string()
                val account = Gson().fromJson(responseBody, Account::class.java)
                account?.lang
            } else {
                null
            }
        }
    }

    fun showEditUsernameDialog(listener: UsernameUpdateListener) {
        val builder = AlertDialog.Builder(context)
        builder.setTitle(R.string.modifyName)

        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(50, 40, 50, 10) // Adjust padding as needed
        }

        val input = EditText(context).apply {
            hint = context.getString(R.string.modifyName)
            inputType = InputType.TYPE_CLASS_TEXT
            maxLines = 1
            // Apply the 12-character limit
            filters = arrayOf(InputFilter.LengthFilter(12))
            setText(AuthUtils.getUserName(context)) // Pre-fill with current username
        }

        layout.addView(input)

        val charCount = TextView(context).apply {
            text = "0/12"
            setTextColor(android.graphics.Color.GRAY)
            textSize = 12f
        }

        layout.addView(charCount)

        builder.setView(layout)

        // Set up the buttons
        builder.setPositiveButton("OK", null) // We'll override the click listener later
        builder.setNegativeButton(R.string.cancel) { dialog, _ ->
            dialog.cancel()
        }
        val dialog = builder.create()
        dialog.show()

        dialog.getButton(AlertDialog.BUTTON_POSITIVE).isEnabled = false

        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
            val newUsername = input.text.toString().trim()
            if (newUsername.isNotEmpty() && newUsername.length <= 12) {
                CoroutineScope(Dispatchers.Main).launch {
                    val success = updatePseudonym(newUsername)
                    if (success) {
                        Toast.makeText(context, R.string.nameSuccess, Toast.LENGTH_SHORT).show()
                        listener.onUsernameUpdated(newUsername)
                        dialog.dismiss()
                    } else {
                        Toast.makeText(context, R.string.nameFailed, Toast.LENGTH_SHORT).show()
                        listener.onUsernameUpdateFailed(context.getString(R.string.nameFailed))
                    }
                }
            } else {
                Toast.makeText(context, R.string.nameEmpty, Toast.LENGTH_SHORT).show()
            }
        }

        input.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                val length = s?.length ?: 0
                charCount.text = "$length/12"

                // Enable "OK" button only if input is valid
                val isValid = length in 1..12
                dialog.getButton(AlertDialog.BUTTON_POSITIVE).isEnabled = isValid

                if (length == 12) {
                    Toast.makeText(context, R.string.nameExceeded, Toast.LENGTH_SHORT).show()
                }
            }

            override fun afterTextChanged(s: Editable?) {}
        })
    }


    suspend fun updateLanguage(language: String): Boolean {
        val userId = AuthUtils.getUserId(context)
        val accessToken = AuthUtils.getAccessToken(context)

        val url = "$serverUrlRoot/accounts/$userId/lang/$language"
        val requestBody = "".toRequestBody("application/json".toMediaTypeOrNull())

        val request = Request.Builder()
            .url(url)
            .patch(requestBody)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            val response = client.newCall(request).execute()
            response.isSuccessful
        }
    }

    suspend fun getAccountByUsername(pseudonym: String): Account? {
        val url = "$serverUrlRoot/accounts/pseudonym"

        // Create JSON payload with the pseudonym
        val json = JSONObject()
        json.put("pseudonym", pseudonym)

        val requestBody = json.toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .build()

        return withContext(Dispatchers.IO) {
            try {
                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                    Log.d("AccountService", "Response Body: $responseBody")
                    return@withContext Gson().fromJson(responseBody, Account::class.java)
                } else {
                    Log.e("AccountService", "Error fetching account by pseudonym: ${response.code} - ${response.message}")
                    null
                }
            } catch (e: IOException) {
                Log.e("AccountService", "Network error: ${e.message}")
                null
            }
        }
    }

    suspend fun getFriends(): List<String> {
        return withContext(Dispatchers.IO) {
            try {
                val account = getAccount()
                Log.d("AccountService", "Friends: ${account?.friends}")
                account?.friends ?: emptyList()
            } catch (e: Exception) {
                Log.e("AccountService", "Failed to fetch friends: ${e.message}")
                emptyList()
            }
        }
    }

    suspend fun getFriendRequests(): List<FriendRequestData> {
        return withContext(Dispatchers.IO) {
            try {
                val account = getAccount()
                account?.friendRequests ?: emptyList()
            } catch (e: Exception) {
                Log.e("AccountService", "Failed to fetch friend requests from account: ${e.message}")
                emptyList()
            }
        }
    }

    suspend fun getFriendRequestsThatUserRequested(): List<String> {
        return withContext(Dispatchers.IO) {
            try {
                val account = getAccount()
                val sentRequests = account?.friendsThatUserRequested
                if (sentRequests.isNullOrEmpty()) {
                    Log.d("AccountService", "No sent friend requests found.")
                } else {
                    Log.d("AccountService", "Sent Friend Requests: $sentRequests")
                }
                sentRequests ?: emptyList()
            } catch (e: Exception) {
                Log.e("AccountService", "Failed to fetch sent friend requests: ${e.message}")
                emptyList()
            }
        }
    }


    suspend fun getAccounts(): List<Account> {
        val url = "$serverUrlRoot/accounts"
        Log.d("AccountService", "Fetching accounts from $url")

        val request = Request.Builder()
            .url(url)
            .build()

        return withContext(Dispatchers.IO) {
            try {
                client.newCall(request).execute().use { response ->
                    val responseBody = response.body?.string()
                    Log.d("AccountService", "HTTP Response: ${response.code} - ${response.message}")

                    if (responseBody == null) {
                        Log.e("AccountService", "Response body is null")
                        return@withContext emptyList<Account>()
                    }

                    if (response.isSuccessful) {
                        return@withContext try {
                            val accounts = Gson().fromJson(responseBody, Array<Account>::class.java).toList()
                            accounts.forEach { account ->
                                Log.d("AccountService", "Account: $account")
                            }
                            accounts
                        } catch (e: Exception) {
                            Log.e("AccountService", "Failed to parse accounts: ${e.message}", e)
                            emptyList()
                        }
                    } else {
                        Log.e("AccountService", "Failed to fetch accounts: ${response.code} - ${response.message}")
                        emptyList()
                    }
                }
            } catch (e: Exception) {
                Log.e("AccountService", "Network error: ${e.message}", e)
                emptyList()
            }
        }
    }

    suspend fun getAccountsIds(): List<String>{
        val accounts = getAccounts()
        val accountsIds = mutableListOf<String>()
        accounts.forEach { account ->
            accountsIds.add(account.userId)
        }
        return accountsIds

    }

    suspend fun getAvatarUrlByUsername(username: String): String? {
        val account = getAccountByUsername(username)
        return account?.avatarUrl
    }

    suspend fun getUserIdByUsername(username: String): String? {
        val account = getAccountByUsername(username)
        return account?.userId
    }

    suspend fun getUsernameByUserId(userId: String): String? {
        val account = getAccountByUserId(userId)
        return account?.pseudonym
    }

    suspend fun getUsersBlockingMe(): List<String?>?{
        val userId = AuthUtils.getUserId(context)
        val account = getAccountByUserId(userId!!)
        return account?.blockingMe
    }

    suspend fun getBlockedUsers():  List<String?>?{
        val userId = AuthUtils.getUserId(context)
        val account = getAccountByUserId(userId!!)
        return account?.blocked
    }

}

