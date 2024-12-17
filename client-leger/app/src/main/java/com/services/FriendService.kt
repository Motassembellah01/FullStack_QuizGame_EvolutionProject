package com.services

import android.content.Context
import android.util.Log
import com.auth0.androidlogin.utils.AuthUtils
import constants.SERVER_URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

import okhttp3.MediaType.Companion.toMediaTypeOrNull


class FriendService(private val context: Context) {

    private val client = OkHttpClient()
    private val serverUrlRoot = "$SERVER_URL/api"

    suspend fun sendFriendRequest(receiverId: String): Boolean {
        val userId = AuthUtils.getUserId(context) ?: return false
        val url = "$serverUrlRoot/friends/send/$userId/$receiverId"
        return performPostRequest(url, "{}")
    }

    suspend fun acceptFriendRequest(requestId: String): Boolean {
        val url = "$serverUrlRoot/friends/accept/$requestId"
        return performPostRequest(url, "{}")
    }

    suspend fun rejectFriendRequest(requestId: String): Boolean {
        val url = "$serverUrlRoot/friends/reject/$requestId"
        return performPostRequest(url, "{}")
    }

    suspend fun removeFriend(friendId: String): Boolean {
        val userId = AuthUtils.getUserId(context) ?: return false
        val url = "$serverUrlRoot/friends/remove/$userId/$friendId" // Ajustez l'URL si nécessaire

        return try {
            val request = Request.Builder()
                .url(url)
                .delete()
                .addHeader("Authorization", "Bearer ${AuthUtils.getAccessToken(context)}")
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                Log.d("FriendService", "Friend removed successfully: $friendId")
                true
            } else {
                Log.e("FriendService", "Failed to remove friend: ${response.code} - ${response.message}")
                false
            }
        } catch (e: Exception) {
            Log.e("FriendService", "Error removing friend: ${e.message}", e)
            false
        }
    }

    private suspend fun performPostRequest(url: String, jsonPayload: String): Boolean {
        val accessToken = AuthUtils.getAccessToken(context) ?: return false

        val requestBody = jsonPayload.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return executeRequest(request)
    }

    private suspend fun performDeleteRequest(url: String): Boolean {
        val accessToken = AuthUtils.getAccessToken(context) ?: return false

        val request = Request.Builder()
            .url(url)
            .delete()
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return executeRequest(request)
    }

    private suspend fun executeRequest(request: Request): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    Log.d("FriendService", "Request successful: ${response.code}")
                    true
                } else {
                    Log.e("FriendService", "Request failed: ${response.code} - ${response.message}")
                    false
                }
            } catch (e: IOException) {
                Log.e("FriendService", "Network error: ${e.message}")
                false
            }
        }
    }

    suspend fun blockNormalUser(blockUserId: String): Boolean {
        val userId = AuthUtils.getUserId(context) ?: return false
        val url = "$serverUrlRoot/friends/block/$userId/$blockUserId"
        return performPostRequest(url, "{}")
    }

    suspend fun blockFriend(blockUserId: String): Boolean {
        val userId = AuthUtils.getUserId(context) ?: return false
        val url = "$serverUrlRoot/friends/blockFriend/$userId/$blockUserId"
        return performPostRequest(url, "{}")
    }

    suspend fun blockUserWithPendingRequest(blockUserId: String): Boolean {
        val userId = AuthUtils.getUserId(context) ?: return false
        val url = "$serverUrlRoot/friends/blockUserWithPendingRequest/$userId/$blockUserId"
        return performPostRequest(url, "{}")
    }
}
