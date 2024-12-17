package com.auth0.androidlogin.fragments

import android.app.Dialog
import android.os.Bundle
import android.util.Log
import android.view.*
import android.widget.Button
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.DialogFragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.auth0.androidlogin.JoinGameActivity
import classes.QuestionAdapter
import com.auth0.androidlogin.R
import com.auth0.androidlogin.models.IQuestion
import com.auth0.androidlogin.utils.AuthUtils
import kotlinx.coroutines.launch

class QuestionsDialogFragment : DialogFragment() {

    private lateinit var questionsRecyclerView: RecyclerView
    private lateinit var closeButton: ImageButton
    private lateinit var joinButton: Button
    private lateinit var questionsAdapter: QuestionAdapter
    private lateinit var feeWarningLayout: View
    private lateinit var feeMessageTextView: TextView
    private lateinit var cookieIcon: ImageView
    private var questionsList: List<IQuestion> = emptyList()
    private var accessCode: String? = null
    private var isAccessible: Boolean = false
    private var isPricedMatch: Boolean = false
    private var matchPrice: Int = 0
    private lateinit var blockedWarningLayout: View
    private lateinit var blockedMessageTextView: TextView
    private lateinit var banIconImageView: ImageView

    companion object {
        private const val ARG_QUESTIONS = "arg_questions"
        private const val ARG_ACCESS_CODE = "arg_access_code"
        private const val ARG_IS_ACCESSIBLE = "arg_is_accessible"
        private const val ARG_IS_PRICED_MATCH = "arg_is_priced_match"
        private const val ARG_MATCH_PRICE = "arg_match_price"

        fun newInstance(questions: ArrayList<IQuestion>, accessCode: String, isAccessible: Boolean,
                        isPricedMatch: Boolean, matchPrice: Number): QuestionsDialogFragment {
            val fragment = QuestionsDialogFragment()
            val args = Bundle()
            args.putSerializable(ARG_QUESTIONS, questions) // Utilisez ArrayList pour Serializable
            args.putString(ARG_ACCESS_CODE, accessCode)
            args.putBoolean(ARG_IS_ACCESSIBLE, isAccessible)
            args.putBoolean(ARG_IS_PRICED_MATCH, isPricedMatch)
            args.putInt(ARG_MATCH_PRICE, matchPrice.toInt())
            fragment.arguments = args
            return fragment
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            questionsList = it.getSerializable(ARG_QUESTIONS) as ArrayList<IQuestion>
            accessCode = it.getString(ARG_ACCESS_CODE)
            isAccessible = it.getBoolean(ARG_IS_ACCESSIBLE, false)
            isPricedMatch = it.getBoolean(ARG_IS_PRICED_MATCH, false)
            matchPrice = it.getInt(ARG_MATCH_PRICE, 0)
            Log.d("QuestionsDialogFragment", "Received accessCode: $accessCode, questionsList size: ${questionsList.size}")
        }
    }

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val dialog = super.onCreateDialog(savedInstanceState)
        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View? {
        val view = inflater.inflate(R.layout.fragment_questions_dialog, container, false)

        questionsRecyclerView = view.findViewById(R.id.questionsRecyclerView)
        closeButton = view.findViewById(R.id.closeButton)
        joinButton = view.findViewById(R.id.joinButton)
        feeWarningLayout = view.findViewById(R.id.feeWarningLayout)
        feeMessageTextView = view.findViewById(R.id.feeMessageTextView)
        cookieIcon = view.findViewById(R.id.cookieIcon)
        blockedWarningLayout = view.findViewById(R.id.blockedWarningLayout)
        blockedMessageTextView = view.findViewById(R.id.blockMessageTextView)
        banIconImageView = view.findViewById(R.id.banIconImageView)

        // Configurer RecyclerView
        questionsRecyclerView.layoutManager = LinearLayoutManager(context)
        questionsAdapter = QuestionAdapter(questionsList.toMutableList())
        questionsRecyclerView.adapter = questionsAdapter

        // Gérer le clic sur le bouton de fermeture
        closeButton.setOnClickListener {
            dismiss()
        }

        (activity as? JoinGameActivity)?.let { activity ->
            lifecycleScope.launch {
                try {
                    val accessToken = AuthUtils.getAccessToken(activity)
                    val match = activity.gameService.getMatchByAccessCode(accessToken!!, accessCode!!)
                    if (match == null) {
                        Log.e("QuestionsDialogFragment", "No match found for access code: $accessCode")
                        dismiss()
                        return@launch
                    }
                    val rawBlockedUserIds = activity.accountService.getBlockedUsers() ?: emptyList()
                    val blockedUsernames = rawBlockedUserIds.mapNotNull { userId ->
                        activity.accountService.getUsernameByUserId(userId!!)
                    }
                    val rawBlockingMeUserIds = activity.accountService.getUsersBlockingMe() ?: emptyList()
                    val blockingUsernames = rawBlockingMeUserIds.mapNotNull { userId ->
                        activity.accountService.getUsernameByUserId(userId!!)
                    }

                    val blockedPlayers = match.players.filter { player ->
                        blockedUsernames.contains(player.name)
                    }

                    val blockingPlayers = match.players.filter { player ->
                        blockingUsernames.contains(player.name)
                    }

                    if (blockedPlayers.isNotEmpty()) {
                        // Show blocked warning
                        blockedWarningLayout.visibility = View.VISIBLE
                        blockedMessageTextView.text = getString(R.string.blocked_users_in_match)
                        joinButton.visibility = View.VISIBLE
                        joinButton.setOnClickListener{
                            activity.joinGame(accessCode!!)
                            dismiss()
                        }
                    } else {
                        if(blockingPlayers.isNotEmpty()) {
                            blockedWarningLayout.visibility = View.VISIBLE
                            blockedMessageTextView.text = getString(R.string.error_blocking_players_in_game)
                            joinButton.visibility = View.GONE
                            joinButton.isEnabled = false
                            joinButton.alpha = 0f
                            joinButton.layoutParams.height = 0
                            joinButton.layoutParams.width = 0
                        }
                        else{
                            blockedWarningLayout.visibility = View.GONE
                            joinButton.isEnabled = true
                        }

                        if (isAccessible) {
                            joinButton.visibility = View.VISIBLE
                            joinButton.setOnClickListener {
                                if (isPricedMatch) {
                                    if (activity.money < matchPrice) {
                                        activity.showNotEnoughCookiesDialog()
                                        dismiss()
                                        return@setOnClickListener
                                    }
                                    activity.lifecycleScope.launch {
                                        val currentMoney = activity.accountService.getAccountMoney()
                                        val newMoney = currentMoney?.minus(matchPrice)
                                        val deductionSuccess = activity.accountService.updateAccountMoney(newMoney!!)
                                        if (deductionSuccess) {
                                            activity.commonHeader.setMoneyBalance(activity.money)
                                            activity.joinGame(accessCode!!)
                                            Toast.makeText(context, getString(R.string.cookie_deducted_successfully, matchPrice), Toast.LENGTH_SHORT).show()
                                            dismiss()
                                        }
                                    }
                                } else {
                                    activity.joinGame(accessCode!!)
                                    dismiss()
                                }
                            }
                        } else {
                            joinButton.visibility = View.GONE
                        }
                    }
                } catch (e: Exception) {
                    Log.e("QuestionsDialogFragment", "Error checking blocked users: ${e.message}")
                }
            }
        }


        if (isPricedMatch && isAccessible) {
            feeWarningLayout.visibility = View.VISIBLE
            feeMessageTextView.text = getString(R.string.fee_dialog, matchPrice)
        } else {
            feeWarningLayout.visibility = View.GONE
        }

        return view
    }
}
