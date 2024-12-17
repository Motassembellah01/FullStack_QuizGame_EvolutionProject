package com.services

import constants.SERVER_URL
import android.util.Log
import classes.Game
import classes.Match
import com.auth0.androidlogin.models.IGame
import com.auth0.androidlogin.models.IMatch
import com.auth0.androidlogin.models.Matches
import com.google.gson.Gson
import interfaces.dto.CreateMatchDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import com.google.gson.reflect.TypeToken
import okhttp3.OkHttpClient
import okhttp3.Request

class GameService {

    private val client = OkHttpClient()
    private val serverUrlRoot = "$SERVER_URL/api" // Replace with your actual server URL
    private val gson = Gson()

    suspend fun getGameById(accessToken: String, gameId: String): Game? {
        val url = "$serverUrlRoot/games/$gameId"
        Log.d("GameService", "Fetching game by ID from URL: $url")

        val request = Request.Builder()
            .url(url)
            .get()
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            try {
                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                    Log.d("GameService", "Response Body: $responseBody")

                    if (responseBody != null) {
                        try {
                            val iGame: IGame = Gson().fromJson(responseBody, IGame::class.java)
                            Log.d("GameService", "Parsed Game: $iGame")
                            Game.parseGame(iGame)
                        } catch (e: Exception) {
                            Log.e("GameService", "Failed to parse game: ${e.localizedMessage}")
                            null
                        }
                    } else {
                        Log.e("GameService", "Response body is null.")
                        null
                    }
                } else {
                    val errorBody = response.body?.string()
                    Log.e("GameService", "Error: ${response.code} - ${response.message}")
                    Log.e("GameService", "Error Body: $errorBody")
                    null
                }
            } catch (e: Exception) {
                Log.e("GameService", "Exception during getGameById: ${e.localizedMessage}", e)
                null
            }
        }
    }

    suspend fun createMatch(accessToken: String, dto: CreateMatchDto): Match? {
        val url = "$serverUrlRoot/matches/match"
        Log.d("GameService", "Creating match at URL: $url")
        Log.d("GameService", "ACCESS TOKEN: $accessToken")
        val json = Gson().toJson(dto)
        val body = json.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
        Log.d("GameService", "Body of request: $body")

        val request = Request.Builder()
            .url(url)
            .post(body)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            try {
                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                    Log.d("GameService", responseBody!!)
                    val matchObject = Gson().fromJson(responseBody, IMatch::class.java)
                    Match.parseMatch(matchObject)

                } else {
                    val errorBody = response.body?.string()
                    Log.e("GameService", "Failed to create match. Error: ${response.code} - ${response.message}")
                    Log.e("GameService", "Error Body: $errorBody")
                    null
                }
            } catch (e: Exception) {
                Log.e("GameService", "Exception during createMatch: ${e.localizedMessage}", e)
                null
            }
        }
    }

    suspend fun setMatchAccessibility(accessToken: String, accessCode: String, isAccessible: Boolean): Boolean {
        val url = "$serverUrlRoot/matches/match/accessibility/$accessCode"
        Log.d("GameService", "Setting match accessibility at URL: $url to isAccessible: $isAccessible")

        // Create JSON payload
        val jsonPayload = gson.toJson(mapOf("isAccessible" to isAccessible))
        val body = jsonPayload.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

        val request = Request.Builder()
            .url(url)
            .patch(body)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            try {
                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    Log.d("GameService", "Successfully set match accessibility to $isAccessible.")
                    true
                } else {
                    val errorBody = response.body?.string()
                    Log.e("GameService", "Failed to set match accessibility. Error: ${response.code} - ${response.message}")
                    Log.e("GameService", "Error Body: $errorBody")
                    false
                }
            } catch (e: Exception) {
                Log.e("GameService", "Exception during setMatchAccessibility: ${e.localizedMessage}", e)
                false
            }
        }
    }

    suspend fun getAllMatches(accessToken: String): List<Matches>? {
        val url = "$serverUrlRoot/matches"
        Log.d("GameService", "Fetching all matches from URL: $url")

        val request = Request.Builder()
            .url(url)
            .get()
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            try {
                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                    Log.d("GameService", "Response Body: $responseBody")

                    if (responseBody != null) {
                        try {
                            val matchListType = object : TypeToken<List<Matches>>() {}.type
                            val matches: List<Matches> = gson.fromJson(responseBody, matchListType)
                            Log.d("GameService", "Parsed Matches: $matches")
                            matches
                        } catch (e: Exception) {
                            Log.e("GameService", "Failed to parse matches: ${e.localizedMessage}")
                            null
                        }
                    } else {
                        Log.e("GameService", "Response body is null.")
                        null
                    }
                } else {
                    val errorBody = response.body?.string()
                    Log.e("GameService", "Error: ${response.code} - ${response.message}")
                    Log.e("GameService", "Error Body: $errorBody")
                    null
                }
            } catch (e: Exception) {
                Log.e("GameService", "Exception during getAllMatches: ${e.localizedMessage}", e)
                null
            }
        }
    }

    suspend fun getMatchByAccessCode(accessToken: String, accessCode: String): Match? {
        val url = "$serverUrlRoot/matches/match/$accessCode"
        Log.d("GameService", "Fetching match by Access Code from URL: $url")

        val request = Request.Builder()
            .url(url)
            .get()
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            try {
                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                    Log.d("GameService", "Response Body: $responseBody")

                    if (responseBody != null) {
                        try {
                            val match: Match = Gson().fromJson(responseBody, Match::class.java)
                            Log.d("GameService", "Parsed Match: $match")
                            match
                        } catch (e: Exception) {
                            Log.e("GameService", "Failed to parse match: ${e.localizedMessage}")
                            null
                        }
                    } else {
                        Log.e("GameService", "Response body is null.")
                        null
                    }
                } else {
                    val errorBody = response.body?.string()
                    Log.e("GameService", "Error: ${response.code} - ${response.message}")
                    Log.e("GameService", "Error Body: $errorBody")
                    null
                }
            } catch (e: Exception) {
                Log.e("GameService", "Exception during getMatchByAccessCode: ${e.localizedMessage}", e)
                null
            }
        }
    }

    suspend fun deleteMatch(accessToken: String, accessCode: String): Boolean {
        val url = "$serverUrlRoot/matches/match/$accessCode"
        Log.d("GameService", "Deleting match at URL: $url")

        val request = Request.Builder()
            .url(url)
            .delete()
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            try {
                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    Log.d("GameService", "Match deleted successfully.")
                    true
                } else {
                    val errorBody = response.body?.string()
                    Log.e("GameService", "Failed to delete match. Error: ${response.code} - ${response.message}")
                    Log.e("GameService", "Error Body: $errorBody")
                    false
                }
            } catch (e: Exception) {
                Log.e("GameService", "Exception during deleteMatch: ${e.localizedMessage}", e)
                false
            }
        }

    }

//    suspend fun toggleTeamMatch(accessToken: String, accessCode: String, isTeamMatch: Boolean): Boolean {
//        val url = "$serverUrlRoot/matches/match/accessibility/$accessCode"
//        Log.d("GameService", "Toggling team match at URL: $url with isTeamMatch: $isTeamMatch")
//
//        // Create JSON payload
//        val json = Gson().toJson(mapOf("isTeamMatch" to isTeamMatch))
//        val body = json.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
//
//        val request = Request.Builder()
//            .url(url)
//            .patch(body)
//            .addHeader("Authorization", "Bearer $accessToken")
//            .build()
//
//        return withContext(Dispatchers.IO) {
//            try {
//                val response = client.newCall(request).execute()
//                if (response.isSuccessful) {
//                    Log.d("GameService", "Successfully toggled team match.")
//                    true
//                } else {
//                    val errorBody = response.body?.string()
//                    Log.e("GameService", "Failed to toggle team match. Error: ${response.code} - ${response.message}")
//                    Log.e("GameService", "Error Body: $errorBody")
//                    false
//                }
//            } catch (e: Exception) {
//                Log.e("GameService", "Exception during toggleTeamMatch: ${e.localizedMessage}", e)
//                false
//            }
//        }
//    }

}
