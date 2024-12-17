package com.auth0.androidlogin

import SocketService
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.res.Configuration
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import com.auth0.android.authentication.AuthenticationException
import com.auth0.android.callback.Callback
import com.auth0.android.provider.WebAuthProvider
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.auth0.android.Auth0
import com.auth0.androidlogin.components.CommonHeader
import com.auth0.androidlogin.utils.AuthUtils
import com.google.android.material.snackbar.Snackbar
import com.services.AccountService
import com.services.FriendService
import constants.SERVER_URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.Locale

open class BaseActivity : AppCompatActivity(), CommonHeader.CommonHeaderListener {

    protected lateinit var account: Auth0
    private lateinit var accountService: AccountService
    private var userId: String? = null
    private var currentLanguage: String? = null
    private var currentTheme: String? = null
    private var money: Int = 0
    private lateinit var shopActivityLauncher: ActivityResultLauncher<Intent>
    private lateinit var settingsActivityLauncher: ActivityResultLauncher<Intent>
    private var socketService: SocketService = SocketService
    private lateinit var commonHeader: CommonHeader
    private val SHOP_REQUEST_CODE = 1001


    override fun attachBaseContext(newBase: Context?) {

        val language = newBase?.let { AuthUtils.getUserLanguage(it) } ?: "fr"
        val locale = Locale(language)
        Locale.setDefault(locale)

        val config = Configuration(newBase?.resources?.configuration)
        config.setLocale(locale)

        val context = newBase?.createConfigurationContext(config)
        super.attachBaseContext(context)
        currentLanguage = language
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        currentTheme = AuthUtils.getTheme(this) ?: "light"
        applyTheme(currentTheme!!)
        super.onCreate(savedInstanceState)
        accountService = AccountService(this)
        account = Auth0(
            getString(R.string.com_auth0_client_id),
            getString(R.string.com_auth0_domain)
        )
        userId = AuthUtils.getUserId(this)

        shopActivityLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            if (result.resultCode == RESULT_OK) {
                val updatedCookies = result.data?.getIntExtra("USER_MONEY_BALANCE", money) ?: money
                money = updatedCookies
                commonHeader.setMoneyBalance(money)
            }
        }
        settingsActivityLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            if (result.resultCode == RESULT_OK) {
                val data = result.data
                val themeChanged = data?.getBooleanExtra("THEME_CHANGED", false) ?: false
                val langChanged = data?.getBooleanExtra("LANG_CHANGED", false) ?: false
                Log.d("HomeActivity", "Received themeChanged: $themeChanged")  // Added log
                if (themeChanged || langChanged) {
                    Log.d("HomeActivity", "Theme changed, recreating activity.")
                    recreate()
                }
            }
        }
        Log.d("HomeActivity", "onCreate: Money")
    }

    fun applyTheme(themeName: String) {
        when (themeName.toLowerCase(Locale.ROOT)) {
            "light" -> setTheme(R.style.Theme_AndroidLogin_Light)
            "dark" -> setTheme(R.style.Theme_AndroidLogin_Dark)
            "valentines" -> setTheme(R.style.Theme_AndroidLogin_Valentine)
            "christmas" -> setTheme(R.style.Theme_AndroidLogin_Christmas)
            else -> setTheme(R.style.Theme_AndroidLogin_Light)
        }
        AuthUtils.storeUserTheme(this, themeName)

    }

    fun updateTheme(theme: String) {
        AuthUtils.storeUserTheme(this, theme)
        applyTheme(theme)
    }

    override fun onProfileMenuItemClick(itemId: Int) {
        when (itemId) {
            R.id.menu_history -> {
                navigateToProfileHistory()
            }
            R.id.menu_statistics -> {
                navigateToStatistics()
            }
            R.id.menu_logout -> {
                performLogout()
            }
        }
    }

    override fun onFriendButtonClick() {
        val intent = Intent(this, FriendsActivity::class.java)
        startActivity(intent)
    }
    protected fun navigateToProfileHistory() {
        val intent = Intent(this, ProfileHistoryActivity::class.java).apply {
            putExtra("USER_ID", userId)
        }
        startActivity(intent)
    }

    protected fun navigateToStatistics() {
        val intent = Intent(this, StatisticsActivity::class.java).apply {
            putExtra("USER_ID", userId)
        }
        startActivity(intent)
    }

    protected fun performLogout() {
        logout(userId)
        socketService.disconnect()
    }

    protected fun logout(userId: String?) {
        if (userId == null) {
            Log.e("BaseActivity", "User ID is missing!")
            return
        }
        Log.d("BaseActivity", "User ID for logout: $userId")
        deleteSession(userId) {
            Log.d("BaseActivity", "Session deleted successfully for user: $userId")
            WebAuthProvider
                .logout(account)
                .withScheme(getString(R.string.com_auth0_scheme))
                .start(this, object : Callback<Void?, AuthenticationException> {

                    override fun onFailure(error: AuthenticationException) {
                        Log.e("BaseActivity", "Failed to log out from Auth0: ${error.message}")
                        Snackbar.make(
                            findViewById(android.R.id.content),
                            getString(R.string.general_failure_with_exception_code, error.getCode()),
                            Snackbar.LENGTH_LONG
                        ).show()
                    }

                    override fun onSuccess(result: Void?) {
                        Log.d("BaseActivity", "Logged out from Auth0 successfully")
                        val intent = Intent(this@BaseActivity, MainActivity::class.java).apply {
                            putExtra("LOGOUT_MESSAGE", "Vous avez été déconnecté.")
                        }
                        AuthUtils.clearUserData(this@BaseActivity)
                        startActivity(intent)
                        finish()
                    }
                })
        }
    }

    private fun deleteSession(userId: String, onSuccess: () -> Unit) {
        val client = OkHttpClient()

        val serverUrlRoot = "$SERVER_URL/api"
        val accessToken = AuthUtils.getAccessToken(this)

        val request = Request.Builder()
            .url("$serverUrlRoot/sessions/$userId")
            .addHeader("Authorization", "Bearer $accessToken")
            .delete()
            .build()

        client.newCall(request).enqueue(object : okhttp3.Callback {
            override fun onFailure(call: okhttp3.Call, e: IOException) {
                Log.e("BaseActivity", "Error while deleting session: ${e.message}")
                runOnUiThread {
                    Log.d("BaseActivity", "Error: ${e.message}")
                }
            }

            override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                if (response.isSuccessful) {
                    Log.d("BaseActivity", "Session deleted successfully on server for user: $userId")
                    runOnUiThread {
                        onSuccess()
                    }
                } else {
                    Log.e("BaseActivity", "Failed to delete session on server: ${response.code}")
                    runOnUiThread {
                        Toast.makeText(this@BaseActivity, R.string.failedLogout, Toast.LENGTH_SHORT).show()
                    }
                }
            }
        })
    }

    override fun onSettingsButtonClick() {
        val intent = Intent(this, SettingsActivity::class.java).apply {
            putExtra("USER_ID", userId)
        }
        settingsActivityLauncher.launch(intent)
    }

    override fun onFriendsButtonClick() {
        val intent = Intent(this, FriendsActivity::class.java).apply {
            putExtra("USER_ID", userId)
        }
        startActivity(intent)
    }

    override fun onMoneyButtonClick() {
        val intent = Intent(this, ShopActivity::class.java)
        intent.putExtra("USER_MONEY_BALANCE", money)
        shopActivityLauncher.launch(intent)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == SHOP_REQUEST_CODE && resultCode == RESULT_OK) {
            val updatedCookies = data?.getIntExtra("USER_MONEY_BALANCE", money) ?: money
            money = updatedCookies
            // Update the cookies balance display in HomeActivity's UI
            commonHeader.setMoneyBalance(money) // Ensure CommonHeader has this method
        }
    }

//    override fun onUsernameUpdated(newUsername: String) {
//        commonHeader.setWelcomeText(newUsername)
//        Log.d("HomeActivity", "NEW USER NAME --- $newUsername")
//    }
//
//    override fun onUsernameUpdateFailed(errorMessage: String) {
//        Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show()
//    }

}
