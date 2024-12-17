// RewardDialogFragment.kt
package com.auth0.androidlogin

import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.DialogFragment

class RewardDialogFragment : DialogFragment() {

    // Interface for callback
    interface RewardDialogListener {
        fun onRewardSelected(rewardAmount: Int)
    }

    private var listener: RewardDialogListener? = null

    private lateinit var gift1Container: LinearLayout
    private lateinit var gift2Container: LinearLayout
    private lateinit var gift3Container: LinearLayout
    private lateinit var buttonClaim: Button

    private var selectedReward: Int? = null

    override fun onAttach(context: Context) {
        super.onAttach(context)
        listener = try {
            context as RewardDialogListener
        } catch (e: ClassCastException) {
            throw ClassCastException("$context must implement RewardDialogListener")
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View? {
        Log.d("Reward", "OnCreateView")
        val view = inflater.inflate(R.layout.dialog_sign_in_reward, container, false)

        // Initialize views
        val textViewDialogTitle: TextView = view.findViewById(R.id.textViewDialogTitle)
        gift1Container = view.findViewById(R.id.gift1Container)
        gift2Container = view.findViewById(R.id.gift2Container)
        gift3Container = view.findViewById(R.id.gift3Container)
        buttonClaim = view.findViewById(R.id.buttonClaim)

        // Initially hide the Claim button
        buttonClaim.visibility = View.GONE

        // Randomly assign rewards
        val rewards = listOf(5, 10, 15).shuffled()

        // Assign rewards to gifts
        assignRewardToGift(gift1Container, rewards[0])
        assignRewardToGift(gift2Container, rewards[1])
        assignRewardToGift(gift3Container, rewards[2])

        applyBounceAnimation(gift1Container)
        applyBounceAnimation(gift2Container)
        applyBounceAnimation(gift3Container)

        // Set click listeners
        gift1Container.setOnClickListener { onGiftSelected(gift1Container, rewards[0]) }
        gift2Container.setOnClickListener { onGiftSelected(gift2Container, rewards[1]) }
        gift3Container.setOnClickListener { onGiftSelected(gift3Container, rewards[2]) }

        buttonClaim.setOnClickListener {
            selectedReward?.let {
                listener?.onRewardSelected(it)
                dismiss()
            }
        }
        Log.d("Reward", "ReturnView")
        return view
    }

    private fun applyBounceAnimation(giftContainer: LinearLayout) {
        val giftImageView: ImageView = giftContainer.findViewById(
            when (giftContainer.id) {
                R.id.gift1Container -> R.id.imageViewGift1
                R.id.gift2Container -> R.id.imageViewGift2
                R.id.gift3Container -> R.id.imageViewGift3
                else -> R.id.imageViewGift1
            }
        )
        // Load the bounce animation
        val bounceAnimation: Animation = AnimationUtils.loadAnimation(context, R.anim.bounce)
        // Start the animation
        giftImageView.startAnimation(bounceAnimation)
    }

    /**
     * Assigns the reward amount to the gift's TextView.
     */
    private fun assignRewardToGift(giftContainer: LinearLayout, reward: Int) {
        val textView: TextView = giftContainer.findViewById(
            when (giftContainer.id) {
                R.id.gift1Container -> R.id.textViewGift1
                R.id.gift2Container -> R.id.textViewGift2
                R.id.gift3Container -> R.id.textViewGift3
                else -> R.id.textViewGift1
            }
        )
        textView.text = "$reward" // Set only the number
    }

    /**
     * Handles the gift selection logic.
     */
    private fun onGiftSelected(giftContainer: LinearLayout, reward: Int) {
        if (selectedReward != null) return // Prevent multiple selections

        selectedReward = reward

        // Reveal the reward
        revealReward(giftContainer)

        // Disable other gifts
        disableOtherGifts(giftContainer)

        // Show the Claim button
        buttonClaim.visibility = View.VISIBLE
    }

    /**
     * Reveals the reward by hiding the ImageView and showing the TextView and Cookie ImageView.
     */
    private fun revealReward(giftContainer: LinearLayout) {
        val giftImageView: ImageView = giftContainer.findViewById(
            when (giftContainer.id) {
                R.id.gift1Container -> R.id.imageViewGift1
                R.id.gift2Container -> R.id.imageViewGift2
                R.id.gift3Container -> R.id.imageViewGift3
                else -> R.id.imageViewGift1
            }
        )
        val textView: TextView = giftContainer.findViewById(
            when (giftContainer.id) {
                R.id.gift1Container -> R.id.textViewGift1
                R.id.gift2Container -> R.id.textViewGift2
                R.id.gift3Container -> R.id.textViewGift3
                else -> R.id.textViewGift1
            }
        )
        val cookieImageView: ImageView = giftContainer.findViewById(
            when (giftContainer.id) {
                R.id.gift1Container -> R.id.imgGift1
                R.id.gift2Container -> R.id.imgGift2
                R.id.gift3Container -> R.id.imgGift3
                else -> R.id.imgGift1
            }
        )

        // Animate hiding the gift image
        giftImageView.animate()
            .alpha(0f)
            .setDuration(300)
            .withEndAction {
                giftImageView.visibility = View.GONE
                // Show the reward (TextView and Cookie ImageView) with fade-in animation
                textView.visibility = View.VISIBLE
                textView.alpha = 0f
                cookieImageView.visibility = View.VISIBLE
                cookieImageView.alpha = 0f

                textView.animate().alpha(1f).setDuration(300).start()
                cookieImageView.animate().alpha(1f).setDuration(300).start()
            }
            .start()
    }

    /**
     * Disables other gift containers to prevent further selections.
     */
    private fun disableOtherGifts(selectedGift: LinearLayout) {
        listOf(gift1Container, gift2Container, gift3Container).forEach { gift ->
            if (gift != selectedGift) {
                gift.isClickable = false
                gift.alpha = 0.6f
            }
        }
    }

    override fun onDetach() {
        super.onDetach()
        listener = null
    }
}
