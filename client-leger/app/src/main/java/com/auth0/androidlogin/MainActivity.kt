package com.auth0.androidlogin

import SocketService
import android.content.Context
import android.content.Intent
import com.services.ChatSocketService
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.animation.AnimationUtils
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.lifecycle.lifecycleScope
import com.auth0.android.Auth0
import com.auth0.android.authentication.AuthenticationException
import com.auth0.android.callback.Callback
import com.auth0.android.provider.WebAuthProvider
import com.auth0.android.result.Credentials
import com.auth0.androidlogin.databinding.ActivityMainBinding
import com.google.android.material.snackbar.Snackbar
import interfaces.User
import com.auth0.androidlogin.utils.AuthUtils
import com.services.AccountService
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var account: Auth0
    private var userIsAuthenticated = false
    private var user = User()
    private lateinit var accountService: AccountService
    private lateinit var socketService: SocketService
    private var chatSocket: ChatSocketService = ChatSocketService
    private lateinit var backgroundImage: ImageView
    private val PREF_HAS_RECEIVED_REWARD = "has_received_sign_in_reward"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        account = Auth0(
            getString(R.string.com_auth0_client_id),
            getString(R.string.com_auth0_domain)
        )

        accountService = AccountService(this)

        val logoutMessage = intent.getStringExtra("LOGOUT_MESSAGE")
        if (!logoutMessage.isNullOrEmpty()) {
            showSnackBar(logoutMessage)
        }

        binding.buttonLogin.setOnClickListener { login() }

        binding.buttonSignUp.setOnClickListener { signUp() }

        val bounceAnimation = AnimationUtils.loadAnimation(this, R.anim.bounce)
        binding.buttonLogin.startAnimation(bounceAnimation)  // Start the animation
    }

    private fun login() {
        val errorContainer = findViewById<LinearLayout>(R.id.error_container)
        errorContainer.visibility = View.GONE

        WebAuthProvider
            .login(account)
            .withScheme(getString(R.string.com_auth0_scheme))
            .withParameters(mapOf("prompt" to "login"))  // Forces re-authentication
            .withAudience("https://polyquiz.com/api")
            .start(this, object : Callback<Credentials, AuthenticationException> {
                override fun onFailure(error: AuthenticationException) {
                    val errorDescription = error.getDescription()
                    Log.d("MainActivity", "Authentication failed: $errorDescription")

                    if (errorDescription.contains("You are already logged in on another device")) {
                        Log.d("MainActivity", "Access denied: User is likely logged in elsewhere.")
                        showErrorMessage("Veuillez vous déconnecter de l'autre session active, puis réessayez de vous connecter.")
                    }
                }

                override fun onSuccess(result: Credentials) {
                    val idToken = result.idToken
                    val accessToken = result.accessToken
                    user = User(idToken)
                    val sharedPreferences = getSharedPreferences("shop_prefs", Context.MODE_PRIVATE)
                    sharedPreferences.edit().putBoolean(PREF_HAS_RECEIVED_REWARD, false).apply()

                    Log.d("MainActivity", "ID Token: $idToken")
                    Log.d("MainActivity", "Access Token: $accessToken")
                    Log.d("MainActivity", "User ID: ${user.id}")
                    Log.d("MainActivity", "User Name: ${user.name}")
                    Log.d("MainActivity", "User Email: ${user.email}")
                    // Store user data using AuthUtils
                    AuthUtils.storeUserData(
                        this@MainActivity,
                        user.id,
                        null,
                        //user.picture,
                        accessToken
                    )

                    userIsAuthenticated = true
                    socketService = SocketService
                    socketService.setUserId(user.id)
                    chatSocket.connect()

                    // Fetch the account details
                    lifecycleScope.launch {
                        val account = accountService.getAccount()
                        val currentTheme = accountService.getAccountTheme()
                        AuthUtils.storeUserTheme(this@MainActivity, currentTheme!!)

                        if (account != null) {
                            Log.d("MainActivity", "User Pseudonym: ${account.pseudonym}")
                            // Use account.pseudonym instead of user.name
                            // Now store the pseudonym
                            AuthUtils.storeUserData(
                                this@MainActivity,
                                user.id,
                                account.pseudonym,  // Store the pseudonym instead of user.name
                                //user.picture,
                                accessToken
                            )
                        } else {
                            Log.e("MainActivity", "Failed to fetch account details")
                        }

                        // Determine redirection based on avatarUrl
                        if (account?.avatarUrl.isNullOrEmpty()) {
                            // Redirect to SetAvatarActivity
                            val intent = Intent(this@MainActivity, SetAvatarActivity::class.java).apply {
                                putExtra("USER_ID", user.id)
                            }
                            startActivity(intent)
                            finish()
                        } else {
                            // Redirect to HomeActivity
                            val intent = Intent(this@MainActivity, HomeActivity::class.java).apply {
                                putExtra("USER_NAME", account?.pseudonym ?: user.name)
                                putExtra("USER_EMAIL", user.email)
                                putExtra("USER_PROFILE_PICTURE", account?.avatarUrl ?: user.picture)
                                putExtra("USER_ID", user.id)  // Pass user ID
                            }
                            startActivity(intent)
                            finish()
                        }
                    }
                }
            })
    }


    private fun showErrorMessage(message: String) {

        val errorContainer = findViewById<LinearLayout>(R.id.error_container)
        errorContainer.visibility = View.VISIBLE

        val errorMessage = findViewById<TextView>(R.id.error_message)
        errorMessage.text = message
    }

    private fun signUp() {
        WebAuthProvider
            .login(account)
            .withScheme(getString(R.string.com_auth0_scheme))
            .withAudience("https://polyquiz.com/api")
            .withParameters(mapOf("prompt" to "login"))
            .withParameters(mapOf("screen_hint" to "signup"))
            .start(this, object : Callback<Credentials, AuthenticationException> {
                override fun onFailure(error: AuthenticationException) {
                    showSnackBar(getString(R.string.login_failure_message))
                }

                override fun onSuccess(result: Credentials) {
                    val idToken = result.idToken
                    val accessToken = result.accessToken
                    user = User(idToken)
                    Log.d("MainActivity", "User Name: ${user.id}")
                    Log.d("MainActivity", "User Name: ${user.name}")
                    Log.d("MainActivity", "User Email: ${user.email}")
                    socketService = SocketService
                    socketService.setUserId(user.id)
                    chatSocket.connect()

                    userIsAuthenticated = true
                    // Store user data using AuthUtils
                    AuthUtils.storeUserData(
                        this@MainActivity,
                        user.id,
                        null,
                        //user.picture,
                        result.accessToken
                    )

                    userIsAuthenticated = true

                    // Fetch the account details
                    lifecycleScope.launch {
                        val account = accountService.getAccount()
                        if (account != null) {
                            Log.d("MainActivity", "User Pseudonym: ${account.pseudonym}")
                            AuthUtils.storeUserData(
                                this@MainActivity,
                                user.id,
                                account.pseudonym,
                                //user.picture,
                                accessToken
                            )
                        } else {
                            Log.e("MainActivity", "Failed to fetch account details")
                        }

                        if (account?.avatarUrl.isNullOrEmpty()) {
                            val intent = Intent(this@MainActivity, SetAvatarActivity::class.java).apply {
                                putExtra("USER_ID", user.id)
                            }
                            startActivity(intent)
                            finish()
                        } else {
                            val intent = Intent(this@MainActivity, HomeActivity::class.java).apply {
                                putExtra("USER_NAME", account?.pseudonym ?: user.name)
                                putExtra("USER_EMAIL", user.email)
                                putExtra("USER_PROFILE_PICTURE", account?.avatarUrl ?: user.picture)
                                putExtra("USER_ID", user.id)  // Pass user ID
                            }
                            startActivity(intent)
                            finish()
                        }
                    }
                }
            })
    }

    private fun showSnackBar(text: String) {
        Snackbar
            .make(binding.root, text, Snackbar.LENGTH_LONG)
            .show()
    }

}
