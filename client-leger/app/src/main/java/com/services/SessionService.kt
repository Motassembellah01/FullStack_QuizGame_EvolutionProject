package com.auth0.androidlogin.services

import constants.SERVER_URL
import android.content.Context
import android.util.Log
import com.auth0.androidlogin.models.Account
import com.auth0.androidlogin.models.MatchHistory
import com.auth0.androidlogin.models.Session
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.auth0.androidlogin.utils.AuthUtils
import com.services.AccountService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException

class SessionService(private val context: Context) {

    private val client = OkHttpClient()
    private val serverUrlRoot = "$SERVER_URL/api" // Replace with actual server URL

    suspend fun getSessionHistory(): List<Session>? {
        val userId = AuthUtils.getUserId(context)
        val accessToken = AuthUtils.getAccessToken(context)

        if (userId.isNullOrEmpty() || accessToken.isNullOrEmpty()) {
            Log.e("SessionService", "User ID or Access Token is missing.")
            return null
        }

        val url = "$serverUrlRoot/sessions/history/$userId"

        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val responseBody = response.body?.string()
                Log.d("SessionService", "Response Body: $responseBody")
                responseBody?.let {
                    val gson = Gson()
                    val type = object : TypeToken<List<Session>>() {}.type
                    gson.fromJson<List<Session>>(it, type)
                }
            } else {
                Log.e("SessionService", "Error: ${response.code} - ${response.message}")
                Log.e("SessionService", "Response Body: ${response.body?.string()}")
                null
            }
        } catch (e: IOException) {
            Log.e("SessionService", "Network Error: ${e.message}")
            null
        }
    }

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

    suspend fun getPlayedGamesHistory(): List<MatchHistory>? {
        val account = getAccount()
        return account?.matchHistory
    }
}
