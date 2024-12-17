package com.auth0.androidlogin.utils

import android.content.Context
import android.content.SharedPreferences
import android.util.Log

object AuthUtils {
    private const val PREFS_NAME = "auth_prefs"
    private const val KEY_USER_ID = "USER_ID"
    const val KEY_USER_NAME = "USER_NAME"
    const val KEY_USER_PROFILE_PICTURE_RES_ID = "USER_PROFILE_PICTURE_RES_ID"
    const val KEY_USER_PROFILE_PICTURE_URL = "USER_PROFILE_PICTURE_URL"
    private const val KEY_ACCESS_TOKEN = "ACCESS_TOKEN"
    private const val KEY_SELECTED_LANGUAGE = "SELECTED_LANGUAGE"
    const val KEY_USER_PROFILE_PICTURE_BASE64 = "USER_PROFILE_PICTURE_BASE64"
    const val KEY_COOKIES_BALANCE = "COOKIES_BALANCE"
    const val KEY_FRIEND_REQUEST_COUNT = "FRIEND_REQUEST_COUNT"

    fun getSharedPreferences(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun getUserId(context: Context): String? {
        val sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return sharedPreferences.getString(KEY_USER_ID, null)
    }

    fun getUserLanguage(context: Context): String? {
        val sharedPreferences = getSharedPreferences(context)
        return sharedPreferences.getString(KEY_SELECTED_LANGUAGE, "fr") // Default is "fr"
    }

    fun getTheme(context: Context): String? {
        val sharedPreferences = getSharedPreferences(context)
        return sharedPreferences.getString("SELECTED_THEME", "light") // Default is "light"
    }

    fun storeUserTheme(context: Context, theme: String) {
        val sharedPreferences = getSharedPreferences(context)
        with(sharedPreferences.edit()) {
            putString("SELECTED_THEME", theme)
            apply()  // Save theme preference
        }
    }


    fun storeUserLanguage(context: Context, language: String) {
        val sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        with(sharedPreferences.edit()) {
            putString(KEY_SELECTED_LANGUAGE, language)
            apply()  // Save language preference
        }
    }

    fun getUserName(context: Context): String? {
        val sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return sharedPreferences.getString(KEY_USER_NAME, null)
    }

    fun getAccessToken(context: Context): String? {
        val sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return sharedPreferences.getString(KEY_ACCESS_TOKEN, null)
    }

    fun storeUserProfilePicture(context: Context, resId: Int, imageUrl: String) {
        with(getSharedPreferences(context).edit()) {
            putInt(KEY_USER_PROFILE_PICTURE_RES_ID, resId)
            putString(KEY_USER_PROFILE_PICTURE_URL, imageUrl)
            putString(KEY_USER_PROFILE_PICTURE_BASE64, "")
            apply()
        }
        Log.d("AuthUtils", "Stored profile picture: ResID=$resId, ImageURL=$imageUrl")
    }

    fun storeUserProfilePicture(context: Context, base64Image: String) {
        with(getSharedPreferences(context).edit()) {
            putString(KEY_USER_PROFILE_PICTURE_BASE64, base64Image)
            putInt(KEY_USER_PROFILE_PICTURE_RES_ID, 0)
            putString(KEY_USER_PROFILE_PICTURE_URL, "")
            apply()
        }
        Log.d("AuthUtils", "Stored custom profile picture base64.")
    }

    fun getUserProfilePictureBase64(context: Context): String? {
        return getSharedPreferences(context).getString(KEY_USER_PROFILE_PICTURE_BASE64, null)
    }

    fun getUserProfilePictureResourceId(context: Context): Int? {
        val resId = getSharedPreferences(context).getInt(KEY_USER_PROFILE_PICTURE_RES_ID, -1)
        return if (resId != -1) resId else null
    }

    fun getUserProfilePicture(context: Context): Pair<Int?, String?> {
        val resId = getUserProfilePictureResourceId(context)
        val base64 = getUserProfilePictureBase64(context)
        return Pair(resId, base64)
    }


    fun getUserProfilePictureUrl(context: Context): String? {
        return getSharedPreferences(context).getString(KEY_USER_PROFILE_PICTURE_URL, null)
    }

    fun clearUserData(context: Context) {
        val sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        with(sharedPreferences.edit()) {
            clear()
            apply()
        }
    }

    fun storeUserName(context: Context, userName: String) {
        with(getSharedPreferences(context).edit()) {
            putString(KEY_USER_NAME, userName)
            apply()
        }
        Log.d("AuthUtils", "Stored new username: $userName")
    }

//    fun storeUserID(context: Context, userId: String) {
//        with(getSharedPreferences(context).edit()) {
//            putString(KEY_USER_ID, userId)
//            apply()
//        }
//        Log.d("AuthUtils", "Stored new userId: $userId")
//    }

    fun storeCookieBalance(context: Context, balance: Int) {
        val sharedPreferences = getSharedPreferences(context)
        with(sharedPreferences.edit()) {
            putInt(KEY_COOKIES_BALANCE, balance)
            apply()
        }
    }

    fun getCookieBalance(context: Context): Int {
        val sharedPreferences = getSharedPreferences(context)
        return sharedPreferences.getInt(KEY_COOKIES_BALANCE, 0)
    }

    fun storeFriendRequestCount(context: Context, count: Int) {
        val sharedPreferences = getSharedPreferences(context)
        with(sharedPreferences.edit()) {
            putInt(KEY_FRIEND_REQUEST_COUNT, count)
            apply()
        }
        Log.d("AuthUtils", "Stored friend request count: $count")
    }

    fun getFriendRequestCount(context: Context): Int {
        val sharedPreferences = getSharedPreferences(context)
        return sharedPreferences.getInt(KEY_FRIEND_REQUEST_COUNT, 0)
    }


    fun storeUserData(
        context: Context,
        userId: String,
        userName: String?,
//        userProfilePictureUrl: String?,
//        userProfilePictureID: Int,
        accessToken: String
    ) {
        val sharedPreferences = getSharedPreferences(context)
        with(sharedPreferences.edit()) {
            putString(KEY_USER_ID, userId)
            putString(KEY_USER_NAME, userName)
//            putString(KEY_USER_PROFILE_PICTURE_RES_ID, userProfilePictureID.toString())
//            putString(KEY_USER_PROFILE_PICTURE_URL, userProfilePictureUrl)
            putString(KEY_ACCESS_TOKEN, accessToken)
            apply() // Asynchronously save the changes
        }
    }


}
