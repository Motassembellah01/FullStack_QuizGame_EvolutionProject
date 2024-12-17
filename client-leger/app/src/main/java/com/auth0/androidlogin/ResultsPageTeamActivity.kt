package com.auth0.androidlogin

import MatchService
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.auth0.androidlogin.adapters.TeamResultsAdapter
import com.auth0.androidlogin.databinding.ActivityResultsPageTeamBinding
import com.auth0.androidlogin.models.IPlayer
import classes.Player
import classes.Team
import com.auth0.androidlogin.utils.AuthUtils
import com.services.AccountService

class ResultsPageTeamActivity : BaseActivity() {

    private lateinit var binding: ActivityResultsPageTeamBinding
    private lateinit var adapter: TeamResultsAdapter
    private lateinit var homeButton: Button
    private val matchService: MatchService = MatchService
    private lateinit var currentUserName: String
    private lateinit var accountService: AccountService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityResultsPageTeamBinding.inflate(layoutInflater)
        setContentView(binding.root)
        currentUserName = AuthUtils.getUserName(this)!!

        // Initialize RecyclerView
        adapter = TeamResultsAdapter()
        binding.teamResultsRecyclerView.layoutManager = LinearLayoutManager(this)
        binding.teamResultsRecyclerView.adapter = adapter

        homeButton = findViewById(R.id.backToHomeButton)
        accountService = AccountService(this)


        // Sort Teams by Team Score Descending
        val sortedTeams = this.matchService.match!!.teams.sortedByDescending { it.teamScore }

        // Assign Data to Adapter
        adapter.submitList(sortedTeams)

        // Highlight the Winner (First Place)
        adapter.setWinnerPosition(0)

        val userTeam = findUserTeam(sortedTeams, currentUserName)

        val userTeamPosition = sortedTeams.indexOfFirst { it == userTeam }
        Log.d("ResultsPageTeamActivity", "User Team Position: $userTeamPosition")

        val isPricedMatch = this.matchService.match?.isPricedMatch ?: false
        Log.d("ResultsPageTeamActivity", "isPricedMatch: $isPricedMatch")

        val message = if (userTeamPosition == 0) {
            if (isPricedMatch) {
                getString(R.string.priceSoloWinP)
            } else {
                getString(R.string.priceSoloWin)
            }
        } else {
            if (isPricedMatch) {
                getString(R.string.priceSoloLoseP)
            } else {
                getString(R.string.priceSoloLose)
            }
        }

        Toast.makeText(this, message, Toast.LENGTH_LONG).show()


        homeButton.setOnClickListener {
        navigateToHome()
        }

    }

    private fun navigateToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        this.matchService.leaveMatchRoom()
        startActivity(intent)
        finish()
    }

    private fun findUserTeam(sortedTeams: List<Team>, userName: String): Team? {
        return sortedTeams.find { team ->
            team.players.any { it.equals(userName, ignoreCase = true) }
        }
    }

}
