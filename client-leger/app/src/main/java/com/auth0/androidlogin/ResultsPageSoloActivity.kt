package com.auth0.androidlogin

import MatchService
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import classes.Match
import com.auth0.androidlogin.databinding.ActivityResultsPageSoloBinding
import classes.Player
import com.auth0.androidlogin.adapters.SoloResultsAdapter
import com.auth0.androidlogin.utils.AuthUtils
import com.google.android.material.snackbar.Snackbar
import com.services.AccountService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ResultsPageSoloActivity : BaseActivity() {

    private lateinit var binding: ActivityResultsPageSoloBinding
    private lateinit var adapter: SoloResultsAdapter
    private lateinit var homeButton: Button
    private val matchService: MatchService = MatchService
    private lateinit var accountService: AccountService
    private lateinit var currentUserName: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityResultsPageSoloBinding.inflate(layoutInflater)
        setContentView(binding.root)
        currentUserName = AuthUtils.getUserName(this)!!

        // Initialize RecyclerView
        adapter = SoloResultsAdapter()
        binding.soloResultsRecyclerView.layoutManager = LinearLayoutManager(this)
        binding.soloResultsRecyclerView.adapter = adapter

        homeButton = findViewById(R.id.backToHomeButton)
        accountService = AccountService(this)

        val sortedPlayers = this.matchService.match!!.players.sortedByDescending { it.score }

        adapter.submitList(sortedPlayers)

        adapter.setWinnerPosition(0)
        val currentUserPosition = sortedPlayers.indexOfFirst { it.name == currentUserName }

        val isPricedMatch = this.matchService.match?.isPricedMatch ?: false
        val message = if (currentUserPosition == 0) {
            if (isPricedMatch) {
                R.string.priceSoloWinP
            } else {
                R.string.priceSoloWin
            }
        } else {
            if (isPricedMatch) {
                R.string.priceSoloLoseP
            } else {
                R.string.priceSoloLose
            }
        }

        Toast.makeText(this, message, Toast.LENGTH_LONG).show()


        homeButton.setOnClickListener {
            navigateToHome()
        }

    }

    override fun onDestroy() {
        super.onDestroy()
        this.matchService.leaveMatchRoom()
    }

    private fun navigateToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        startActivity(intent)
        finish()
    }
}
